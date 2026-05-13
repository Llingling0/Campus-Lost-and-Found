<template>
  <div class="my-posts-page">
    <div class="page-toolbar">
      <h1 class="page-title">我的发布</h1>
      <el-button type="primary" @click="$router.push('/publish')">
        <el-icon><Plus /></el-icon> 发布新信息
      </el-button>
    </div>

    <div class="content-card">
      <div class="tab-bar">
        <span
          v-for="tab in tabs"
          :key="tab.value"
          :class="['tab-item', { active: activeTab === tab.value }]"
          @click="activeTab = tab.value; fetchPosts()"
        >
          {{ tab.label }}
          <span v-if="tab.count !== undefined" class="tab-count">{{ tab.count }}</span>
        </span>
      </div>

      <div v-loading="loading" class="post-list">
        <div v-if="postList.length === 0" class="empty-state">
          <el-icon :size="48"><Document /></el-icon>
          <p>暂无发布</p>
          <el-button type="primary" @click="$router.push('/publish')">去发布</el-button>
        </div>

        <div v-for="item in postList" :key="item.id" class="post-item">
          <div class="post-image">
            <el-image v-if="item.images?.[0]?.imgUrl" :src="item.images[0].imgUrl" fit="cover" />
            <el-icon v-else :size="28"><Picture /></el-icon>
          </div>
          <div class="post-info">
            <div class="post-header">
              <el-tag :type="item.post_type === 1 ? 'warning' : 'success'" size="small" effect="dark">
                {{ item.post_type === 1 ? '失物' : '招领' }}
              </el-tag>
              <span class="post-title">{{ item.title }}</span>
              <el-tag :type="getStatusType(item.status)" size="small" effect="plain">
                {{ getStatusText(item.status) }}
              </el-tag>
            </div>
            <p class="post-desc">{{ item.detail || '暂无描述' }}</p>
            <div class="post-meta">
              <span><el-icon><Clock /></el-icon> {{ formatDate(item.created_at) }}</span>
              <span v-if="item.reject_reason" class="reject-reason">
                <el-icon><Warning /></el-icon> {{ item.reject_reason }}
              </span>
            </div>
          </div>
          <div class="post-actions">
            <el-button
              v-if="item.status === 2 && item.post_type === 1"
              type="success"
              size="small"
              @click="handleReturn(item.id)"
            >
              标记归还
            </el-button>
            <el-button
              v-if="item.status === 0 || item.status === 3"
              type="primary"
              size="small"
              @click="submitPost(item.id)"
            >
              提交审核
            </el-button>
            <el-button
              v-if="item.status === 0 || item.status === 3"
              size="small"
              @click="$router.push(`/publish/${item.id}`)"
            >
              编辑
            </el-button>
            <el-button
              v-if="[0, 1, 3, 6].includes(item.status)"
              type="danger"
              size="small"
              plain
              @click="handleDelete(item.id)"
            >
              删除
            </el-button>
            <el-button
              v-if="item.status === 2"
              size="small"
              @click="$router.push(`/detail/${item.id}`)"
            >
              查看详情
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyPosts, submitPost as apiSubmitPost, deletePost } from '@/api/post'
import request from '@/utils/request'
import dayjs from 'dayjs'

const activeTab = ref('all')
const postList = ref([])
const loading = ref(false)

const tabs = [
  { label: '全部', value: 'all' },
  { label: '草稿', value: '0' },
  { label: '待审核', value: '1' },
  { label: '已发布', value: '2' },
  { label: '已驳回', value: '3' },
  { label: '已找回', value: '4' },
  { label: '已过期', value: '5' },
  { label: '已归还', value: '6' }
]

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const getStatusType = (status) => {
  const map = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger', 4: '', 5: 'info', 6: '', 7: 'danger' }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = { 0: '草稿', 1: '待审核', 2: '已发布', 3: '已驳回', 4: '已找回', 5: '已过期', 6: '已归还', 7: '已删除' }
  return map[status] || '未知'
}

const fetchPosts = async () => {
  loading.value = true
  try {
    const res = await getMyPosts()
    let list = res.data || []
    if (activeTab.value !== 'all') {
      list = list.filter(item => item.status === parseInt(activeTab.value))
    }
    postList.value = list
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const submitPost = async (id) => {
  try {
    await apiSubmitPost(id)
    ElMessage.success('已提交审核')
    fetchPosts()
  } catch (e) {
    console.error(e)
  }
}

const handleReturn = async (id) => {
  try {
    await ElMessageBox.confirm('确认已找到该失物？标记后信息将不再公开展示。', '确认归还', {
      type: 'success',
      confirmButtonText: '已找到'
    })
  } catch { return }
  try {
    await request.post(`/posts/${id}/return`)
    ElMessage.success('已标记为归还')
    fetchPosts()
  } catch (e) {
    console.error(e)
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该信息？', '提示', { type: 'warning' })
  } catch { return }
  try {
    await deletePost(id)
    ElMessage.success('已删除')
    fetchPosts()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchPosts()
})
</script>

<style lang="scss" scoped>
.my-posts-page {
  max-width: 900px;
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
}

.content-card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.tab-bar {
  display: flex;
  border-bottom: 1px solid var(--c-border-light);
  padding: 0 16px;

  .tab-item {
    padding: 14px 18px;
    font-size: 14px;
    font-weight: 500;
    color: var(--c-text-tertiary);
    cursor: pointer;
    position: relative;
    transition: all var(--transition-fast);

    &:hover {
      color: var(--c-text-secondary);
    }

    &.active {
      color: var(--c-primary);
      font-weight: 600;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 24px;
        height: 3px;
        background: var(--c-primary-gradient);
        border-radius: 2px;
      }
    }

    .tab-count {
      margin-left: 4px;
      font-size: 12px;
    }
  }
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

.post-list {
  padding: 8px 0;

  .post-item {
    display: flex;
    gap: 16px;
    padding: 18px 24px;
    border-bottom: 1px solid var(--c-border-light);
    transition: background var(--transition-fast);

    &:last-child { border-bottom: none; }
    &:hover { background: var(--c-bg-elevated); }

    .post-image {
      width: 90px;
      height: 70px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      background: var(--c-bg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--c-text-tertiary);
      flex-shrink: 0;

      .el-image {
        width: 100%;
        height: 100%;
      }
    }

    .post-info {
      flex: 1;
      min-width: 0;

      .post-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        .post-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--c-text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .post-desc {
        font-size: 13px;
        color: var(--c-text-secondary);
        margin-bottom: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .post-meta {
        display: flex;
        gap: 16px;
        font-size: 12px;
        color: var(--c-text-tertiary);

        span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .reject-reason {
          color: var(--c-danger);
        }
      }
    }

    .post-actions {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex-shrink: 0;
      justify-content: center;

      .el-button {
        min-width: 80px;
      }
    }
  }
}
</style>
