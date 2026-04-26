# 消息推送配置指南

## 概述

系统支持三种通知方式：
1. **站内通知** - 默认启用，无需配置
2. **微信订阅消息** - 可选，需微信公众号配置
3. **企业微信应用消息** - 可选，需企业微信配置

## 一、微信订阅消息配置

### 1. 申请微信公众号
- 访问 https://mp.weixin.qq.com/
- 注册订阅号或服务号
- 完成认证

### 2. 获取 APP_ID 和 APP_SECRET
1. 登录微信公众号后台
2. 进入「开发」>「基本配置」
3. 记录开发者 ID (APPID) 和开发者密钥 (APPSECRET)

### 3. 创建订阅消息模板
1. 进入「功能」>「订阅通知」
2. 添加新模板，选择教育行业相关模板
3. 推荐模板格式：
   ```
   {{thing1.DATA}}
   {{thing2.DATA}}
   ```
4. 记录模板 ID

### 4. 配置环境变量
在 `backend/.env` 文件中添加：
```bash
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_APP_SECRET=your_app_secret_here
WECHAT_SUBSCRIBE_TEMPLATE_ID=your_template_id_here
```

### 5. 引导用户订阅
前端需要引导用户订阅消息（需要用户主动点击授权）：

```vue
<script setup>
import { ElMessage } from 'element-plus'

const requestSubscribe = async () => {
  const templateId = 'your_template_id' // 替换为实际模板 ID
  
  wx.requestSubscribeMessage({
    tmplIds: [templateId],
    success(res) {
      if (res[templateId] === 'accept') {
        ElMessage.success('订阅成功')
      }
    },
    fail(err) {
      console.error('订阅失败', err)
    }
  })
}
</script>
```

## 二、企业微信应用消息配置

### 1. 注册企业微信
- 访问 https://work.weixin.qq.com/
- 注册企业账号
- 完成企业认证

### 2. 创建自建应用
1. 进入「应用管理」>「应用」>「创建应用」
2. 填写应用信息（名称：失物招领通知）
3. 记录 AgentId 和 Secret

### 3. 配置可信域名
1. 进入应用详情页
2. 「企业可信 IP」添加服务器 IP
3. 「网页授权及 JS-SDK」配置可信域名

### 4. 成员同步
- 确保校园师生已添加到企业微信组织架构
- 学号/工号与企业微信账号对应

### 5. 配置环境变量
在 `backend/.env` 文件中添加：
```bash
WECHAT_CORP_ID=ww1234567890abcdef
WECHAT_CORP_SECRET=your_corp_secret_here
WECHAT_AGENT_ID=1000001
```

## 三、测试方法

### 开发模式（未配置任何推送）
```bash
cd backend
npm run dev
```
控制台日志显示：
- `[开发模式] 跳过微信订阅消息发送`
- `[开发模式] 跳过企业微信消息发送`

### 生产模式测试

1. 创建 `.env` 文件并配置完整参数
2. 重启服务
3. 触发通知场景：
   - 发布新信息（管理员收到审核通知）
   - 审核通过/驳回（发布者收到结果通知）
   - 发起认领申请（双方收到通知）

### 查看通知记录
数据库表 `notifications` 存储所有通知记录：
```sql
SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC;
```

## 四、通知类型

| 业务类型 | bizType | 触发场景 |
|---------|---------|---------|
| 审核通知 | 1 | 信息发布/更新后审核 |
| 公告通知 | 2 | 管理员发布公告 |
| 认领通知 | 3 | 认领申请/处理结果 |

## 五、常见问题

### Q: 微信订阅消息发送失败？
- 检查用户是否已订阅
- 验证模板 ID 是否正确
- 确认 access_token 有效

### Q: 企业微信消息接收不到？
- 确认用户已在企业微信组织架构中
- 验证 AgentId 配置
- 检查可信 IP 设置

### Q: 如何同时支持多种推送方式？
系统会自动尝试所有已配置的推送方式，只要有一种成功即视为送达。

## 六、安全建议

1. **保护密钥**: `.env` 文件不要提交到 Git
2. **HTTPS**: 生产环境必须使用 HTTPS
3. **频率限制**: 避免短时间内大量发送
4. **内容审核**: 确保通知内容合规

## 七、联系方式

- 微信公众号技术支持：https://developers.weixin.qq.com/
- 企业微信技术支持：https://work.weixin.qq.com/api/doc
