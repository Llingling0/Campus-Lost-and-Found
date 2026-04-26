import request from '@/utils/request'

// 获取消息列表
export function getMessageList(params) {
  return request.get('/notifications', { params })
}

// 获取未读数量
export function getUnreadCount() {
  return request.get('/notifications/unread-count')
}

// 标记为已读
export function markAsRead(id) {
  return request.post(`/notifications/${id}/read`)
}

// 全部已读
export function markAllAsRead() {
  return request.post('/notifications/read-all')
}

// 获取公告列表
export function getAnnouncementList() {
  return request.get('/announcements')
}
