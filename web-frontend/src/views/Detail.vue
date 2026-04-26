<template>
  <div class="detail-page">
    <el-card v-loading="loading" class="detail-card">
      <template #header>
        <div class="header-actions">
          <el-button @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
          <el-tag :type="detail.post_type === 1 ? 'warning' : 'success'">
            {{ detail.post_type === 1 ? '失物' : '招领' }}
          </el-tag>
          <el-tag v-if="detail.status === 2" type="success">已发布</el-tag>
          <el-tag v-else-if="detail.status === 4" type="info">已找回</el-tag>
        </div>
      </template>

      <div class="detail-content">
        <div class="image-gallery">
          <el-image
            v-for="(img, idx) in detail.images"
            :key="idx"
            :src="img.imgUrl"
            fit="cover"
            :preview-src-list="detail.images.map(i => i.imgUrl)"
          />
          <div v-if="!detail.images?.length" class="no-image">
            <el-icon><Picture /></el-icon>
            <span>暂无图片</span>
          </div>
        </div>

        <div class="info-section">
          <h1 class="title">{{ detail.title }}</h1>
          
          <div class="meta-info">
            <div class="meta-item">
              <el-icon><Clock /></el-icon>
              <span>发布时间：{{ formatDate(detail.created_at) }}</span>
            </div>
            <div class="meta-item">
              <el-icon><Location /></el-icon>
              <span>地点：{{ detail.occur_location || '未知' }}</span>
            </div>
            <div class="meta-item">
              <el-icon><User /></el-icon>
              <span>发布人：{{ detail.publisher?.nickname || '匿名用户' }}</span>
            </div>
          </div>

          <el-divider />

          <div class="detail-section">
            <h3>物品描述</h3>
            <p>{{ detail.detail || '暂无描述' }}</p>
          </div>

          <div v-if="detail.post_type === 1 && detail.reward_amount > 0" class="reward-section">
            <el-icon><Money /></el-icon>
            <span>悬赏金额：{{ detail.reward_amount }}元</span>
          </div>

          <div v-if="detail.post_type === 2" class="contact-section">
            <h3>联系方式</h3>
            <p>{{ detail.contact_info || '请联系管理员获取联系方式' }}</p>
          </div>

          <div v-if="detail.post_type === 2 && detail.deposit_location" class="deposit-section">
            <h3>存放地点</h3>
            <p>{{ detail.deposit_location }}</p>
          </div>
        </div>

        <div class="action-section">
          <el-button v-if="canClaim" type="primary" size="large" @click="showClaimDialog = true">
            <el-icon><CircleCheck /></el-icon> 我要认领
          </el-button>
          <el-button v-if="canEdit" @click="$router.push(`/publish/${detail.id}`)">
            编辑
          </el-button>
          <el-button v-if="canDelete" type="danger" @click="handleDelete">
            删除
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 相关推荐 -->
    <el-card v-if="recommendations.length > 0" class="recommend-card">
      <template #header>
        <span>相关推荐</span>
      </template>
      <el-row :gutter="16">
        <el-col v-for="item in recommendations" :key="item.id" :span="6">
          <div class="recommend-item" @click="$router.push(`/detail/${item.id}`)">
            <el-image v-if="item.images?.[0]?.imgUrl" :src="item.images[0].imgUrl" fit="cover" />
            <div class="recommend-info">
              <div class="recommend-title">{{ item.title }}</div>
              <div class="recommend-time">{{ formatDate(item.created_at) }}</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 认领对话框 -->
    <el-dialog v-model="showClaimDialog" title="认领申请" width="500px">
      <el-form :model="claimForm" label-width="100px">
        <el-form-item label="验证信息" required>
          <el-input
            v-model="claimForm.verifyDesc"
            type="textarea"
            :rows="3"
            placeholder="请描述物品特征以验证身份，如：物品编号、磨损细节等"
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
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showClaimDialog = false">取消</el-button>
        <el-button type="primary" @click="submitClaim">提交申请</el-button>
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

const claimForm = reactive({
  verifyDesc: '',
  evidenceImages: []
})

const canClaim = computed(() => {
  return userStore.isLoggedIn && 
         detail.value.post_type === 2 && 
         detail.value.status === 2 &&
         detail.value.publisher_id !== userStore.user.id
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
  }
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确认删除该信息？', '提示')
    await deletePost(route.params.id)
    ElMessage.success('删除成功')
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
  max-width: 1000px;
  margin: 0 auto;
}

.detail-card {
  margin-bottom: 24px;

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .detail-content {
    .image-gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
      margin-bottom: 24px;

      .el-image {
        width: 100%;
        height: 150px;
        border-radius: 8px;
        cursor: pointer;
      }

      .no-image {
        grid-column: 1 / -1;
        height: 200px;
        background: #f5f5f5;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #ccc;
        font-size: 48px;

        span {
          font-size: 14px;
          margin-top: 8px;
        }
      }
    }

    .info-section {
      .title {
        font-size: 24px;
        margin-bottom: 16px;
      }

      .meta-info {
        display: flex;
        gap: 24px;
        margin-bottom: 16px;
        color: #666;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
      }

      .detail-section,
      .contact-section,
      .deposit-section {
        margin: 20px 0;

        h3 {
          font-size: 16px;
          margin-bottom: 8px;
          color: #333;
        }

        p {
          color: #666;
          line-height: 1.6;
        }
      }

      .reward-section {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 16px;
        background: #fff7e6;
        border-radius: 8px;
        color: #fa8c16;
        font-size: 18px;
        font-weight: 600;
        margin: 20px 0;
      }
    }

    .action-section {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #eee;
      display: flex;
      gap: 12px;
    }
  }
}

.recommend-card {
  .recommend-item {
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
    }

    .el-image {
      width: 100%;
      height: 120px;
      border-radius: 8px;
      margin-bottom: 8px;
    }

    .recommend-info {
      .recommend-title {
        font-size: 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: 4px;
      }

      .recommend-time {
        font-size: 12px;
        color: #999;
      }
    }
  }
}
</style>
