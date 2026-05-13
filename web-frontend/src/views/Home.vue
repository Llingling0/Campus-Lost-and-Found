<template>
  <div class="home-page">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <h1 class="hero-title">校园失物招领</h1>
        <p class="hero-subtitle">快速找到丢失物品，让每一件失物都能回家</p>

        <div class="search-box">
          <el-input
            v-model="keyword"
            placeholder="搜索物品名称、描述、地点..."
            size="large"
            clearable
            @keyup.enter="handleSearch"
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" size="large" @click="handleSearch" class="search-btn">
            <el-icon><Search /></el-icon>
            <span>搜索</span>
          </el-button>
        </div>

        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-num">{{ total || 0 }}</span>
            <span class="stat-label">条信息</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num">{{ categories.length }}</span>
            <span class="stat-label">个分类</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num">{{ announcements.length }}</span>
            <span class="stat-label">条公告</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="content-section">
      <el-row :gutter="24">
        <!-- Left: Post List -->
        <el-col :span="18">
          <div class="section-header">
            <h2 class="section-title">最新信息</h2>
            <el-radio-group v-model="postType" size="small" @change="fetchPosts" class="type-filter">
              <el-radio-button :label="0">全部</el-radio-button>
              <el-radio-button :label="1">失物</el-radio-button>
              <el-radio-button :label="2">招领</el-radio-button>
            </el-radio-group>
          </div>

          <!-- Skeleton Loading -->
          <div v-if="loading" class="post-grid-skeleton">
            <div v-for="i in 6" :key="i" class="skeleton-card">
              <div class="skeleton skeleton-img"></div>
              <div class="skeleton-info">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-line"></div>
                <div class="skeleton skeleton-line short"></div>
              </div>
            </div>
          </div>

          <!-- Post Grid -->
          <div v-else class="post-grid">
            <div
              v-for="(item, idx) in postList"
              :key="item.id"
              class="post-card"
              :style="{ animationDelay: `${idx * 0.05}s` }"
              @click="goDetail(item.id)"
            >
              <div class="post-image">
                <el-image v-if="item.images?.[0]?.imgUrl" :src="item.images[0].imgUrl" fit="cover" lazy />
                <div v-else class="no-image">
                  <el-icon :size="36"><Picture /></el-icon>
                </div>
                <span :class="['type-badge', item.post_type === 1 ? 'lost' : 'found']">
                  {{ item.post_type === 1 ? '失物' : '招领' }}
                </span>
              </div>
              <div class="post-body">
                <h3 class="post-title">{{ item.title }}</h3>
                <p class="post-desc">{{ item.detail || '暂无描述' }}</p>
                <div class="post-meta">
                  <span class="meta-item">
                    <el-icon><Location /></el-icon>
                    {{ item.occur_location || '未知地点' }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Clock /></el-icon>
                    {{ formatDate(item.created_at) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <el-empty v-if="!loading && postList.length === 0" description="暂无信息" />

          <div v-if="total > pageSize" class="pagination">
            <el-pagination
              v-model:current-page="pageNo"
              v-model:page-size="pageSize"
              :total="total"
              layout="prev, pager, next"
              background
              @current-change="fetchPosts"
            />
          </div>
        </el-col>

        <!-- Right: Sidebar -->
        <el-col :span="6">
          <!-- Categories -->
          <div class="sidebar-card">
            <div class="sidebar-header">
              <el-icon><Grid /></el-icon>
              <span>物品分类</span>
            </div>
            <div class="category-list">
              <div
                v-for="cat in categories"
                :key="cat.id"
                :class="['category-item', { active: postType === cat.id }]"
                @click="handleCategoryClick(cat.id)"
              >
                <span :class="['cat-dot', `cat-${cat.id}`]"></span>
                <span class="cat-name">{{ cat.name }}</span>
                <span class="cat-count">{{ cat.count || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Announcements -->
          <div class="sidebar-card">
            <div class="sidebar-header">
              <el-icon><Bell /></el-icon>
              <span>校园公告</span>
            </div>
            <div class="announcement-list">
              <div v-if="announcements.length === 0" class="sidebar-empty">
                <el-icon><InfoFilled /></el-icon>
                <span>暂无公告</span>
              </div>
              <div
                v-for="item in announcements"
                :key="item.id"
                class="announcement-item"
              >
                <div class="anno-dot"></div>
                <div class="anno-content">
                  <div class="anno-title">{{ item.title }}</div>
                  <div class="anno-time">{{ formatDate(item.created_at) }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- Announcement Popup -->
    <el-dialog
      v-model="showAnnouncement"
      :title="currentAnnouncement?.title || '公告'"
      width="480px"
      :close-on-click-modal="false"
      center
    >
      <div class="announcement-popup-content">
        <el-image
          v-if="currentAnnouncement?.image_url"
          :src="currentAnnouncement.image_url"
          fit="contain"
          style="max-height:200px;margin-bottom:16px;border-radius:8px"
        />
        <p>{{ currentAnnouncement?.content }}</p>
        <p class="announcement-time" v-if="currentAnnouncement?.created_at">
          {{ formatDate(currentAnnouncement.created_at) }}
        </p>
      </div>
      <template #footer>
        <el-checkbox v-model="dontShowAgain" style="float:left;margin-top:6px">不再显示</el-checkbox>
        <el-button type="primary" @click="closeAnnouncement">我知道了</el-button>
      </template>
    </el-dialog>
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
const showAnnouncement = ref(false)
const currentAnnouncement = ref(null)
const dontShowAgain = ref(false)
const pageNo = ref(1)
const pageSize = ref(12)
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
    const origin = window.location.origin
    announcements.value = (res.data || []).map(a => ({
      ...a,
      image_url: a.image_url ? (a.image_url.startsWith('/') ? origin + a.image_url : a.image_url) : null
    }))
    checkShowPopup()
  } catch (e) {
    console.error('获取公告失败:', e)
  }
}

const checkShowPopup = () => {
  if (announcements.value.length === 0) return
  const latest = announcements.value[0]
  const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]')
  if (!dismissed.includes(latest.id)) {
    currentAnnouncement.value = latest
    showAnnouncement.value = true
  }
}

const closeAnnouncement = () => {
  if (dontShowAgain.value && currentAnnouncement.value) {
    const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]')
    dismissed.push(currentAnnouncement.value.id)
    localStorage.setItem('dismissed_announcements', JSON.stringify(dismissed))
  }
  showAnnouncement.value = false
}

const handleSearch = () => {
  useSmartSearch.value = !!keyword.value
  pageNo.value = 1
  fetchPosts()
}

const handleCategoryClick = (categoryId) => {
  postType.value = categoryId === postType.value ? 0 : categoryId
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

// --- Hero ---
.hero-section {
  position: relative;
  border-radius: var(--radius-xl);
  margin-bottom: 32px;
  padding: 56px 48px 48px;
  overflow: hidden;
  background: var(--c-primary-gradient);

  .hero-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%),
      url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fff' fill-opacity='.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }

  .hero-content {
    position: relative;
    z-index: 1;
    text-align: center;
    color: #fff;
  }

  .hero-title {
    font-size: 36px;
    font-weight: 800;
    margin-bottom: 12px;
    letter-spacing: 1px;
  }

  .hero-subtitle {
    font-size: 16px;
    opacity: 0.85;
    margin-bottom: 32px;
  }

  .search-box {
    display: flex;
    max-width: 600px;
    margin: 0 auto 32px;
    gap: 12px;

    .search-input {
      flex: 1;
      :deep(.el-input__wrapper) {
        border-radius: var(--radius-md) !important;
        box-shadow: 0 4px 20px rgba(0,0,0,0.12) !important;
        height: 50px;
      }
    }

    .search-btn {
      height: 50px;
      padding: 0 28px;
      font-size: 15px;
      border-radius: var(--radius-md) !important;
      background: #fff !important;
      color: var(--c-primary) !important;
      font-weight: 600;
      box-shadow: 0 4px 20px rgba(0,0,0,0.12);

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 24px rgba(0,0,0,0.16);
      }
    }
  }

  .stats-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 32px;

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .stat-num {
        font-size: 28px;
        font-weight: 700;
      }

      .stat-label {
        font-size: 13px;
        opacity: 0.7;
      }
    }

    .stat-divider {
      width: 1px;
      height: 36px;
      background: rgba(255, 255, 255, 0.25);
    }
  }
}

// --- Content Section ---
.content-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--c-text-primary);
    }

    .type-filter {
      :deep(.el-radio-button__inner) {
        border-radius: 6px !important;
      }
    }
  }
}

// --- Skeleton ---
.post-grid-skeleton {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  .skeleton-card {
    background: #fff;
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);

    .skeleton-img {
      width: 100%;
      height: 180px;
      border-radius: 0;
    }

    .skeleton-info {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;

      .skeleton-title {
        height: 20px;
        width: 70%;
      }

      .skeleton-line {
        height: 14px;
        width: 100%;

        &.short {
          width: 50%;
        }
      }
    }
  }
}

// --- Post Grid ---
.post-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
      height: 180px;
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
        background: var(--c-bg);
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
        backdrop-filter: blur(6px);

        &.lost {
          background: rgba(245, 158, 11, 0.88);
        }

        &.found {
          background: rgba(16, 185, 129, 0.88);
        }
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

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    }
  }
}

// --- Pagination ---
.pagination {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

// --- Sidebar ---
.sidebar-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;

  .sidebar-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: var(--c-text-primary);
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--c-border-light);

    .el-icon {
      color: var(--c-primary);
    }
  }

  .sidebar-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 0;
    color: var(--c-text-tertiary);
    font-size: 13px;
  }
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .category-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: 14px;

    &:hover {
      background: var(--c-primary-soft);
    }

    &.active {
      background: var(--c-primary-soft);
      color: var(--c-primary);
      font-weight: 600;

      .cat-dot {
        box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.2);
      }
    }

    .cat-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;

      &.cat-1 { background: #3b82f6; }
      &.cat-2 { background: #8b5cf6; }
      &.cat-3 { background: #ec4899; }
      &.cat-4 { background: #f59e0b; }
      &.cat-5 { background: #10b981; }
      &.cat-6 { background: #06b6d4; }
    }

    .cat-name {
      flex: 1;
    }

    .cat-count {
      font-size: 12px;
      color: var(--c-text-tertiary);
      background: var(--c-bg);
      padding: 2px 8px;
      border-radius: 10px;
    }
  }
}

.announcement-list {
  .announcement-item {
    display: flex;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid var(--c-border-light);

    &:last-child {
      border-bottom: none;
    }

    .anno-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--c-accent);
      margin-top: 6px;
      flex-shrink: 0;
    }

    .anno-content {
      flex: 1;
      min-width: 0;
    }

    .anno-title {
      font-size: 13px;
      color: var(--c-text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 4px;
    }

    .anno-time {
      font-size: 12px;
      color: var(--c-text-tertiary);
    }
  }
}

// --- Announcement Popup ---
.announcement-popup-content {
  p {
    font-size: 15px;
    color: var(--c-text-secondary);
    line-height: 1.7;
    white-space: pre-wrap;
  }

  .announcement-time {
    font-size: 12px;
    color: var(--c-text-tertiary);
    margin-top: 12px;
  }
}

// --- Responsive ---
@media (max-width: 1200px) {
  .post-grid,
  .post-grid-skeleton {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 40px 20px 32px;
    .hero-title { font-size: 26px; }
  }

  .post-grid,
  .post-grid-skeleton {
    grid-template-columns: 1fr;
  }

  .search-box {
    flex-direction: column;
    .search-btn { width: 100%; justify-content: center; }
  }

  .stats-row {
    gap: 20px;
    .stat-num { font-size: 22px; }
  }
}
</style>
