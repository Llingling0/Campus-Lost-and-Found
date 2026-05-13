<template>
  <div class="feedback-page">
    <div class="page-hero">
      <h1>意见反馈</h1>
      <p>您的反馈帮助我们不断改进</p>
    </div>

    <el-row :gutter="24">
      <el-col :span="14">
        <div class="form-card">
          <h3>提交反馈</h3>
          <el-form :model="form" :rules="rules" ref="formRef" label-width="0">
            <el-form-item prop="content">
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="5"
                placeholder="请描述您遇到的问题或建议..."
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSubmit" :loading="submitting" size="large">
                提交反馈
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>

      <el-col :span="10">
        <div class="history-card">
          <h3>我的反馈记录</h3>
          <div v-if="myFeedback.length === 0 && !loadingHistory" class="empty-state">
            <el-icon :size="40"><ChatLineSquare /></el-icon>
            <p>暂无反馈记录</p>
          </div>
          <div v-loading="loadingHistory" class="feedback-list">
            <div v-for="item in myFeedback" :key="item.id" class="feedback-item">
              <div class="feedback-header">
                <el-tag :type="item.status === 2 ? 'success' : 'warning'" size="small">
                  {{ item.status === 2 ? '已回复' : '待处理' }}
                </el-tag>
                <span class="feedback-time">{{ formatDate(item.created_at) }}</span>
              </div>
              <p class="feedback-content">{{ item.content }}</p>
              <div v-if="item.reply_content" class="feedback-reply">
                <div class="reply-header">
                  <el-icon><UserFilled /></el-icon>
                  <span>{{ item.replied_by_name || '管理员' }} 回复：</span>
                </div>
                <p>{{ item.reply_content }}</p>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import dayjs from 'dayjs'

const formRef = ref(null)
const submitting = ref(false)
const loadingHistory = ref(false)
const myFeedback = ref([])

const form = reactive({
  content: ''
})

const rules = {
  content: [{ required: true, message: '请输入反馈内容', trigger: 'blur' }]
}

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const fetchMyFeedback = async () => {
  loadingHistory.value = true
  try {
    const res = await request.get('/feedbacks/my')
    myFeedback.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loadingHistory.value = false
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch { return }

  submitting.value = true
  try {
    await request.post('/feedbacks', { content: form.content })
    ElMessage.success('感谢您的反馈！')
    form.content = ''
    fetchMyFeedback()
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchMyFeedback()
})
</script>

<style lang="scss" scoped>
.feedback-page {
  max-width: 1000px;
  margin: 0 auto;
  animation: fadeInUp 0.4s ease;
}

.page-hero {
  text-align: center;
  margin-bottom: 28px;

  h1 {
    font-size: 24px;
    font-weight: 700;
    color: var(--c-text-primary);
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: var(--c-text-tertiary);
  }
}

.form-card, .history-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--c-text-primary);
    margin-bottom: 16px;
  }
}

.history-card {
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 32px 0;
    color: var(--c-text-tertiary);
    font-size: 13px;
  }
}

.feedback-list {
  .feedback-item {
    padding: 14px 0;
    border-bottom: 1px solid var(--c-border-light);

    &:last-child { border-bottom: none; }

    .feedback-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .feedback-time {
        font-size: 12px;
        color: var(--c-text-tertiary);
      }
    }

    .feedback-content {
      font-size: 14px;
      color: var(--c-text-secondary);
      line-height: 1.6;
      margin-bottom: 8px;
    }

    .feedback-reply {
      background: var(--c-primary-soft);
      border-radius: var(--radius-sm);
      padding: 12px;
      margin-top: 8px;

      .reply-header {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 500;
        color: var(--c-primary);
        margin-bottom: 6px;
      }

      p {
        font-size: 13px;
        color: var(--c-text-secondary);
        line-height: 1.5;
      }
    }
  }
}
</style>
