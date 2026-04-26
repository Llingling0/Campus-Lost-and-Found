<template>
  <div class="list-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ postType === 1 ? '失物信息' : '招领信息' }}</span>
          <el-button type="primary" @click="$router.push('/publish')">
            <el-icon><Plus /></el-icon> 发布
          </el-button>
        </div>
      </template>

      <div class="filter-section">
        <el-input
          v-model="keyword"
          placeholder="搜索物品..."
          clearable
          style="width: 300px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
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
        <el-button @click="handleReset">重置</el-button>
      </div>

      <div v-loading="loading" class="post-grid">
        <div v-for="item in postList" :key="item.id" class="post-card" @click="goDetail(item.id)">
          <div class="post-image">
            <el-image v-if="item.images?.[0]?.imgUrl" :src="item.images[0].imgUrl" fit="cover" />
            <div v-else class="no-image"><el-icon><Picture /></el-icon></div>
            <el-tag :type="item.post_type === 1 ? 'warning' : 'success'" class="type-tag">
              {{ item.post_type === 1 ? '失物' : '招领' }}
            </el-tag>
          </div>
          <div class="post-content">
            <div class="post-title">{{ item.title }}</div>
            <div class="post-desc">{{ item.detail || '暂无描述' }}</div>
            <div class="post-meta">
              <span><el-icon><Location /></el-icon> {{ item.occur_location || '未知' }}</span>
              <span><el-icon><Clock /></el-icon> {{ formatDate(item.created_at) }}</span>
            </div>
          </div>
        </div>
        <el-empty v-if="!loading && postList.length === 0" description="暂无信息" />
      </div>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="total"
          layout="prev, pager, next, total"
          @current-change="fetchPosts"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.post-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;

  .post-card {
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }

    .post-image {
      width: 100%;
      height: 200px;
      position: relative;
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
        font-size: 48px;
      }

      .type-tag {
        position: absolute;
        top: 12px;
        left: 12px;
      }
    }

    .post-content {
      padding: 16px;

      .post-title {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .post-desc {
        font-size: 14px;
        color: #666;
        margin-bottom: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .post-meta {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: #999;

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
  margin-top: 24px;
  text-align: center;
}
</style>
