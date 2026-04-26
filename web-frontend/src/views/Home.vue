<template>
  <div class="home-page">
    <div class="search-section">
      <el-card class="search-card">
        <h2>校园失物招领</h2>
        <p class="subtitle">快速找到丢失物品，让爱传递校园</p>
        <el-input
          v-model="keyword"
          placeholder="搜索物品名称、描述..."
          size="large"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
        <div class="quick-links">
          <el-tag v-for="cat in categories" :key="cat.id" @click="handleCategoryClick(cat.id)">
            {{ cat.name }}
          </el-tag>
        </div>
      </el-card>
    </div>

    <div class="content-section">
      <el-row :gutter="24">
        <el-col :span="18">
          <el-card class="posts-card">
            <template #header>
              <div class="card-header">
                <span>最新信息</span>
                <el-radio-group v-model="postType" size="small" @change="fetchPosts">
                  <el-radio-button :label="0">全部</el-radio-button>
                  <el-radio-button :label="1">失物</el-radio-button>
                  <el-radio-button :label="2">招领</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div v-loading="loading" class="post-list">
              <div v-for="item in postList" :key="item.id" class="post-item" @click="goDetail(item.id)">
                <div class="post-image">
                  <el-image v-if="item.images?.[0]?.imgUrl" :src="item.images[0].imgUrl" fit="cover" />
                  <div v-else class="no-image"><el-icon><Picture /></el-icon></div>
                </div>
                <div class="post-info">
                  <div class="post-title">
                    <el-tag :type="item.post_type === 1 ? 'warning' : 'success'" size="small">
                      {{ item.post_type === 1 ? '失物' : '招领' }}
                    </el-tag>
                    {{ item.title }}
                  </div>
                  <div class="post-meta">
                    <span><el-icon><Location /></el-icon> {{ item.occur_location || '未知地点' }}</span>
                    <span><el-icon><Clock /></el-icon> {{ formatDate(item.created_at) }}</span>
                  </div>
                  <div class="post-desc">{{ item.detail || '暂无描述' }}</div>
                </div>
              </div>
              <el-empty v-if="!loading && postList.length === 0" description="暂无信息" />
            </div>
            <div class="pagination">
              <el-pagination
                v-model:current-page="pageNo"
                v-model:page-size="pageSize"
                :total="total"
                layout="prev, pager, next"
                @current-change="fetchPosts"
              />
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="announcement-card">
            <template #header>
              <span><el-icon><Bell /></el-icon> 校园公告</span>
            </template>
            <div class="announcement-list">
              <div v-for="item in announcements" :key="item.id" class="announcement-item">
                <div class="announcement-title">{{ item.title }}</div>
                <div class="announcement-time">{{ formatDate(item.created_at) }}</div>
              </div>
              <el-empty v-if="announcements.length === 0" description="暂无公告" size="small" />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPostList, getCategories, smartSearch } from '@/api/post'
import { getAnnouncementList } from '@/api/message'
import dayjs from 'dayjs'

const router = useRouter()
const keyword = ref('')
const postType = ref(0)
const categories = ref([])
const postList = ref([])
const announcements = ref([])
const loading = ref(false)
const pageNo = ref(1)
const pageSize = ref(10)
const total = ref(0)
const useSmartSearch = ref(false)

const formatDate = (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '--'

const fetchPosts = async () => {
  loading.value = true
  try {
    let res
    if (useSmartSearch.value && keyword.value) {
      res = await smartSearch({
        keyword: keyword.value,
        postType: postType.value || undefined,
        pageNo: pageNo.value,
        pageSize: pageSize.value
      })
    } else {
      res = await getPostList({
        postType: postType.value || undefined,
        keyword: keyword.value || undefined,
        status: 2,
        pageNo: pageNo.value,
        pageSize: pageSize.value
      })
    }
    postList.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (e) {
    console.error('获取帖子列表失败:', e)
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const res = await getCategories()
    categories.value = res.data || []
  } catch (e) {
    console.error('获取分类失败:', e)
  }
}

const fetchAnnouncements = async () => {
  try {
    const res = await getAnnouncementList()
    announcements.value = res.data || []
  } catch (e) {
    console.error('获取公告失败:', e)
  }
}

const handleSearch = () => {
  useSmartSearch.value = !!keyword.value
  pageNo.value = 1
  fetchPosts()
}

const handleCategoryClick = (categoryId) => {
  postType.value = categoryId
  useSmartSearch.value = false
  pageNo.value = 1
  fetchPosts()
}

const goDetail = (id) => {
  router.push(`/detail/${id}`)
}

onMounted(() => {
  fetchPosts()
  fetchCategories()
  fetchAnnouncements()
})
</script>

<style lang="scss" scoped>
.home-page {
  max-width: 1400px;
  margin: 0 auto;
}

.search-section {
  margin-bottom: 24px;

  .search-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    text-align: center;
    padding: 40px 20px;

    h2 {
      font-size: 32px;
      margin-bottom: 8px;
    }

    .subtitle {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 24px;
    }

    :deep(.el-input__wrapper) {
      background: #fff;
    }

    .quick-links {
      margin-top: 16px;
      display: flex;
      gap: 8px;
      justify-content: center;
      flex-wrap: wrap;

      .el-tag {
        cursor: pointer;
        background: rgba(255,255,255,0.2);
        color: #fff;
        border-color: transparent;

        &:hover {
          background: rgba(255,255,255,0.3);
        }
      }
    }
  }
}

.content-section {
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
      cursor: pointer;
      transition: all 0.3s;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: #f9f9f9;
      }

      .post-image {
        width: 120px;
        height: 90px;
        flex-shrink: 0;
        border-radius: 8px;
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
          font-size: 32px;
        }
      }

      .post-info {
        flex: 1;
        min-width: 0;

        .post-title {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .post-meta {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #999;
          margin-bottom: 8px;

          span {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }

        .post-desc {
          font-size: 14px;
          color: #666;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }

  .pagination {
    margin-top: 24px;
    text-align: center;
  }

  .announcement-card {
    margin-bottom: 24px;

    .announcement-list {
      .announcement-item {
        padding: 12px 0;
        border-bottom: 1px solid #eee;

        &:last-child {
          border-bottom: none;
        }

        .announcement-title {
          font-size: 14px;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .announcement-time {
          font-size: 12px;
          color: #999;
        }
      }
    }
  }
}
</style>
