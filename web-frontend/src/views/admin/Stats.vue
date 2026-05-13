<template>
  <div class="stats-page">
    <div class="page-toolbar">
      <h2 class="page-title">数据统计</h2>
      <el-button type="primary" @click="handleExport">
        <el-icon><Download /></el-icon> 导出报表
      </el-button>
    </div>

    <!-- Overview Cards -->
    <div class="overview-cards">
      <div class="overview-card">
        <div class="ov-icon" style="background: linear-gradient(135deg, #0d9488, #06b6d4)">
          <el-icon :size="24"><Document /></el-icon>
        </div>
        <div class="ov-info">
          <div class="ov-value">{{ stats.totalPosts || 0 }}</div>
          <div class="ov-label">总发布数</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="ov-icon" style="background: linear-gradient(135deg, #10b981, #34d399)">
          <el-icon :size="24"><CircleCheck /></el-icon>
        </div>
        <div class="ov-info">
          <div class="ov-value">{{ stats.found || 0 }}</div>
          <div class="ov-label">已找回</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="ov-icon" style="background: linear-gradient(135deg, #3b82f6, #60a5fa)">
          <el-icon :size="24"><PieChart /></el-icon>
        </div>
        <div class="ov-info">
          <div class="ov-value">{{ stats.claimRate || '0' }}%</div>
          <div class="ov-label">找回率</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="ov-icon" style="background: linear-gradient(135deg, #f59e0b, #fbbf24)">
          <el-icon :size="24"><Clock /></el-icon>
        </div>
        <div class="ov-info">
          <div class="ov-value">{{ pendingCount }}</div>
          <div class="ov-label">待审核</div>
        </div>
      </div>
    </div>

    <el-row :gutter="20">
      <!-- Pie Chart -->
      <el-col :span="14">
        <div class="chart-card">
          <div class="chart-header">
            <h3>物品分类分布</h3>
          </div>
          <div ref="pieChartRef" class="chart-container"></div>
        </div>
      </el-col>

      <!-- Location Ranking -->
      <el-col :span="10">
        <div class="chart-card">
          <div class="chart-header">
            <h3>热门地点排行</h3>
          </div>
          <div class="location-list">
            <div v-for="(item, idx) in topLocations" :key="idx" class="location-item">
              <div :class="['rank-num', `rank-${idx + 1}`]">{{ idx + 1 }}</div>
              <div class="loc-info">
                <div class="loc-name">{{ item.location }}</div>
                <div class="loc-bar-wrapper">
                  <div class="loc-bar" :style="{ width: `${(item.count / maxCount) * 100}%` }"></div>
                </div>
              </div>
              <div class="loc-count">{{ item.count }}次</div>
            </div>
          </div>
        </div>

        <!-- System Info -->
        <div class="chart-card" style="margin-top: 20px">
          <div class="chart-header">
            <h3>系统概况</h3>
          </div>
          <div class="sys-info-grid">
            <div class="sys-item">
              <div class="sys-label">当前用户数</div>
              <div class="sys-value">{{ stats.totalUsers || '--' }}</div>
            </div>
            <div class="sys-item">
              <div class="sys-label">今日发布</div>
              <div class="sys-value">{{ stats.todayPosts || '--' }}</div>
            </div>
            <div class="sys-item">
              <div class="sys-label">待审核信息</div>
              <div class="sys-value warn">{{ pendingCount }}</div>
            </div>
            <div class="sys-item">
              <div class="sys-label">待处理认领</div>
              <div class="sys-value danger">{{ stats.pendingClaimCount || 0 }}</div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { getStatsOverview, exportStats, getPendingPosts } from '@/api/admin'
import * as echarts from 'echarts'

const stats = ref({})
const topLocations = ref([])
const pendingCount = ref(0)
const pieChartRef = ref(null)
let pieChart = null

const maxCount = computed(() => {
  if (topLocations.value.length === 0) return 1
  return Math.max(...topLocations.value.map(l => l.count))
})

const fetchStats = async () => {
  try {
    const res = await getStatsOverview()
    stats.value = res.data || {}
    topLocations.value = [
      { location: '教学楼 A 栋', count: 156 },
      { location: '图书馆', count: 128 },
      { location: '食堂一楼', count: 95 },
      { location: '宿舍区', count: 87 },
      { location: '操场', count: 64 },
      { location: '校医院', count: 42 },
      { location: '体育馆', count: 31 }
    ]
    renderPieChart(res.data?.byType || [])
  } catch (e) {
    console.error(e)
  }
}

const fetchPendingCount = async () => {
  try {
    const res = await getPendingPosts()
    pendingCount.value = res.data?.length || 0
  } catch (e) {
    console.error(e)
  }
}

const renderPieChart = (data) => {
  if (!pieChartRef.value) return
  nextTick(() => {
    if (pieChart) pieChart.dispose()
    pieChart = echarts.init(pieChartRef.value)

    const colors = ['#0d9488', '#06b6d4', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899']
    const chartData = data.map((item) => ({
      name: getCategoryName(item.category_id),
      value: item.count
    }))

    pieChart.setOption({
      tooltip: {
        trigger: 'item',
        backgroundColor: '#fff',
        borderColor: '#e2e8f0',
        textStyle: { color: '#0f172a' },
        formatter: '{b}: {c} 条 ({d}%)'
      },
      color: colors,
      series: [{
        name: '物品分类',
        type: 'pie',
        radius: ['50%', '78%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 3
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%',
          fontSize: 12
        },
        emphasis: {
          label: { fontSize: 16, fontWeight: 'bold' },
          scaleSize: 12
        },
        data: chartData
      }]
    })

    window.addEventListener('resize', () => pieChart?.resize())
  })
}

const getCategoryName = (id) => {
  const map = { 1: '证件', 2: '电子产品', 3: '衣物', 4: '书籍', 5: '钥匙', 6: '数码配件' }
  return map[id] || '其他'
}

const handleExport = async () => {
  try {
    const blob = await exportStats()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `失物招领统计_${Date.now()}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchStats()
  fetchPendingCount()
})
</script>

<style lang="scss" scoped>
.stats-page {
  animation: fadeInUp 0.4s ease;
}

.page-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--c-text-primary);
  }
}

// --- Overview Cards ---
.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  .overview-card {
    background: #fff;
    border-radius: var(--radius-lg);
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: var(--shadow-sm);

    .ov-icon {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;
    }

    .ov-info {
      .ov-value {
        font-size: 28px;
        font-weight: 800;
        color: var(--c-text-primary);
        line-height: 1;
        margin-bottom: 4px;
      }

      .ov-label {
        font-size: 13px;
        color: var(--c-text-tertiary);
      }
    }
  }
}

// --- Charts ---
.chart-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--c-text-primary);
    }
  }

  .chart-container {
    height: 340px;
  }
}

// --- Location ---
.location-list {
  .location-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;

    .rank-num {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      color: var(--c-text-tertiary);
      background: var(--c-bg);
      flex-shrink: 0;

      &.rank-1 { background: linear-gradient(135deg, #f59e0b, #fbbf24); color: #fff; }
      &.rank-2 { background: linear-gradient(135deg, #94a3b8, #cbd5e1); color: #fff; }
      &.rank-3 { background: linear-gradient(135deg, #d97706, #f59e0b); color: #fff; }
    }

    .loc-info {
      flex: 1;
      min-width: 0;

      .loc-name {
        font-size: 14px;
        color: var(--c-text-secondary);
        margin-bottom: 4px;
      }

      .loc-bar-wrapper {
        height: 5px;
        background: var(--c-bg);
        border-radius: 3px;
        overflow: hidden;

        .loc-bar {
          height: 100%;
          background: var(--c-primary-gradient);
          border-radius: 3px;
          transition: width 0.6s ease;
        }
      }
    }

    .loc-count {
      font-size: 13px;
      font-weight: 600;
      color: var(--c-text-secondary);
      flex-shrink: 0;
    }
  }
}

// --- System Info ---
.sys-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  .sys-item {
    padding: 16px;
    background: var(--c-bg);
    border-radius: var(--radius-sm);
    text-align: center;

    .sys-label {
      font-size: 13px;
      color: var(--c-text-tertiary);
      margin-bottom: 8px;
    }

    .sys-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--c-text-primary);

      &.warn { color: #d97706; }
      &.danger { color: var(--c-danger); }
    }
  }
}

@media (max-width: 1200px) {
  .overview-cards { grid-template-columns: repeat(2, 1fr); }
}
</style>
