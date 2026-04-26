<template>
  <div class="my-claims-page">
    <el-card>
      <template #header>
        <span>我的认领</span>
      </template>

      <el-tabs v-model="activeTab" @change="fetchClaims">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="待处理" name="1" />
        <el-tab-pane label="已通过" name="2" />
        <el-tab-pane label="已拒绝" name="3" />
      </el-tabs>

      <div v-loading="loading" class="claim-list">
        <div v-for="item in claimList" :key="item.id" class="claim-item">
          <div class="claim-header">
            <div class="claim-title">
              <el-tag :type="item.post_type === 1 ? 'warning' : 'success'" size="small">
                {{ item.post_type === 1 ? '失物' : '招领' }}
              </el-tag>
              <span>{{ item.post_title }}</span>
              <el-tag :type="getStatusType(item.status)" size="small">
                {{ getStatusText(item.status) }}
              </el-tag>
            </div>
            <div class="claim-time">{{ formatDate(item.created_at) }}</div>
          </div>
          <div class="claim-body">
            <div class="claim-info">
              <span><el-icon><Location /></el-icon> {{ item.post_occur_location || '未知地点' }}</span>
              <span><el-icon><Document /></el-icon> 申请编号：{{ item.apply_no }}</span>
            </div>
            <div class="verify-desc">
              <strong>验证信息：</strong>{{ item.verify_desc || '无' }}
            </div>
            <div v-if="item.review_remark" class="review-remark">
              <el-icon><Warning /></el-icon>
              <span>{{ item.review_remark }}</span>
            </div>
          </div>
          <div class="claim-actions">
            <el-button v-if="item.status === 1" type="danger" @click="handleCancel(item.id)">
              撤销申请
            </el-button>
            <el-button v-if="item.status === 2" type="success" plain>
              已完成，请线下交接
            </el-button>
          </div>
        </div>
        <el-empty v-if="!loading && claimList.length === 0" description="暂无认领记录" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyClaims, cancelClaim } from '@/api/post'
import dayjs from 'dayjs'

const activeTab = ref('all')
const claimList = ref([])
const loading = ref(false)

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const getStatusType = (status) => {
  const map = { 1: 'warning', 2: 'success', 3: 'danger', 4: 'info' }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = { 1: '待处理', 2: '已通过', 3: '已拒绝', 4: '已超时' }
  return map[status] || '未知'
}

const fetchClaims = async () => {
  loading.value = true
  try {
    const res = await getMyClaims()
    let list = res.data || []
    if (activeTab.value !== 'all') {
      list = list.filter(item => item.status === parseInt(activeTab.value))
    }
    claimList.value = list
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleCancel = async (id) => {
  try {
    await ElMessageBox.confirm('确认撤销该认领申请？', '提示')
    await cancelClaim(id)
    ElMessage.success('已撤销')
    fetchClaims()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchClaims()
})
</script>

<style lang="scss" scoped>
.my-claims-page {
  max-width: 900px;
  margin: 0 auto;
}

.claim-list {
  .claim-item {
    padding: 16px;
    border: 1px solid #eee;
    border-radius: 8px;
    margin-bottom: 16px;

    .claim-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .claim-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        font-weight: 500;
      }

      .claim-time {
        font-size: 13px;
        color: #999;
      }
    }

    .claim-body {
      margin-bottom: 12px;

      .claim-info {
        display: flex;
        gap: 24px;
        margin-bottom: 8px;
        font-size: 14px;
        color: #666;

        span {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }

      .verify-desc {
        font-size: 14px;
        color: #333;
        margin-bottom: 8px;

        strong {
          color: #666;
        }
      }

      .review-remark {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        background: #fef0f0;
        border-radius: 4px;
        color: #f56c6c;
        font-size: 14px;
      }
    }

    .claim-actions {
      text-align: right;
    }
  }
}
</style>
