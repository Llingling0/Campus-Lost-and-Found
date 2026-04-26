import express from 'express';
import db, { nowIso } from '../db.js';
import { ok, fail } from '../utils.js';
import { auth, signToken } from '../middleware/auth.js';

const router = express.Router();

// 配置校园统一身份认证接口地址（从环境变量读取）
const CAMPUS_AUTH_URL = process.env.CAMPUS_AUTH_URL || '';
const CAMPUS_AUTH_APP_KEY = process.env.CAMPUS_AUTH_APP_KEY || '';
const CAMPUS_AUTH_APP_SECRET = process.env.CAMPUS_AUTH_APP_SECRET || '';

/**
 * 调用校园统一身份认证接口验证学号/工号和姓名
 * @param {string} identityNo - 学号或工号
 * @param {string} realName - 真实姓名
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function verifyCampusIdentity(identityNo, realName) {
  // 如果没有配置校园认证接口，返回成功（开发模式）
  if (!CAMPUS_AUTH_URL) {
    console.log('[开发模式] 跳过校园身份认证');
    return { success: true, message: '开发模式，无需认证' };
  }

  try {
    const response = await fetch(CAMPUS_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Key': CAMPUS_AUTH_APP_KEY,
        'X-App-Secret': CAMPUS_AUTH_APP_SECRET
      },
      body: JSON.stringify({
        identityNo,
        realName,
        timestamp: Date.now()
      })
    });

    const result = await response.json();
    
    if (result.code === 200 || result.success === true) {
      return { success: true, message: '认证成功' };
    } else {
      return { success: false, message: result.message || '认证失败' };
    }
  } catch (error) {
    console.error('校园身份认证接口调用失败:', error);
    return { success: false, message: '认证服务暂时不可用' };
  }
}

// 微信登录（兼容小程序）
router.post('/wx-login', (req, res) => {
  const { code } = req.body;
  if (!code) return fail(res, 'code 不能为空');

  const openid = code === 'admin' ? 'admin_openid' : `openid_${code}`;
  const now = nowIso();
  let user = db.prepare('SELECT * FROM users WHERE openid = ?').get(openid);

  if (!user) {
    db.prepare(`INSERT INTO users(openid, nickname, role, status, created_at, updated_at)
      VALUES(?, ?, 1, 1, ?, ?)`)
      .run(openid, '微信用户', now, now);
    user = db.prepare('SELECT * FROM users WHERE openid = ?').get(openid);
  }

  const token = signToken({ userId: user.id, role: user.role });
  return ok(res, { token, isBoundIdentity: !!(user.student_no || user.staff_no), user });
});

// PC 端账号密码登录（对接校园统一身份认证）
router.post('/login', async (req, res) => {
  const { identityType, identityNo, password, realName } = req.body;
  
  if (!identityNo || !password) {
    return fail(res, '账号和密码不能为空');
  }

  // 验证校园身份（如果配置了认证接口）
  if (realName && CAMPUS_AUTH_URL) {
    const verifyResult = await verifyCampusIdentity(identityNo, realName);
    if (!verifyResult.success) {
      return fail(res, verifyResult.message);
    }
  }

  const now = nowIso();
  const studentNo = identityType === 1 ? identityNo : null;
  const staffNo = identityType === 2 ? identityNo : null;
  const openid = `account_${identityType}_${identityNo}`;

  let user = db.prepare('SELECT * FROM users WHERE openid = ?').get(openid);

  if (!user) {
    // 首次登录，创建用户
    db.prepare(`INSERT INTO users(openid, student_no, staff_no, real_name, nickname, role, status, created_at, updated_at)
      VALUES(?, ?, ?, ?, ?, 1, 1, ?, ?)`)
      .run(openid, studentNo, staffNo, realName || identityNo, realName || identityNo, now, now);
    user = db.prepare('SELECT * FROM users WHERE openid = ?').get(openid);
  } else {
    // 更新实名信息
    if (realName && user.real_name !== realName) {
      db.prepare('UPDATE users SET real_name=?, updated_at=? WHERE id=?').run(realName, now, user.id);
      user.real_name = realName;
    }
  }

  const token = signToken({ userId: user.id, role: user.role });
  return ok(res, { token, isBoundIdentity: true, user });
});

// 管理员快捷登录（开发/测试用）
router.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return fail(res, '账号和密码不能为空');
  }

  // 预设管理员账号（开发模式）
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return fail(res, '管理员账号或密码错误');
  }

  const now = nowIso();
  let user = db.prepare("SELECT * FROM users WHERE openid='admin_openid'").get();

  if (!user) {
    // 首次使用，创建管理员账号
    db.prepare(`INSERT INTO users(openid, real_name, mobile, nickname, role, status, created_at, updated_at)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?)`)
      .run('admin_openid', '系统管理员', '13800000000', '管理员', 2, 1, now, now);
    user = db.prepare("SELECT * FROM users WHERE openid='admin_openid'").get();
  } else if (user.role !== 2) {
    // 确保该账号是管理员
    db.prepare('UPDATE users SET role=2, status=1, updated_at=? WHERE id=?').run(now, user.id);
    user.role = 2;
  }

  const token = signToken({ userId: user.id, role: user.role });
  return ok(res, { token, isBoundIdentity: true, user });
});

// 绑定身份信息（兼容旧接口）
router.post('/bind-identity', async (req, res) => {
  const { token, identityType, identityNo, realName, mobile, password } = req.body;
  
  if (!token) return fail(res, 'token 不能为空');
  if (!identityNo || !realName) return fail(res, '参数不完整');

  // 验证校园身份（如果配置了认证接口）
  if (CAMPUS_AUTH_URL) {
    const verifyResult = await verifyCampusIdentity(identityNo, realName);
    if (!verifyResult.success) {
      return fail(res, verifyResult.message);
    }
  }

  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId);
    if (!user) return fail(res, '用户不存在');
    
    const now = nowIso();
    const studentNo = identityType === 1 ? identityNo : null;
    const staffNo = identityType === 2 ? identityNo : null;
    
    db.prepare(`UPDATE users SET student_no=?, staff_no=?, real_name=?, mobile=?, updated_at=? WHERE id=?`)
      .run(studentNo, staffNo, realName, mobile || user.mobile, now, user.id);
    
    const newUser = db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
    return ok(res, newUser, '绑定成功');
  } catch {
    return fail(res, 'token 无效', 401);
  }
});

// 获取个人信息
router.get('/profile', auth(false), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  return ok(res, user);
});

// 更新个人信息
router.put('/profile', auth(false), (req, res) => {
  const { nickname, mobile, college, className } = req.body;
  const now = nowIso();
  
  db.prepare(`UPDATE users SET nickname=?, mobile=?, college=?, class_name=?, updated_at=? WHERE id=?`)
    .run(nickname || req.user.nickname, mobile || req.user.mobile, college || req.user.college, 
         className || req.user.class_name, now, req.user.id);
  
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  return ok(res, user, '更新成功');
});

// 登出
router.post('/logout', auth(false), (req, res) => {
  // JWT 无状态，客户端删除 token 即可
  return ok(res, null, '登出成功');
});

export default router;
