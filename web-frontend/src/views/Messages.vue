<template>
  <div class="messages-page">
    <div class="page-toolbar">
      <h1 class="page-title">消息中心</h1>
      <div class="toolbar-actions">
        <el-button @click="handleMarkAllRead" :disabled="unreadCount === 0">
          <el-icon><Select /></el-icon> 全部已读
        </el-button>
        <el-button @click="fetchMessages">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>
    </div>

    <div class="message-card">
      <div v-if="messages.length === 0" class="empty-state">
        <el-icon :size="48"><Message /></el-icon>
        <p>暂无消息</p>
      </div>
      <div v-else class="message-list">
        <div
          v-for="item in messages"
          :key="item.id"
          :class="['message-item', { unread: item.is_read === 0 }]"
          @click="handleMessageClick(item)"
        >
          <div :class="['msg-icon-box', getMsgType(item.biz_type)]">
            <el-icon :size="20"><component :is="getMsgIcon(item.biz_type)" /></el-icon>
          </div>
          <div class="msg-content">
            <div class="msg-header">
              <span class="msg-title">{{ item.title }}</span>
              <span v-if="item.is_read === 0" class="unread-dot"></span>
            </div>
            <p class="msg-text">{{ item.content }}</p>
            <span class="msg-time">{{ formatDate(item.created_at) }}</span>
          </div>
          <div class="msg-status">
            <el-tag v-if="item.is_read === 0" type="primary" size="small" round>未读</el-tag>
            <el-tag v-else type="info" size="small" round effect="plain">已读</el-tag>
          </div>
        </div>
      </div>

      <div v-if="total > 50" class="pagination">
        <el-pagination
          layout="prev, pager, next"
          :total="total"
          :page-size="50"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMessageList, markAsRead, markAllAsRead } from '@/api/message'
import { useNotificationStore } from '@/stores/notification'
import dayjs from 'dayjs'

const notificationStore = useNotificationStore()
const messages = ref([])
const total = ref(0)
const pageNo = ref(1)

const unreadCount = computed(() => messages.value.filter(m => m.is_read === 0).length)

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const getMsgType = (type) => {
  const map = { 1: 'notice', 2: 'audit', 3: 'claim' }
  return map[type] || 'default'
}

const getMsgIcon = (type) => {
  const map = { 1: 'Bell', 2: 'Document', 3: 'User' }
  return map[type] || 'Message'
}

const fetchMessages = async () => {
  try {
    const res = await getMessageList({ pageNo: pageNo.value, pageSize: 50 })
    messages.value = res.data?.list || []
    total.value = res.data?.total || 0
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
    try {
      await markAsRead(item.id)
    } catch (e) { console.error(e) }
    await notificationStore.fetchUnreadCount()
    item.is_read = 1
  }
}

const handlePageChange = (page) => {
  pageNo.value = page
  fetchMessages()
}

onMounted(() => {
  fetchMessages()
})
</script>

<style lang="scss" scoped>
.messages-page {
  max-width: 800px;
  margin: 0 auto;
  animation: fadeInUp 0.4s ease;
}

.page-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .page-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--c-text-primary);
  }

  .toolbar-actions {
    display: flex;
    gap: 8px;
  }
}

.message-card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px 0;
  color: var(--c-text-tertiary);

  p { font-size: 14px; }
}

.message-list {
  .message-item {
    display: flex;
    gap: 16px;
    padding: 18px 24px;
    cursor: pointer;
    transition: all var(--transition-fast);
    border-bottom: 1px solid var(--c-border-light);

    &:last-child { border-bottom: none; }

    &:hover {
      background: var(--c-bg-elevated);
    }

    &.unread {
      background: #f0fdfa;

      &:hover {
        background: #e6faf5;
      }
    }

    .msg-icon-box {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.notice  { background: var(--c-info-soft); color: var(--c-info); }
      &.audit   { background: var(--c-warning-soft); color: #d97706; }
      &.claim   { background: var(--c-success-soft); color: var(--c-success); }
      &.default { background: var(--c-bg); color: var(--c-text-tertiary); }
    }

    .msg-content {
      flex: 1;
      min-width: 0;

      .msg-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;

        .msg-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--c-text-primary);
        }

        .unread-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--c-primary);
        }
      }

      .msg-text {
        font-size: 13px;
        color: var(--c-text-secondary);
        margin-bottom: 6px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .msg-time {
        font-size: 12px;
        color: var(--c-text-tertiary);
      }
    }

    .msg-status {
      flex-shrink: 0;
      display: flex;
      align-items: flex-start;
      padding-top: 4px;
    }
  }
}

.pagination {
  padding: 16px;
  display: flex;
  justify-content: center;
}
</style>
