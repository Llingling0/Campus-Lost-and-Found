<template>
  <div class="stats-page">
    <el-row :gutter="24">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>数据统计概览</span>
              <el-button type="primary" @click="handleExport">
                <el-icon><Download /></el-icon> 导出 Excel
              </el-button>
            </div>
          </template>

          <div class="stats-overview">
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2)">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalPosts || 0 }}</div>
                <div class="stat-label">总发布数</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c)">
                <el-icon><CircleCheck /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.found || 0 }}</div>
                <div class="stat-label">已找回</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe)">
                <el-icon><PieChart /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.claimRate || '0.00' }}%</div>
                <div class="stat-label">找回率</div>
              </div>
            </div>
          </div>

          <div class="chart-section">
            <h3>物品分类分布</h3>
            <div ref="pieChartRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <span>热门地点排行</span>
          </template>
          <div class="location-list">
            <div v-for="(item, idx) in topLocations" :key="idx" class="location-item">
              <span class="rank" :class="'rank-' + (idx + 1)">{{ idx + 1 }}</span>
              <span class="name">{{ item.location }}</span>
              <span class="count">{{ item.count }}次</span>
            </div>
            <el-empty v-if="topLocations.length === 0" description="暂无数据" size="small" />
          </div>
        </el-card>

        <el-card class="mt-24">
          <template #header>
            <span>系统信息</span>
          </template>
          <div class="system-info">
            <div class="info-item">
              <span class="label">当前用户数</span>
              <span class="value">--</span>
            </div>
            <div class="info-item">
              <span class="label">今日发布</span>
              <span class="value">--</span>
            </div>
            <div class="info-item">
              <span class="label">待审核信息</span>
              <span class="value">{{ pendingCount }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { getStatsOverview, exportStats, getPendingPosts } from '@/api/admin'
import * as echarts from 'echarts'

const stats = ref({})
const topLocations = ref([])
const pendingCount = ref(0)
const pieChartRef = ref(null)
let pieChart = null

const fetchStats = async () => {
  try {
    const res = await getStatsOverview()
    stats.value = res.data || {}
    
    // 模拟热门地点数据
    topLocations.value = [
      { location: '教学楼 A 栋', count: 156 },
      { location: '图书馆', count: 128 },
      { location: '食堂一楼', count: 95 },
      { location: '宿舍区', count: 87 },
      { location: '操场', count: 64 }
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
    pieChart = echarts.init(pieChartRef.value)
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center'
      },
      series: [
        {
          name: '物品分类',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          data: data.map(item => ({
            name: getCategoryName(item.category_id),
            value: item.count
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    }
    
    pieChart.setOption(option)
    
    window.addEventListener('resize', () => {
      pieChart?.resize()
    })
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
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stats-overview {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 24px;

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 8px;

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        color: #fff;
      }

      .stat-info {
        .stat-value {
          font-size: 28px;
          font-weight: 600;
          color: #333;
        }

        .stat-label {
          font-size: 14px;
          color: #999;
          margin-top: 4px;
        }
      }
    }
  }

  .chart-section {
    margin-top: 24px;

    h3 {
      margin-bottom: 16px;
      font-size: 16px;
    }

    .chart {
      height: 300px;
    }
  }

  .location-list {
    .location-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #eee;

      &:last-child {
        border-bottom: none;
      }

      .rank {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #eee;
        color: #666;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;

        &.rank-1 {
          background: #ffd700;
          color: #fff;
        }

        &.rank-2 {
          background: #c0c0c0;
          color: #fff;
        }

        &.rank-3 {
          background: #cd7f32;
          color: #fff;
        }
      }

      .name {
        flex: 1;
      }

      .count {
        font-size: 14px;
        color: #999;
      }
    }
  }

  .system-info {
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #eee;

      &:last-child {
        border-bottom: none;
      }

      .label {
        color: #666;
      }

      .value {
        font-weight: 600;
        color: #333;
      }
    }
  }

  .mt-24 {
    margin-top: 24px;
  }
}
</style>
