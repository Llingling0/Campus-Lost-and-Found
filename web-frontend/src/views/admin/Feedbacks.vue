<template>
  <div class="feedbacks-page">
    <div class="page-header">
      <h2>反馈管理</h2>
      <el-radio-group v-model="filterStatus" size="small" @change="fetchList">
        <el-radio-button :value="0">全部</el-radio-button>
        <el-radio-button :value="1">待处理</el-radio-button>
        <el-radio-button :value="2">已回复</el-radio-button>
      </el-radio-group>
    </div>

    <div class="content-card">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="用户" width="120">
          <template #default="{ row }">
            {{ row.user_name || row.user_nickname || '匿名' }}
          </template>
        </el-table-column>
        <el-table-column prop="content" label="反馈内容" min-width="300" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 2 ? 'success' : 'warning'" size="small">
              {{ row.status === 2 ? '已回复' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reply_content" label="回复内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="created_at" label="提交时间" width="170">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 1" size="small" type="primary" @click="openReply(row)">
              回复
            </el-button>
            <span v-else class="replied-text">已回复</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Reply Dialog -->
    <el-dialog v-model="showReplyDialog" title="回复反馈" width="500px" :close-on-click-modal="false">
      <div class="reply-preview">
        <p class="reply-label">用户反馈：</p>
        <p class="reply-content">{{ currentItem?.content }}</p>
      </div>
      <el-form :model="replyForm" label-width="0">
        <el-form-item>
          <el-input
            v-model="replyForm.replyContent"
            type="textarea"
            :rows="4"
            placeholder="请输入回复内容..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReplyDialog = false">取消</el-button>
        <el-button type="primary" @click="handleReply" :loading="replying" :disabled="!replyForm.replyContent.trim()">
          发送回复
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import dayjs from 'dayjs'

const list = ref([])
const loading = ref(false)
const filterStatus = ref(0)
const showReplyDialog = ref(false)
const replying = ref(false)
const currentItem = ref(null)

const replyForm = reactive({
  replyContent: ''
})

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const fetchList = async () => {
  loading.value = true
  try {
    const params = filterStatus.value > 0 ? { status: filterStatus.value } : {}
    const res = await request.get('/feedbacks', { params })
    list.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const openReply = (row) => {
  currentItem.value = row
  replyForm.replyContent = ''
  showReplyDialog.value = true
}

const handleReply = async () => {
  if (!replyForm.replyContent.trim()) return
  replying.value = true
  try {
    await request.post(`/feedbacks/${currentItem.value.id}/reply`, {
      replyContent: replyForm.replyContent
    })
    ElMessage.success('已回复')
    showReplyDialog.value = false
    fetchList()
  } catch (e) {
    console.error(e)
  } finally {
    replying.value = false
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style lang="scss" scoped>
.feedbacks-page {
  animation: fadeInUp 0.3s ease;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    font-size: 20px;
    font-weight: 700;
    color: var(--c-text-primary);
  }
}

.content-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.reply-preview {
  background: var(--c-bg);
  border-radius: var(--radius-sm);
  padding: 12px;
  margin-bottom: 16px;

  .reply-label {
    font-size: 12px;
    color: var(--c-text-tertiary);
    margin-bottom: 6px;
  }

  .reply-content {
    font-size: 14px;
    color: var(--c-text-secondary);
    line-height: 1.5;
  }
}

.replied-text {
  font-size: 13px;
  color: var(--c-text-tertiary);
}
</style>
