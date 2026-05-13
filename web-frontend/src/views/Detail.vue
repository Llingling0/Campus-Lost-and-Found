<template>
  <div class="detail-page">
    <div v-loading="loading" class="detail-layout">
      <!-- Back Button -->
      <div class="back-row">
        <el-button text @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
      </div>

      <!-- Image Gallery -->
      <div class="gallery-section">
        <div v-if="detail.images?.length" class="image-grid">
          <el-image
            v-for="(img, idx) in detail.images"
            :key="idx"
            :src="img.imgUrl"
            fit="cover"
            :preview-src-list="detail.images.map(i => i.imgUrl)"
            :initial-index="idx"
            class="gallery-image"
          />
        </div>
        <div v-else class="no-image">
          <el-icon :size="48"><Picture /></el-icon>
          <span>暂无图片</span>
        </div>
      </div>

      <el-row :gutter="24">
        <!-- Info Section -->
        <el-col :span="17">
          <div class="info-card">
            <div class="info-header">
              <el-tag
                :type="detail.post_type === 1 ? 'warning' : 'success'"
                effect="dark"
                size="large"
              >
                {{ detail.post_type === 1 ? '失物' : '招领' }}
              </el-tag>
              <el-tag
                v-if="detail.status"
                :type="getStatusTagType(detail.status)"
                effect="plain"
                size="large"
                class="status-tag"
              >
                {{ getStatusText(detail.status) }}
              </el-tag>
            </div>

            <h1 class="post-title">{{ detail.title }}</h1>

            <div class="meta-grid">
              <div class="meta-item">
                <el-icon><Clock /></el-icon>
                <div>
                  <div class="meta-label">发布时间</div>
                  <div class="meta-value">{{ formatDate(detail.created_at) }}</div>
                </div>
              </div>
              <div class="meta-item">
                <el-icon><Location /></el-icon>
                <div>
                  <div class="meta-label">地点</div>
                  <div class="meta-value">{{ detail.occur_location || '未知' }}</div>
                </div>
              </div>
              <div class="meta-item">
                <el-icon><User /></el-icon>
                <div>
                  <div class="meta-label">发布人</div>
                  <div class="meta-value">{{ detail.publisher?.nickname || '匿名用户' }}</div>
                </div>
              </div>
            </div>

            <el-divider />

            <div class="content-section">
              <h3>物品描述</h3>
              <p class="detail-text">{{ detail.detail || '暂无详细描述' }}</p>
            </div>

            <!-- Reward -->
            <div v-if="detail.post_type === 1 && detail.reward_amount > 0" class="reward-box">
              <div class="reward-icon">
                <el-icon :size="24"><Money /></el-icon>
              </div>
              <div class="reward-info">
                <div class="reward-label">悬赏金额</div>
                <div class="reward-amount">¥ {{ detail.reward_amount }}</div>
              </div>
            </div>

            <!-- Contact (found items) -->
            <div v-if="detail.post_type === 2 && detail.contact_info" class="info-box">
              <h3>联系方式</h3>
              <p>{{ detail.contact_info }}</p>
            </div>

            <!-- Deposit Location (found items) -->
            <div v-if="detail.post_type === 2 && detail.deposit_location" class="info-box">
              <h3>存放地点</h3>
              <p>{{ detail.deposit_location }}</p>
            </div>
          </div>
        </el-col>

        <!-- Action Sidebar -->
        <el-col :span="7">
          <div class="action-card">
            <h3>操作</h3>
            <div class="action-buttons">
              <el-button
                v-if="canClaim"
                type="primary"
                size="large"
                class="action-btn claim-btn"
                @click="showClaimDialog = true"
              >
                <el-icon><CircleCheck /></el-icon>
                我要认领
              </el-button>
              <el-button
                v-if="canReturn"
                type="success"
                size="large"
                class="action-btn return-btn"
                @click="handleReturn"
              >
                <el-icon><CircleCheck /></el-icon>
                标记已归还
              </el-button>
              <el-button
                v-if="canEdit"
                size="large"
                class="action-btn"
                @click="$router.push(`/publish/${detail.id}`)"
              >
                <el-icon><Edit /></el-icon>
                编辑信息
              </el-button>
              <el-button
                v-if="canDelete"
                type="danger"
                size="large"
                class="action-btn"
                plain
                @click="handleDelete"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>

            <!-- Publisher Info -->
            <div class="publisher-info">
              <el-avatar :size="48">{{ detail.publisher?.nickname?.charAt(0) || 'U' }}</el-avatar>
              <div class="pub-detail">
                <div class="pub-name">{{ detail.publisher?.nickname || '匿名用户' }}</div>
                <div class="pub-meta">
                  {{ detail.publisher?.college || '' }}
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- Recommendations -->
      <div v-if="recommendations.length > 0" class="recommend-section">
        <h2 class="section-title">相关推荐</h2>
        <div class="recommend-grid">
          <div
            v-for="item in recommendations"
            :key="item.id"
            class="recommend-card"
            @click="$router.push(`/detail/${item.id}`)"
          >
            <div class="rec-image">
              <el-image v-if="item.images?.[0]?.imgUrl" :src="item.images[0].imgUrl" fit="cover" />
              <el-icon v-else :size="24"><Picture /></el-icon>
            </div>
            <div class="rec-info">
              <div class="rec-title">{{ item.title }}</div>
              <div class="rec-time">{{ formatDate(item.created_at) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Claim Dialog -->
    <el-dialog v-model="showClaimDialog" title="认领申请" width="520px" :close-on-click-modal="false">
      <el-form :model="claimForm" label-width="90px">
        <el-form-item label="验证信息" required>
          <el-input
            v-model="claimForm.verifyDesc"
            type="textarea"
            :rows="3"
            placeholder="请描述物品特征以验证身份（如编号、颜色、品牌、特殊标记等）"
          />
        </el-form-item>
        <el-form-item label="证据图片">
          <el-upload
            v-model:file-list="claimImageList"
            list-type="picture-card"
            :before-upload="beforeImageUpload"
            :http-request="uploadClaimImage"
            :limit="3"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">支持 JPG/PNG，单张不超过 5MB</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showClaimDialog = false">取消</el-button>
        <el-button type="primary" @click="submitClaim" :loading="claimSubmitting">
          提交申请
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPostDetail, getRecommendations, deletePost, createClaim } from '@/api/post'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const detail = ref({})
const recommendations = ref([])
const showClaimDialog = ref(false)
const claimImageList = ref([])
const claimSubmitting = ref(false)

const claimForm = reactive({
  verifyDesc: '',
  evidenceImages: []
})

const getStatusText = (status) => {
  const map = { 0: '草稿', 1: '待审核', 2: '已发布', 3: '已驳回', 4: '已找回', 5: '已过期', 6: '已归还', 7: '已删除' }
  return map[status] || '--'
}

const getStatusTagType = (status) => {
  const map = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger', 4: 'info', 5: 'info', 6: '', 7: 'danger' }
  return map[status] || 'info'
}

const canClaim = computed(() => {
  return userStore.isLoggedIn &&
    detail.value.post_type === 2 &&
    detail.value.status === 2 &&
    detail.value.publisher_id !== userStore.user.id
})

const canReturn = computed(() => {
  return userStore.isLoggedIn &&
    detail.value.post_type === 1 &&
    detail.value.status === 2 &&
    detail.value.publisher_id === userStore.user.id
})

const canEdit = computed(() => {
  return userStore.isLoggedIn && detail.value.publisher_id === userStore.user.id
})

const canDelete = computed(() => {
  return userStore.isLoggedIn &&
    detail.value.publisher_id === userStore.user.id &&
    [0, 1, 3].includes(detail.value.status)
})

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await getPostDetail(route.params.id)
    detail.value = res.data
  } catch (e) {
    console.error(e)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const fetchRecommendations = async () => {
  try {
    const res = await getRecommendations(route.params.id)
    recommendations.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

const beforeImageUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) ElMessage.error('只能上传图片')
  if (!isLt5M) ElMessage.error('图片大小不能超过 5MB')
  return isImage && isLt5M
}

const uploadClaimImage = async (options) => {
  const formData = new FormData()
  formData.append('file', options.file)
  try {
    const res = await request.post('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    claimForm.evidenceImages.push(res.data.url)
    options.onSuccess(res)
  } catch (e) {
    options.onError(e)
  }
}

const submitClaim = async () => {
  if (!claimForm.verifyDesc) {
    ElMessage.warning('请填写验证信息')
    return
  }
  claimSubmitting.value = true
  try {
    await createClaim({
      postId: route.params.id,
      verifyDesc: claimForm.verifyDesc,
      evidenceImages: claimForm.evidenceImages.join(',')
    })
    ElMessage.success('认领申请已提交，请等待审核')
    showClaimDialog.value = false
  } catch (e) {
    console.error(e)
  } finally {
    claimSubmitting.value = false
  }
}

const handleReturn = async () => {
  try {
    await ElMessageBox.confirm('确认已找到该失物？标记后信息将不再公开展示。', '确认归还', {
      type: 'success',
      confirmButtonText: '已找到',
      cancelButtonText: '取消'
    })
  } catch { return }
  try {
    await request.post(`/posts/${route.params.id}/return`)
    ElMessage.success('已标记为归还')
    fetchDetail()
  } catch (e) {
    console.error(e)
  }
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确认删除该信息？此操作不可撤销。', '确认删除', {
      type: 'error',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch { return }
  try {
    await deletePost(route.params.id)
    ElMessage.success('已删除')
    router.back()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchDetail()
  fetchRecommendations()
})
</script>

<style lang="scss" scoped>
.detail-page {
  max-width: 1100px;
  margin: 0 auto;
}

.detail-layout {
  animation: fadeInUp 0.4s ease;
}

.back-row {
  margin-bottom: 16px;
}

// --- Gallery ---
.gallery-section {
  margin-bottom: 24px;

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;

    .gallery-image {
      width: 100%;
      height: 160px;
      border-radius: var(--radius-md);
      overflow: hidden;
      cursor: pointer;
      transition: all var(--transition-base);

      &:hover {
        transform: scale(1.02);
        box-shadow: var(--shadow-md);
      }
    }
  }

  .no-image {
    width: 100%;
    height: 240px;
    border-radius: var(--radius-lg);
    background: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--c-text-tertiary);
    box-shadow: var(--shadow-sm);
  }
}

// --- Info Card ---
.info-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 28px;
  box-shadow: var(--shadow-sm);

  .info-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;

    .status-tag {
      margin-left: 4px;
    }
  }

  .post-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--c-text-primary);
    margin-bottom: 20px;
  }

  .meta-grid {
    display: flex;
    gap: 32px;
    margin-bottom: 8px;

    .meta-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;

      .el-icon {
        color: var(--c-primary);
        font-size: 18px;
        margin-top: 2px;
      }

      .meta-label {
        font-size: 12px;
        color: var(--c-text-tertiary);
        margin-bottom: 2px;
      }

      .meta-value {
        font-size: 14px;
        color: var(--c-text-secondary);
        font-weight: 500;
      }
    }
  }
}

.content-section {
  margin: 20px 0;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--c-text-primary);
    margin-bottom: 10px;
  }

  .detail-text {
    font-size: 15px;
    color: var(--c-text-secondary);
    line-height: 1.7;
    white-space: pre-wrap;
  }
}

.info-box {
  margin: 20px 0;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--c-text-primary);
    margin-bottom: 10px;
  }

  p {
    font-size: 14px;
    color: var(--c-text-secondary);
  }
}

.reward-box {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  margin: 20px 0;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: var(--radius-md);

  .reward-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    background: rgba(245, 158, 11, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #d97706;
  }

  .reward-label {
    font-size: 13px;
    color: #92400e;
    margin-bottom: 2px;
  }

  .reward-amount {
    font-size: 24px;
    font-weight: 800;
    color: #92400e;
  }
}

// --- Action Card ---
.action-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 88px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--c-text-primary);
    margin-bottom: 20px;
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .action-btn {
      width: 100%;
      height: 44px;
    }

    .claim-btn {
      height: 50px;
      font-size: 16px;
      font-weight: 600;
    }

    .return-btn {
      height: 50px;
      font-size: 15px;
      font-weight: 600;
      border-color: #10b981;
      color: #10b981;

      &:hover {
        background: #10b981;
        border-color: #10b981;
        color: #fff;
      }
    }
  }

  .publisher-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--c-border-light);

    .pub-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--c-text-primary);
    }

    .pub-meta {
      font-size: 12px;
      color: var(--c-text-tertiary);
      margin-top: 2px;
    }
  }
}

// --- Recommendations ---
.recommend-section {
  margin-top: 32px;

  .section-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--c-text-primary);
    margin-bottom: 16px;
  }

  .recommend-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .recommend-card {
    background: #fff;
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: var(--shadow-xs);
    cursor: pointer;
    transition: all var(--transition-base);

    &:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
    }

    .rec-image {
      width: 100%;
      height: 120px;
      background: var(--c-bg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--c-text-tertiary);

      .el-image {
        width: 100%;
        height: 100%;
      }
    }

    .rec-info {
      padding: 12px;

      .rec-title {
        font-size: 13px;
        font-weight: 500;
        color: var(--c-text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: 4px;
      }

      .rec-time {
        font-size: 12px;
        color: var(--c-text-tertiary);
      }
    }
  }
}

.upload-tip {
  margin-top: 6px;
  font-size: 12px;
  color: var(--c-text-tertiary);
}
</style>
