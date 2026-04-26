import request from '@/utils/request'

// 微信登录（兼容小程序）
export function wxLogin(code) {
  return request.post('/auth/wx-login', { code })
}

// PC 端账号密码登录（对接校园统一身份认证）
export function login(data) {
  return request.post('/auth/login', data)
}

// 管理员快捷登录
export function adminLogin(data) {
  return request.post('/auth/admin-login', data)
}

// 绑定身份
export function bindIdentity(data) {
  return request.post('/auth/bind-identity', data)
}

// 获取个人信息
export function getProfile() {
  return request.get('/auth/profile')
}

// 更新个人信息
export function updateProfile(data) {
  return request.put('/auth/profile', data)
}

// 登出
export function logout() {
  return request.post('/auth/logout')
}
