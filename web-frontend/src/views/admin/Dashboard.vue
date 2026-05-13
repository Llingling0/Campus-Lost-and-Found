<template>
  <div class="dashboard">
    <!-- Stats Row -->
    <div class="stats-row">
      <div v-for="card in statCards" :key="card.key" :class="['stat-card', card.type]">
        <div class="stat-icon-box">
          <el-icon :size="24"><component :is="card.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </div>
        <div class="stat-trend" v-if="card.extra">
          <el-icon :size="14"><Top /></el-icon>
          <span>{{ card.extra }}</span>
        </div>
      </div>
    </div>

    <!-- Alerts -->
    <transition name="fade">
      <div v-if="hasAlerts" class="alerts-row">
        <div class="alert-tag" v-if="dashboardData?.stats?.pendingCount > 0">
          <span class="alert-dot warn"></span>
          <span>待审核 <strong>{{ dashboardData.stats.pendingCount }}</strong> 条</span>
        </div>
        <div class="alert-tag" v-if="dashboardData?.stats?.pendingClaimCount > 0">
          <span class="alert-dot danger"></span>
          <span>待处理认领 <strong>{{ dashboardData.stats.pendingClaimCount }}</strong> 条</span>
        </div>
        <div class="alert-tag" v-if="dashboardData?.stats?.timeoutClaims > 0">
          <span class="alert-dot info"></span>
          <span>超时认领 <strong>{{ dashboardData.stats.timeoutClaims }}</strong> 条</span>
        </div>
      </div>
    </transition>

    <!-- Two Column Layout -->
    <el-row :gutter="20">
      <!-- Pending Posts -->
      <el-col :span="12">
        <div class="panel-card">
          <div class="panel-header">
            <div class="panel-title">
              <el-icon color="#f59e0b"><Clock /></el-icon>
              <span>待审核信息</span>
            </div>
            <el-tag type="warning" effect="plain" round>
              {{ dashboardData?.stats?.pendingCount || 0 }} 条
            </el-tag>
            <el-button type="primary" link @click="$router.push('/admin/audit')">查看全部</el-button>
          </div>
          <div v-loading="loading" class="panel-body">
            <div v-if="!dashboardData?.pendingPosts?.length" class="empty-state">
              <el-icon :size="40"><CircleCheck /></el-icon>
              <p>暂无待审核信息</p>
            </div>
            <div
              v-for="item in (dashboardData?.pendingPosts || [])"
              :key="item.id"
              class="list-item"
            >
              <div class="item-top">
                <el-tag :type="item.post_type === 1 ? 'warning' : 'success'" size="small" effect="dark">
                  {{ item.post_type === 1 ? '失物' : '招领' }}
                </el-tag>
                <span class="item-title">{{ item.title }}</span>
              </div>
              <div class="item-meta">
                <span><el-icon><Location /></el-icon> {{ item.occur_location || '-' }}</span>
                <span>{{ formatDate(item.created_at) }}</span>
              </div>
              <div class="item-actions">
                <el-button type="success" size="small" @click.stop="handleApprovePost(item.id)">
                  <el-icon><Select /></el-icon> 通过
                </el-button>
                <el-button size="small" @click.stop="$router.push('/admin/audit')">处理</el-button>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <!-- Pending Claims -->
      <el-col :span="12">
        <div class="panel-card">
          <div class="panel-header">
            <div class="panel-title">
              <el-icon color="#ef4444"><Warning /></el-icon>
              <span>待处理认领</span>
            </div>
            <el-tag type="danger" effect="plain" round>
              {{ dashboardData?.stats?.pendingClaimCount || 0 }} 条
            </el-tag>
            <el-button type="primary" link @click="$router.push('/admin/audit')">查看全部</el-button>
          </div>
          <div v-loading="loading" class="panel-body">
            <div v-if="!dashboardData?.pendingClaims?.length" class="empty-state">
              <el-icon :size="40"><CircleCheck /></el-icon>
              <p>暂无待处理认领</p>
            </div>
            <div
              v-for="item in (dashboardData?.pendingClaims || [])"
              :key="item.id"
              class="list-item"
            >
              <div class="item-top">
                <el-tag type="info" size="small" effect="dark">{{ item.apply_no }}</el-tag>
                <span class="item-title">{{ item.post_title || '未知物品' }}</span>
              </div>
              <div class="item-meta">
                <span>{{ item.verify_desc || '无验证信息' }}</span>
                <span>{{ formatDate(item.created_at) }}</span>
              </div>
              <div class="item-actions">
                <el-button type="success" size="small" @click.stop="handleApproveClaim(item.id)">
                  <el-icon><Select /></el-icon> 通过
                </el-button>
                <el-button size="small" @click.stop="$router.push('/admin/audit')">处理</el-button>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- Quick Links -->
    <div class="quick-section">
      <h3 class="quick-title">快捷入口</h3>
      <div class="quick-grid">
        <div class="quick-card" @click="$router.push('/admin/audit')">
          <div class="quick-icon audit">
            <el-icon :size="24"><DocumentChecked /></el-icon>
          </div>
          <span>信息审核</span>
        </div>
        <div class="quick-card" @click="$router.push('/admin/users')">
          <div class="quick-icon users">
            <el-icon :size="24"><User /></el-icon>
          </div>
          <span>用户管理</span>
        </div>
        <div class="quick-card" @click="$router.push('/admin/stats')">
          <div class="quick-icon stats">
            <el-icon :size="24"><DataAnalysis /></el-icon>
          </div>
          <span>数据统计</span>
        </div>
        <div class="quick-card" @click="$router.push('/admin/configs')">
          <div class="quick-icon configs">
            <el-icon :size="24"><Setting /></el-icon>
          </div>
          <span>系统设置</span>
        </div>
      </div>
    </div>
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
  return s && (s.timeoutClaims > 0 || s.expiredPosts > 0 || s.pendingClaimCount > 0 || s.pendingCount > 0)
})

const statCards = computed(() => {
  const s = dashboardData.value?.stats || {}
  return [
    {
      key: 'total',
      label: '总发布数',
      value: s.totalPosts ?? 0,
      icon: 'Document',
      type: 'primary',
      extra: `今日 +${s.todayPosts || 0}`
    },
    {
      key: 'pending',
      label: '待审核',
      value: s.pendingCount ?? 0,
      icon: 'Clock',
      type: 'warning'
    },
    {
      key: 'found',
      label: '已找回',
      value: s.foundPosts ?? 0,
      icon: 'CircleCheck',
      type: 'success',
      extra: `找回率 ${s.claimRate || 0}%`
    },
    {
      key: 'users',
      label: '总用户',
      value: s.totalUsers ?? 0,
      icon: 'User',
      type: 'info'
    }
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
  animation: fadeInUp 0.4s ease;
}

// --- Stats ---
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 80px;
    height: 80px;
    border-radius: 0 0 0 80px;
    opacity: 0.08;
  }

  &.primary::after { background: var(--c-primary); }
  &.success::after { background: var(--c-success); }
  &.warning::after { background: var(--c-warning); }
  &.info::after    { background: var(--c-info); }

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .stat-icon-box {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;

    .primary & { background: var(--c-primary-soft); color: var(--c-primary); }
    .success & { background: var(--c-success-soft); color: var(--c-success); }
    .warning & { background: var(--c-warning-soft); color: #d97706; }
    .info &    { background: var(--c-info-soft); color: var(--c-info); }
  }

  .stat-info {
    .stat-value {
      font-size: 32px;
      font-weight: 800;
      color: var(--c-text-primary);
      line-height: 1;
      margin-bottom: 6px;
    }

    .stat-label {
      font-size: 14px;
      color: var(--c-text-tertiary);
    }
  }

  .stat-trend {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--c-success);
    font-weight: 500;
  }
}

// --- Alerts ---
.alerts-row {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  .alert-tag {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #fff;
    border-radius: var(--radius-sm);
    font-size: 13px;
    color: var(--c-text-secondary);
    box-shadow: var(--shadow-xs);

    .alert-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      &.warn   { background: var(--c-warning); }
      &.danger { background: var(--c-danger); }
      &.info   { background: var(--c-info); }
    }
  }
}

// --- Panels ---
.panel-card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  margin-bottom: 20px;

  .panel-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--c-border-light);

    .panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: var(--c-text-primary);
      font-size: 15px;
    }

    .el-tag {
      margin-left: auto;
    }
  }

  .panel-body {
    padding: 8px 20px;
    max-height: 420px;
    overflow-y: auto;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 48px 0;
    color: var(--c-text-tertiary);

    .el-icon { color: var(--c-success); }
    p { font-size: 14px; }
  }

  .list-item {
    padding: 14px 0;
    border-bottom: 1px solid var(--c-border-light);

    &:last-child { border-bottom: none; }

    .item-top {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      .item-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--c-text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .item-meta {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: var(--c-text-tertiary);
      margin-bottom: 10px;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .item-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
  }
}

// --- Quick Links ---
.quick-section {
  .quick-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--c-text-primary);
    margin-bottom: 16px;
  }

  .quick-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .quick-card {
    background: #fff;
    border-radius: var(--radius-md);
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    box-shadow: var(--shadow-xs);
    transition: all var(--transition-base);
    font-size: 14px;
    font-weight: 500;
    color: var(--c-text-secondary);

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      color: var(--c-text-primary);
    }

    .quick-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;

      &.audit   { background: linear-gradient(135deg, #3b82f6, #2563eb); }
      &.users   { background: linear-gradient(135deg, #10b981, #059669); }
      &.stats   { background: linear-gradient(135deg, #f59e0b, #d97706); }
      &.configs { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 1200px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .quick-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
