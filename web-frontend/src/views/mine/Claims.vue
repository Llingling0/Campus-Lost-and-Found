<template>
  <div class="my-claims-page">
    <div class="page-toolbar">
      <h1 class="page-title">我的认领</h1>
    </div>

    <div class="content-card">
      <div class="tab-bar">
        <span
          v-for="tab in tabs"
          :key="tab.value"
          :class="['tab-item', { active: activeTab === tab.value }]"
          @click="activeTab = tab.value; fetchClaims()"
        >
          {{ tab.label }}
        </span>
      </div>

      <div v-loading="loading" class="claim-list">
        <div v-if="claimList.length === 0" class="empty-state">
          <el-icon :size="48"><Checked /></el-icon>
          <p>暂无认领记录</p>
        </div>

        <div v-for="item in claimList" :key="item.id" class="claim-item">
          <div class="claim-top">
            <div class="claim-title-row">
              <el-tag :type="item.post_type === 1 ? 'warning' : 'success'" size="small" effect="dark">
                {{ item.post_type === 1 ? '失物' : '招领' }}
              </el-tag>
              <span class="claim-title">{{ item.post_title }}</span>
              <el-tag :type="getStatusType(item.status)" size="small" effect="plain">
                {{ getStatusText(item.status) }}
              </el-tag>
            </div>
            <span class="claim-time">{{ formatDate(item.created_at) }}</span>
          </div>

          <div class="claim-detail">
            <div class="detail-row">
              <span><el-icon><Location /></el-icon> {{ item.post_occur_location || '未知地点' }}</span>
              <span class="apply-no"><el-icon><Document /></el-icon> 编号：{{ item.apply_no }}</span>
            </div>
            <div class="verify-text">
              <strong>验证信息：</strong>{{ item.verify_desc || '无' }}
            </div>
          </div>

          <div v-if="item.review_remark" class="review-bar">
            <el-icon><Warning /></el-icon>
            <span>{{ item.review_remark }}</span>
          </div>

          <div class="claim-actions">
            <el-button
              v-if="item.status === 1"
              type="danger"
              size="small"
              plain
              @click="handleCancel(item.id)"
            >
              撤销申请
            </el-button>
            <span v-if="item.status === 2" class="status-text success">
              <el-icon><CircleCheck /></el-icon> 已完成，请线下交接
            </span>
            <span v-if="item.status === 3" class="status-text danger">
              已拒绝
            </span>
          </div>
        </div>
      </div>
    </div>
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

const tabs = [
  { label: '全部', value: 'all' },
  { label: '待处理', value: '1' },
  { label: '已通过', value: '2' },
  { label: '已拒绝', value: '3' }
]

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
    await ElMessageBox.confirm('确认撤销该认领申请？', '提示', { type: 'warning' })
  } catch { return }
  try {
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
  animation: fadeInUp 0.4s ease;
}

.page-toolbar {
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

    &:hover { color: var(--c-text-secondary); }

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

.claim-list {
  padding: 8px 0;

  .claim-item {
    padding: 20px 24px;
    border-bottom: 1px solid var(--c-border-light);

    &:last-child { border-bottom: none; }

    .claim-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .claim-title-row {
        display: flex;
        align-items: center;
        gap: 8px;

        .claim-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--c-text-primary);
        }
      }

      .claim-time {
        font-size: 13px;
        color: var(--c-text-tertiary);
      }
    }

    .claim-detail {
      margin-bottom: 12px;

      .detail-row {
        display: flex;
        gap: 24px;
        margin-bottom: 8px;
        font-size: 13px;
        color: var(--c-text-secondary);

        span {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }

      .verify-text {
        font-size: 14px;
        color: var(--c-text-primary);

        strong {
          color: var(--c-text-secondary);
          font-weight: 500;
        }
      }
    }

    .review-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: var(--c-danger-soft);
      border-radius: var(--radius-sm);
      color: var(--c-danger);
      font-size: 13px;
      margin-bottom: 12px;
    }

    .claim-actions {
      .status-text {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 500;

        &.success { color: var(--c-success); }
        &.danger  { color: var(--c-danger); }
      }
    }
  }
}
</style>
