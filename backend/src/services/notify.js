import db, { nowIso } from '../db.js';

// 微信订阅消息配置（从环境变量读取）
const WECHAT_SUBSCRIBE_TEMPLATE_ID = process.env.WECHAT_SUBSCRIBE_TEMPLATE_ID || '';
const WECHAT_ACCESS_TOKEN_URL = process.env.WECHAT_ACCESS_TOKEN_URL || '';
const WECHAT_APP_ID = process.env.WECHAT_APP_ID || '';
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET || '';

// 企业微信应用消息配置
const CORP_ID = process.env.WECHAT_CORP_ID || '';
const CORP_SECRET = process.env.WECHAT_CORP_SECRET || '';
const AGENT_ID = process.env.WECHAT_AGENT_ID || '';

/**
 * 获取微信公众号 access_token
 */
async function getWechatAccessToken() {
  if (!WECHAT_APP_ID || !WECHAT_APP_SECRET) {
    return null;
  }
  
  try {
    const response = await fetch(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}`
    );
    const result = await response.json();
    return result.access_token;
  } catch (error) {
    console.error('获取微信 access_token 失败:', error);
    return null;
  }
}

/**
 * 获取企业微信 access_token
 */
async function getCorpAccessToken() {
  if (!CORP_ID || !CORP_SECRET) {
    return null;
  }
  
  try {
    const response = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${CORP_ID}&corpsecret=${CORP_SECRET}`
    );
    const result = await response.json();
    return result.access_token;
  } catch (error) {
    console.error('获取企业微信 access_token 失败:', error);
    return null;
  }
}

/**
 * 发送微信订阅消息
 * @param {string} openid - 用户 openid
 * @param {object} templateData - 模板数据
 */
async function sendWechatSubscribeMessage(openid, templateData) {
  if (!WECHAT_SUBSCRIBE_TEMPLATE_ID) {
    console.log('[开发模式] 跳过微信订阅消息发送');
    return false;
  }
  
  try {
    const accessToken = await getWechatAccessToken();
    if (!accessToken) return false;
    
    const response = await fetch(
      `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touser: openid,
          template_id: WECHAT_SUBSCRIBE_TEMPLATE_ID,
          ...templateData
        })
      }
    );
    
    const result = await response.json();
    if (result.errcode === 0) {
      console.log('微信订阅消息发送成功');
      return true;
    } else {
      console.error('微信订阅消息发送失败:', result);
      return false;
    }
  } catch (error) {
    console.error('微信订阅消息发送异常:', error);
    return false;
  }
}

/**
 * 发送企业微信应用消息
 * @param {string} userId - 用户 ID（学号/工号）
 * @param {string} title - 消息标题
 * @param {string} content - 消息内容
 */
async function sendWechatWorkMessage(userId, title, content) {
  if (!CORP_ID || !AGENT_ID) {
    console.log('[开发模式] 跳过企业微信消息发送');
    return false;
  }
  
  try {
    const accessToken = await getCorpAccessToken();
    if (!accessToken) return false;
    
    const response = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touser: userId,
          msgtype: 'textcard',
          agentid: AGENT_ID,
          textcard: {
            title: title,
            description: content,
            url: 'https://lostfound.xxx.edu.cn' // 系统 URL
          }
        })
      }
    );
    
    const result = await response.json();
    if (result.errcode === 0) {
      console.log('企业微信消息发送成功');
      return true;
    } else {
      console.error('企业微信消息发送失败:', result);
      return false;
    }
  } catch (error) {
    console.error('企业微信消息发送异常:', error);
    return false;
  }
}

/**
 * 发送通知（站内通知 + 可选的微信推送）
 * @param {number} userId - 用户 ID
 * @param {number} bizType - 业务类型：1-审核通知，2-公告通知，3-认领通知
 * @param {number|null} bizId - 业务 ID
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 */
export async function notify(userId, bizType, bizId, title, content) {
  // 1. 插入站内通知
  db.prepare(`INSERT INTO notifications(user_id, biz_type, biz_id, title, content, is_read, created_at)
    VALUES(?, ?, ?, ?, ?, 0, ?)`)
    .run(userId, bizType, bizId || null, title, content, nowIso());
  
  // 2. 获取用户信息（用于微信推送）
  const user = db.prepare('SELECT openid, student_no, staff_no FROM users WHERE id = ?').get(userId);
  if (!user) return;
  
  // 3. 发送微信订阅消息（如果配置了）
  if (user.openid && WECHAT_SUBSCRIBE_TEMPLATE_ID) {
    const templateData = {
      page: 'pages/messages/messages',
      data: {
        thing1: { value: title },
        thing2: { value: content }
      }
    };
    await sendWechatSubscribeMessage(user.openid, templateData);
  }
  
  // 4. 发送企业微信消息（如果配置了且有用户账号）
  const identityNo = user.student_no || user.staff_no;
  if (identityNo) {
    await sendWechatWorkMessage(identityNo, title, content);
  }
}

/**
 * 批量发送通知
 * @param {Array} userIds - 用户 ID 数组
 * @param {number} bizType - 业务类型
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 */
export async function batchNotify(userIds, bizType, title, content) {
  for (const userId of userIds) {
    await notify(userId, bizType, null, title, content);
  }
}
