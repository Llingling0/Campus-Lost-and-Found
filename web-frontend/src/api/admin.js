import request from '@/utils/request'

// 获取待审核列表
export function getPendingPosts() {
  return request.get('/admin/posts/pending')
}

// 审核通过
export function approvePost(id) {
  return request.post(`/admin/posts/${id}/approve`)
}

// 审核驳回
export function rejectPost(id, reason) {
  return request.post(`/admin/posts/${id}/reject`, { reason })
}

// 删除信息
export function deletePost(id, reason) {
  return request.post(`/admin/posts/${id}/delete`, { reason })
}

// 获取待处理认领
export function getPendingClaims() {
  return request.get('/admin/claims/pending')
}

// 认领通过
export function approveClaim(id) {
  return request.post(`/admin/claims/${id}/approve`)
}

// 认领拒绝
export function rejectClaim(id, reason) {
  return request.post(`/admin/claims/${id}/reject`, { reason })
}

// 用户列表
export function getUserList() {
  return request.get('/admin/users')
}

// 禁用用户
export function disableUser(id) {
  return request.post(`/admin/users/${id}/disable`)
}

// 启用用户
export function enableUser(id) {
  return request.post(`/admin/users/${id}/enable`)
}

// 统计概览
export function getStatsOverview() {
  return request.get('/admin/stats/overview')
}

// 全景监控看板
export function getDashboard() {
  return request.get('/admin/dashboard')
}

// 导出数据
export function exportStats() {
  return request.get('/admin/stats/export', { responseType: 'blob' })
}

// 获取配置
export function getConfigs() {
  return request.get('/admin/configs')
}

// 更新配置
export function updateConfigs(configs) {
  return request.put('/admin/configs', { configs })
}
