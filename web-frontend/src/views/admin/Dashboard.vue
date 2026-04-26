<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6" v-for="card in statCards" :key="card.key">
        <el-card shadow="hover" class="stat-card" :class="card.type">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="32"><component :is="card.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-label">{{ card.label }}</div>
            </div>
          </div>
          <div class="stat-footer" v-if="card.extra">
            <span>{{ card.extra }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 异常提醒 -->
    <el-alert v-if="hasAlerts" title="系统提醒" type="warning" :closable="false" class="alert-row">
      <template #default>
        <div class="alert-content">
          <span v-if="dashboardData?.stats?.timeoutClaims > 0">
            <el-tag type="danger" size="small">超时认领: {{ dashboardData.stats.timeoutClaims }}</el-tag>
          </span>
          <span v-if="dashboardData?.stats?.expiredPosts > 0" style="margin-left: 8px">
            <el-tag type="info" size="small">过期信息: {{ dashboardData.stats.expiredPosts }}</el-tag>
          </span>
          <span v-if="dashboardData?.stats?.pendingClaimCount > 0" style="margin-left: 8px">
            <el-tag type="warning" size="small">待处理认领: {{ dashboardData.stats.pendingClaimCount }}</el-tag>
          </span>
        </div>
      </template>
    </el-alert>

    <!-- 待审核信息 & 待处理认领 -->
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <span>待审核信息</span>
              <el-tag type="warning">{{ dashboardData?.stats?.pendingCount || 0 }}</el-tag>
              <el-button type="primary" link @click="$router.push('/admin/audit')">查看全部</el-button>
            </div>
          </template>
          <div v-loading="loading" class="list-wrapper">
            <div v-if="dashboardData?.pendingPosts?.length === 0" class="empty-hint">暂无待审核信息</div>
            <div v-for="item in dashboardData?.pendingPosts || []" :key="item.id" class="list-item">
              <div class="item-main">
                <el-tag :type="item.post_type === 1 ? 'warning' : 'success'" size="small">
                  {{ item.post_type === 1 ? '失物' : '招领' }}
                </el-tag>
                <span class="item-title">{{ item.title }}</span>
              </div>
              <div class="item-sub">
                <span>{{ item.occur_location || '未知地点' }}</span>
                <span class="item-time">{{ formatDate(item.created_at) }}</span>
              </div>
              <div class="item-actions">
                <el-button type="success" size="small" @click="handleApprovePost(item.id)">通过</el-button>
                <el-button type="warning" size="small" @click="$router.push('/admin/audit')">处理</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <span>待处理认领</span>
              <el-tag type="danger">{{ dashboardData?.stats?.pendingClaimCount || 0 }}</el-tag>
              <el-button type="primary" link @click="$router.push('/admin/audit')">查看全部</el-button>
            </div>
          </template>
          <div v-loading="loading" class="list-wrapper">
            <div v-if="dashboardData?.pendingClaims?.length === 0" class="empty-hint">暂无待处理认领</div>
            <div v-for="item in dashboardData?.pendingClaims || []" :key="item.id" class="list-item">
              <div class="item-main">
                <el-tag type="info" size="small">{{ item.apply_no }}</el-tag>
                <span class="item-title">{{ item.post_title || '信息' }}</span>
              </div>
              <div class="item-sub">
                <span>{{ item.verify_desc || '无验证信息' }}</span>
                <span class="item-time">{{ formatDate(item.created_at) }}</span>
              </div>
              <div class="item-actions">
                <el-button type="success" size="small" @click="handleApproveClaim(item.id)">通过</el-button>
                <el-button type="warning" size="small" @click="$router.push('/admin/audit')">处理</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷入口 -->
    <el-card class="quick-links-card" style="margin-top: 16px">
      <template #header>快捷入口</template>
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="quick-link" @click="$router.push('/admin/audit')">
            <el-icon :size="28" color="#409eff"><DocumentChecked /></el-icon>
            <span>信息审核</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="quick-link" @click="$router.push('/admin/users')">
            <el-icon :size="28" color="#67c23a"><User /></el-icon>
            <span>用户管理</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="quick-link" @click="$router.push('/admin/stats')">
            <el-icon :size="28" color="#e6a23c"><DataAnalysis /></el-icon>
            <span>数据统计</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="quick-link" @click="$router.push('/admin/configs')">
            <el-icon :size="28" color="#909399"><Setting /></el-icon>
            <span>系统设置</span>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getDashboard, approvePost, approveClaim } from '@/api/admin'
import dayjs from 'dayjs'

const router = useRouter()
const loading = ref(false)
const dashboardData = ref(null)

const hasAlerts = computed(() => {
  const s = dashboardData.value?.stats
  return s && (s.timeoutClaims > 0 || s.expiredPosts > 0 || s.pendingClaimCount > 0)
})

const statCards = computed(() => {
  const s = dashboardData.value?.stats || {}
  return [
    { key: 'total', label: '总发布数', value: s.totalPosts || 0, icon: 'Document', type: 'primary', extra: `今日新增: ${s.todayPosts || 0}` },
    { key: 'pending', label: '待审核', value: s.pendingCount || 0, icon: 'Clock', type: 'warning', extra: '点击信息审核处理' },
    { key: 'found', label: '已找到', value: s.foundPosts || 0, icon: 'CircleCheck', type: 'success', extra: `认领率: ${s.claimRate || 0}%` },
    { key: 'users', label: '用户数', value: s.totalUsers || 0, icon: 'User', type: 'info', extra: `待处理认领: ${s.pendingClaimCount || 0}` }
  ]
})

const formatDate = (date) => dayjs(date).format('MM-DD HH:mm')

const loadDashboard = async () => {
  loading.value = true
  try {
    const res = await getDashboard()
    dashboardData.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleApprovePost = async (id) => {
  try {
    await approvePost(id)
    ElMessage.success('审核通过')
    loadDashboard()
  } catch (e) {
    console.error(e)
  }
}

const handleApproveClaim = async (id) => {
  try {
    await approveClaim(id)
    ElMessage.success('认领通过')
    loadDashboard()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<style lang="scss" scoped>
.dashboard {
  .stats-row {
    margin-bottom: 16px;
  }

  .stat-card {
    &.primary .stat-icon { color: #409eff; }
    &.success .stat-icon { color: #67c23a; }
    &.warning .stat-icon { color: #e6a23c; }
    &.info .stat-icon { color: #909399; }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-info {
      flex: 1;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #333;
      line-height: 1;
    }

    .stat-label {
      font-size: 13px;
      color: #999;
      margin-top: 4px;
    }

    .stat-footer {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;
      font-size: 12px;
      color: #999;
    }
  }

  .alert-row {
    margin-bottom: 16px;
  }

  .alert-content {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .panel-card {
    margin-bottom: 16px;

    .panel-header {
      display: flex;
      align-items: center;
      gap: 8px;

      .el-tag {
        margin-left: auto;
      }
    }

    .list-wrapper {
      max-height: 400px;
      overflow-y: auto;
    }

    .empty-hint {
      text-align: center;
      color: #999;
      padding: 40px 0;
    }

    .list-item {
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .item-main {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;

        .item-title {
          font-size: 14px;
          font-weight: 500;
        }
      }

      .item-sub {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: #999;
        margin-bottom: 8px;
      }

      .item-actions {
        text-align: right;
      }
    }
  }

  .quick-links-card {
    .quick-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: #f5f7fa;
      }

      span {
        font-size: 14px;
        color: #666;
      }
    }
  }
}
</style>
