<template>
  <div class="my-posts-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的发布</span>
          <el-button type="primary" @click="$router.push('/publish')">
            <el-icon><Plus /></el-icon> 发布新信息
          </el-button>
        </div>
      </template>

      <el-tabs v-model="activeTab" @change="fetchPosts">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="待审核" name="1" />
        <el-tab-pane label="审核驳回" name="3" />
        <el-tab-pane label="已发布" name="2" />
        <el-tab-pane label="已找回" name="4" />
      </el-tabs>

      <div v-loading="loading" class="post-list">
        <div v-for="item in postList" :key="item.id" class="post-item">
          <div class="post-image">
            <el-image v-if="item.images?.[0]?.imgUrl" :src="item.images[0].imgUrl" fit="cover" />
            <div v-else class="no-image"><el-icon><Picture /></el-icon></div>
          </div>
          <div class="post-info">
            <div class="post-header">
              <el-tag :type="item.post_type === 1 ? 'warning' : 'success'" size="small">
                {{ item.post_type === 1 ? '失物' : '招领' }}
              </el-tag>
              <span class="post-title">{{ item.title }}</span>
              <el-tag :type="getStatusType(item.status)" size="small">
                {{ getStatusText(item.status) }}
              </el-tag>
            </div>
            <div class="post-desc">{{ item.detail || '暂无描述' }}</div>
            <div class="post-meta">
              <span><el-icon><Clock /></el-icon> {{ formatDate(item.created_at) }}</span>
              <span v-if="item.reject_reason"><el-icon><Warning /></el-icon> {{ item.reject_reason }}</span>
            </div>
          </div>
          <div class="post-actions">
            <el-button v-if="item.status === 0 || item.status === 3" @click="submitPost(item.id)">
              提交审核
            </el-button>
            <el-button v-if="item.status === 0 || item.status === 3" @click="$router.push(`/publish/${item.id}`)">
              编辑
            </el-button>
            <el-button v-if="[0, 1, 3].includes(item.status)" type="danger" @click="handleDelete(item.id)">
              删除
            </el-button>
            <el-button v-if="item.status === 2" @click="$router.push(`/detail/${item.id}`)">
              查看详情
            </el-button>
          </div>
        </div>
        <el-empty v-if="!loading && postList.length === 0" description="暂无发布" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyPosts, submitPost as apiSubmitPost, deletePost } from '@/api/post'
import dayjs from 'dayjs'

const activeTab = ref('all')
const postList = ref([])
const loading = ref(false)

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const getStatusType = (status) => {
  const map = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger', 4: '', 5: 'info', 7: 'info' }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = {
    0: '草稿', 1: '待审核', 2: '已发布', 3: '已驳回', 4: '已找回', 5: '已过期', 7: '已删除'
  }
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

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该信息？', '提示')
    await deletePost(id)
    ElMessage.success('删除成功')
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
  max-width: 1000px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-list {
  .post-item {
    display: flex;
    gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid #eee;

    &:last-child {
      border-bottom: none;
    }

    .post-image {
      width: 100px;
      height: 75px;
      flex-shrink: 0;
      border-radius: 6px;
      overflow: hidden;
      background: #f5f5f5;

      .el-image {
        width: 100%;
        height: 100%;
      }

      .no-image {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ccc;
        font-size: 24px;
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
          font-weight: 500;
        }
      }

      .post-desc {
        font-size: 14px;
        color: #666;
        margin-bottom: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .post-meta {
        display: flex;
        gap: 16px;
        font-size: 13px;
        color: #999;

        span {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    }

    .post-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  }
}
</style>
