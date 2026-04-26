import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)

  async function fetchUnreadCount() {
    try {
      const res = await request.get('/notifications/unread-count')
      unreadCount.value = res.data?.count || 0
    } catch {
      unreadCount.value = 0
    }
  }

  async function markAsRead(id) {
    await request.post(`/notifications/${id}/read`)
    await fetchUnreadCount()
  }

  async function markAllAsRead() {
    await request.post('/notifications/read-all')
    unreadCount.value = 0
  }

  return { unreadCount, fetchUnreadCount, markAsRead, markAllAsRead }
})
