<template>
  <div class="messages-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的消息</span>
          <div class="actions">
            <el-button @click="handleMarkAllRead">全部已读</el-button>
            <el-button @click="fetchMessages"><el-icon><Refresh /></el-icon> 刷新</el-button>
          </div>
        </div>
      </template>

      <div class="message-list">
        <div
          v-for="item in messages"
          :key="item.id"
          :class="['message-item', { unread: item.is_read === 0 }]"
          @click="handleMessageClick(item)"
        >
          <div class="message-icon">
            <el-icon v-if="item.biz_type === 1"><Bell /></el-icon>
            <el-icon v-else-if="item.biz_type === 2"><Document /></el-icon>
            <el-icon v-else-if="item.biz_type === 3"><User /></el-icon>
            <el-icon v-else><Message /></el-icon>
          </div>
          <div class="message-content">
            <div class="message-title">{{ item.title }}</div>
            <div class="message-text">{{ item.content }}</div>
            <div class="message-time">{{ formatDate(item.created_at) }}</div>
          </div>
          <div class="message-status">
            <el-tag v-if="item.is_read === 0" type="primary" size="small">未读</el-tag>
          </div>
        </div>
        <el-empty v-if="messages.length === 0" description="暂无消息" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMessageList, markAsRead, markAllAsRead } from '@/api/message'
import { useNotificationStore } from '@/stores/notification'
import dayjs from 'dayjs'

const notificationStore = useNotificationStore()
const messages = ref([])

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const fetchMessages = async () => {
  try {
    const res = await getMessageList({ pageNo: 1, pageSize: 50 })
    messages.value = res.data?.list || []
  } catch (e) {
    console.error(e)
  }
}

const handleMarkAllRead = async () => {
  try {
    await markAllAsRead()
    await notificationStore.fetchUnreadCount()
    await fetchMessages()
    ElMessage.success('已全部标记为已读')
  } catch (e) {
    console.error(e)
  }
}

const handleMessageClick = async (item) => {
  if (item.is_read === 0) {
    await markAsRead(item.id)
    await notificationStore.fetchUnreadCount()
    item.is_read = 1
  }
}

onMounted(() => {
  fetchMessages()
})
</script>

<style lang="scss" scoped>
.messages-page {
  max-width: 900px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-list {
  .message-item {
    display: flex;
    gap: 16px;
    padding: 16px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    transition: all 0.3s;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: #f9f9f9;
    }

    &.unread {
      background: #f0f7ff;

      &:hover {
        background: #e6f4ff;
      }

      .message-title {
        font-weight: 600;
      }
    }

    .message-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #0b6cff;
      flex-shrink: 0;
    }

    .message-content {
      flex: 1;
      min-width: 0;

      .message-title {
        font-size: 15px;
        margin-bottom: 6px;
      }

      .message-text {
        font-size: 14px;
        color: #666;
        margin-bottom: 6px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .message-time {
        font-size: 12px;
        color: #999;
      }
    }

    .message-status {
      flex-shrink: 0;
    }
  }
}
</style>
