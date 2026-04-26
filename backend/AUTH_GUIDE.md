# 校园统一身份认证接口对接说明

## 概述

系统已集成校园统一身份认证接口，支持学号/工号 + 密码登录方式。当配置了校园认证接口后，用户登录时会自动调用校园认证接口验证身份。

## 环境变量配置

在 `backend` 目录下创建 `.env` 文件（参考 `.env.example`）：

```bash
# 校园身份认证接口地址
CAMPUS_AUTH_URL=https://auth.xxx.edu.cn/api/verify

# 应用 Key（由校园信息中心分配）
CAMPUS_AUTH_APP_KEY=your_app_key_here

# 应用 Secret（由校园信息中心分配）
CAMPUS_AUTH_APP_SECRET=your_app_secret_here
```

## 开发模式

未配置环境变量时，系统运行在**开发模式**，跳过校园身份认证，直接允许登录。

## 接口规范

### 校园认证接口请求格式

```http
POST {CAMPUS_AUTH_URL}
Content-Type: application/json
X-App-Key: {CAMPUS_AUTH_APP_KEY}
X-App-Secret: {CAMPUS_AUTH_APP_SECRET}

{
  "identityNo": "202412345",      // 学号或工号
  "realName": "张三",             // 真实姓名
  "timestamp": 1711555200000     // 时间戳
}
```

### 响应格式

**成功响应：**
```json
{
  "code": 200,
  "success": true,
  "message": "认证成功",
  "data": {
    "identityNo": "202412345",
    "realName": "张三",
    "college": "计算机学院",
    "className": "2024 级 1 班"
  }
}
```

**失败响应：**
```json
{
  "code": 401,
  "success": false,
  "message": "学号或姓名不匹配"
}
```

## 后端 API 变更

### 新增接口

#### 1. PC 端账号密码登录
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "identityType": 1,        // 1-学生，2-教职工
  "identityNo": "202412345",
  "password": "password123",
  "realName": "张三"
}
```

**响应：**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "isBoundIdentity": true,
    "user": {
      "id": 1,
      "openid": "account_1_202412345",
      "studentNo": "202412345",
      "realName": "张三",
      "nickname": "张三",
      "role": 1,
      "status": 1
    }
  }
}
```

### 兼容接口

以下接口保持不变，确保向后兼容：

- `POST /api/v1/auth/wx-login` - 微信小程序登录
- `POST /api/v1/auth/bind-identity` - 绑定身份信息
- `GET /api/v1/auth/profile` - 获取个人信息
- `PUT /api/v1/auth/profile` - 更新个人信息（新增）
- `POST /api/v1/auth/logout` - 登出（新增）

## 前端使用

### Vue 组件示例

```vue
<script setup>
import { login } from '@/api/auth'

const handleLogin = async () => {
  const res = await login({
    identityType: 1,
    identityNo: '202412345',
    password: 'password123',
    realName: '张三'
  })
  
  // 保存 token 和用户信息
  localStorage.setItem('token', res.data.token)
  localStorage.setItem('user', JSON.stringify(res.data.user))
}
</script>
```

## 安全机制

1. **JWT Token**: 登录成功后颁发 JWT token，有效期 7 天
2. **请求签名**: 校园认证接口调用包含时间戳，防止重放攻击
3. **HTTPS**: 生产环境必须使用 HTTPS 传输
4. **敏感信息保护**: 不存储用户密码，仅存储校园认证返回的身份信息

## 测试步骤

### 1. 开发模式测试（无校园认证）

```bash
cd backend
npm run dev
```

访问 http://localhost:3000

测试数据：
- 学号：任意输入
- 密码：任意输入
- 姓名：任意输入

### 2. 生产模式测试（配置校园认证）

创建 `.env` 文件并配置真实的校园认证接口参数，重启服务。

## 故障排查

### 日志查看

启动服务后，查看控制台日志：
- `[开发模式] 跳过校园身份认证` - 未配置环境变量
- `校园身份认证接口调用失败` - 网络或接口问题

### 常见问题

**Q: 提示"认证服务暂时不可用"**
- 检查 CAMPUS_AUTH_URL 是否正确
- 检查网络连接
- 联系校园信息中心确认接口状态

**Q: 提示"认证失败：学号或姓名不匹配"**
- 确认学号/工号正确
- 确认姓名与学籍信息一致
- 联系学校相关部门核实信息

## 联系人

如需申请校园认证接口权限，请联系：
- 校园信息中心：xxx-xxxxxxx
- 技术支持邮箱：support@xxx.edu.cn
