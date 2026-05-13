<template>
  <div class="list-page">
    <div class="page-hero">
      <h1>{{ postType === 1 ? '失物信息' : '招领信息' }}</h1>
      <p>{{ postType === 1 ? '浏览丢失物品，帮助找回失物' : '查看拾获物品，寻找失主认领' }}</p>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-input
          v-model="keyword"
          placeholder="搜索物品名称、描述..."
          clearable
          :prefix-icon="Search"
          style="width: 280px"
          @keyup.enter="handleSearch"
        />
        <el-select v-model="categoryId" placeholder="全部分类" clearable style="width: 150px" @change="fetchPosts">
          <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 240px"
          @change="fetchPosts"
        />
      </div>
      <div class="filter-right">
        <el-button @click="handleReset">重置</el-button>
        <el-button type="primary" @click="$router.push('/publish')">
          <el-icon><Plus /></el-icon> 发布
        </el-button>
      </div>
    </div>

    <!-- Post Grid -->
    <div v-loading="loading" class="post-grid" element-loading-text="加载中...">
      <div
        v-for="(item, idx) in postList"
        :key="item.id"
        class="post-card"
        :style="{ animationDelay: `${idx * 0.04}s` }"
        @click="goDetail(item.id)"
      >
        <div class="post-image">
          <el-image v-if="item.images?.[0]?.imgUrl" :src="item.images[0].imgUrl" fit="cover" lazy />
          <div v-else class="no-image">
            <el-icon :size="40"><Picture /></el-icon>
          </div>
          <span :class="['type-badge', item.post_type === 1 ? 'lost' : 'found']">
            {{ item.post_type === 1 ? '失物' : '招领' }}
          </span>
        </div>
        <div class="post-body">
          <h3 class="post-title">{{ item.title }}</h3>
          <p class="post-desc">{{ item.detail || '暂无描述' }}</p>
          <div class="post-meta">
            <span><el-icon><Location /></el-icon> {{ item.occur_location || '未知' }}</span>
            <span><el-icon><Clock /></el-icon> {{ formatDate(item.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <el-empty v-if="!loading && postList.length === 0" description="暂无相关信息">
      <el-button type="primary" @click="$router.push('/publish')">发布第一条信息</el-button>
    </el-empty>

    <div v-if="total > pageSize" class="pagination">
      <el-pagination
        v-model:current-page="pageNo"
        v-model:page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total"
        background
        @current-change="fetchPosts"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { getPostList, getCategories } from '@/api/post'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const postType = ref(route.name === 'LostList' ? 1 : 2)
const keyword = ref('')
const categoryId = ref(undefined)
const dateRange = ref([])
const categories = ref([])
const postList = ref([])
const loading = ref(false)
const pageNo = ref(1)
const pageSize = ref(20)
const total = ref(0)

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD')

const fetchCategories = async () => {
  try {
    const res = await getCategories()
    categories.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

const fetchPosts = async () => {
  loading.value = true
  try {
    const params = {
      postType: postType.value,
      keyword: keyword.value || undefined,
      categoryId: categoryId.value || undefined,
      status: 2,
      pageNo: pageNo.value,
      pageSize: pageSize.value
    }
    if (dateRange.value?.length === 2) {
      params.startTime = dayjs(dateRange.value[0]).format('YYYY-MM-DD')
      params.endTime = dayjs(dateRange.value[1]).format('YYYY-MM-DD')
    }
    const res = await getPostList(params)
    postList.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNo.value = 1
  fetchPosts()
}

const handleReset = () => {
  keyword.value = ''
  categoryId.value = undefined
  dateRange.value = []
  pageNo.value = 1
  fetchPosts()
}

const goDetail = (id) => {
  router.push(`/detail/${id}`)
}

watch(() => route.name, () => {
  postType.value = route.name === 'LostList' ? 1 : 2
  fetchPosts()
})

onMounted(() => {
  fetchCategories()
  fetchPosts()
})
</script>

<style lang="scss" scoped>
.list-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-hero {
  text-align: center;
  margin-bottom: 24px;

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

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;

  .filter-left,
  .filter-right {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
}

.post-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;

  .post-card {
    background: #fff;
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    transition: all var(--transition-base);
    animation: fadeInUp 0.4s ease both;

    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);

      .post-image .el-image {
        transform: scale(1.05);
      }
    }

    .post-image {
      position: relative;
      width: 100%;
      height: 200px;
      overflow: hidden;
      background: var(--c-bg);

      .el-image {
        width: 100%;
        height: 100%;
        transition: transform 0.4s ease;
      }

      .no-image {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--c-text-tertiary);
        background: var(--c-bg-elevated);
      }

      .type-badge {
        position: absolute;
        top: 12px;
        left: 12px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        color: #fff;

        &.lost  { background: rgba(245, 158, 11, 0.88); }
        &.found { background: rgba(16, 185, 129, 0.88); }
      }
    }

    .post-body {
      padding: 16px;

      .post-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--c-text-primary);
        margin-bottom: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .post-desc {
        font-size: 13px;
        color: var(--c-text-tertiary);
        margin-bottom: 12px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        line-height: 1.5;
      }

      .post-meta {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: var(--c-text-tertiary);

        span {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    }
  }
}

.pagination {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}
</style>
