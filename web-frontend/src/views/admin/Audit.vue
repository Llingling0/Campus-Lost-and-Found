<template>
  <div class="audit-page">
    <div class="page-toolbar">
      <h2 class="page-title">信息审核</h2>
      <div class="tab-switch">
        <span
          :class="['tab-item', { active: activeTab === 'pending' }]"
          @click="activeTab = 'pending'; fetchData()"
        >
          <el-icon><Document /></el-icon> 待审核信息
          <span v-if="postTotal" class="tab-badge">{{ postTotal }}</span>
        </span>
        <span
          :class="['tab-item', { active: activeTab === 'claims' }]"
          @click="activeTab = 'claims'; fetchData()"
        >
          <el-icon><Checked /></el-icon> 认领审核
          <span v-if="claimTotal" class="tab-badge">{{ claimTotal }}</span>
        </span>
        <span
          :class="['tab-item', { active: activeTab === 'published' }]"
          @click="activeTab = 'published'; fetchData()"
        >
          <el-icon><Collection /></el-icon> 已发布管理
        </span>
      </div>
    </div>

    <!-- Post Audit -->
    <div v-if="activeTab === 'pending'" v-loading="loading" class="audit-list">
      <div v-if="postList.length === 0" class="empty-full">
        <el-icon :size="48"><CircleCheck /></el-icon>
        <p>暂无待审核信息</p>
      </div>
      <div v-for="item in postList" :key="item.id" class="audit-card" @click="showPostDetail(item)">
        <div class="audit-card-left">
          <div class="card-image">
            <el-image v-if="item.images?.[0]?.imgUrl" :src="item.images[0].imgUrl" fit="cover" />
            <el-icon v-else :size="32"><Picture /></el-icon>
          </div>
        </div>
        <div class="audit-card-body">
          <div class="card-header-row">
            <el-tag :type="item.post_type === 1 ? 'warning' : 'success'" effect="dark" size="small">
              {{ item.post_type === 1 ? '失物' : '招领' }}
            </el-tag>
            <span class="card-title">{{ item.title }}</span>
            <span class="card-time">{{ formatDate(item.created_at) }}</span>
          </div>
          <div class="card-detail">
            <div class="detail-item">
              <el-icon><Location /></el-icon>
              <span>{{ item.occur_location || '未知地点' }}</span>
            </div>
            <div class="detail-item" v-if="item.detail">
              <el-icon><InfoFilled /></el-icon>
              <span>{{ item.detail }}</span>
            </div>
            <div class="detail-item" v-if="item.publisher?.nickname">
              <el-icon><User /></el-icon>
              <span>发布人：{{ item.publisher.nickname }}</span>
            </div>
          </div>
        </div>
        <div class="audit-card-actions" @click.stop>
          <el-button type="success" @click="handleApprove(item.id)">
            <el-icon><Select /></el-icon> 通过
          </el-button>
          <el-button type="warning" @click="showRejectDialog(item.id, 'post')">
            <el-icon><CloseBold /></el-icon> 驳回
          </el-button>
          <el-button type="danger" plain @click="showSoftDeleteDialog(item.id)">
            <el-icon><Remove /></el-icon> 下架
          </el-button>
          <el-button type="danger" @click="showHardDeleteDialog(item.id)">
            <el-icon><Delete /></el-icon> 删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- Published Posts Management -->
    <div v-else-if="activeTab === 'published'" v-loading="loading" class="audit-list">
      <div class="published-filters">
        <el-radio-group v-model="publishedFilter" size="small" @change="fetchData">
          <el-radio-button value="0">全部</el-radio-button>
          <el-radio-button value="1">失物</el-radio-button>
          <el-radio-button value="2">招领</el-radio-button>
        </el-radio-group>
      </div>
      <div v-if="publishedList.length === 0" class="empty-full">
        <el-icon :size="48"><CircleCheck /></el-icon>
        <p>暂无已发布信息</p>
      </div>
      <div v-for="item in publishedList" :key="item.id" class="audit-card">
        <div class="audit-card-left">
          <div class="card-image">
            <el-image v-if="item.images?.[0]?.imgUrl" :src="item.images[0].imgUrl" fit="cover" />
            <el-icon v-else :size="32"><Picture /></el-icon>
          </div>
        </div>
        <div class="audit-card-body">
          <div class="card-header-row">
            <el-tag :type="item.post_type === 1 ? 'warning' : 'success'" effect="dark" size="small">
              {{ item.post_type === 1 ? '失物' : '招领' }}
            </el-tag>
            <el-tag :type="getPublishedStatusType(item.status)" effect="plain" size="small">
              {{ getPublishedStatusText(item.status) }}
            </el-tag>
            <span class="card-title">{{ item.title }}</span>
            <span class="card-time">{{ formatDate(item.created_at) }}</span>
          </div>
          <div class="card-detail">
            <div class="detail-item">
              <el-icon><Location /></el-icon>
              <span>{{ item.occur_location || '未知地点' }}</span>
            </div>
            <div class="detail-item" v-if="item.publisher?.nickname">
              <el-icon><User /></el-icon>
              <span>{{ item.publisher.nickname }}</span>
            </div>
          </div>
        </div>
        <div class="audit-card-actions" @click.stop>
          <el-button type="danger" @click="showHardDeleteDialog(item.id)">
            <el-icon><Delete /></el-icon> 删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- Claim Audit -->
    <div v-else v-loading="loading" class="audit-list">
      <div v-if="claimList.length === 0" class="empty-full">
        <el-icon :size="48"><CircleCheck /></el-icon>
        <p>暂无待处理认领</p>
      </div>
      <div v-for="item in claimList" :key="item.id" class="audit-card" @click="showClaimDetail(item)">
        <div class="audit-card-body">
          <div class="card-header-row">
            <el-tag type="info" effect="dark" size="small">{{ item.apply_no }}</el-tag>
            <span class="card-title">{{ item.post_title || '未知物品' }}</span>
            <el-tag
              :type="item.post_type === 1 ? 'warning' : 'success'"
              effect="dark"
              size="small"
            >
              {{ item.post_type === 1 ? '失物' : '招领' }}
            </el-tag>
            <span class="card-time">{{ formatDate(item.created_at) }}</span>
          </div>
          <div class="card-detail">
            <div class="detail-item">
              <el-icon><User /></el-icon>
              <span>申请人：{{ item.applicant_nickname || item.applicant_name || '未知' }}</span>
            </div>
            <div class="detail-item">
              <el-icon><Document /></el-icon>
              <span>验证信息：{{ item.verify_desc || '无' }}</span>
            </div>
            <div class="detail-item" v-if="item.evidence_images?.length">
              <el-icon><Picture /></el-icon>
              <span>证据图片：{{ item.evidence_images.length }} 张</span>
            </div>
          </div>
        </div>
        <div class="audit-card-actions" @click.stop>
          <el-button type="success" @click="handleApproveClaim(item.id)">
            <el-icon><Select /></el-icon> 通过
          </el-button>
          <el-button type="warning" @click="showRejectDialog(item.id, 'claim')">
            <el-icon><CloseBold /></el-icon> 拒绝
          </el-button>
        </div>
      </div>
    </div>

    <!-- ==================== Post Detail Dialog ==================== -->
    <el-dialog
      v-model="showPostDialog"
      title="审核详情"
      width="720px"
      :close-on-click-modal="false"
      class="audit-detail-dialog"
    >
      <template v-if="viewingPost">
        <!-- Type & Status -->
        <div class="detail-tags">
          <el-tag :type="viewingPost.post_type === 1 ? 'warning' : 'success'" effect="dark" size="large">
            {{ viewingPost.post_type === 1 ? '失物' : '招领' }}
          </el-tag>
          <el-tag type="warning" effect="plain" size="large">待审核</el-tag>
        </div>

        <h2 class="detail-title">{{ viewingPost.title }}</h2>

        <!-- Post Images -->
        <div v-if="viewingPost.images?.length" class="detail-images">
          <el-image
            v-for="(img, idx) in viewingPost.images"
            :key="idx"
            :src="img.imgUrl"
            fit="cover"
            :preview-src-list="viewingPost.images.map(i => i.imgUrl)"
            :initial-index="idx"
            class="detail-image"
          />
        </div>
        <div v-else class="detail-no-image">
          <el-icon :size="40"><Picture /></el-icon>
          <span>暂无图片</span>
        </div>

        <!-- Info Grid -->
        <div class="detail-info-grid">
          <div class="info-item">
            <span class="info-label">发布人</span>
            <span class="info-value">{{ viewingPost.publisher?.nickname || '未知' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">姓名</span>
            <span class="info-value">{{ viewingPost.publisher?.real_name || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">地点</span>
            <span class="info-value">{{ viewingPost.occur_location || '未知' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">发布时间</span>
            <span class="info-value">{{ formatDate(viewingPost.created_at) }}</span>
          </div>
          <div class="info-item" v-if="viewingPost.reward_amount > 0">
            <span class="info-label">悬赏金额</span>
            <span class="info-value reward">¥ {{ viewingPost.reward_amount }}</span>
          </div>
          <div class="info-item" v-if="viewingPost.deposit_location">
            <span class="info-label">存放地点</span>
            <span class="info-value">{{ viewingPost.deposit_location }}</span>
          </div>
          <div class="info-item" v-if="viewingPost.contact_info">
            <span class="info-label">联系方式</span>
            <span class="info-value">{{ viewingPost.contact_info }}</span>
          </div>
        </div>

        <!-- Description -->
        <div class="detail-description">
          <h4>物品描述</h4>
          <p>{{ viewingPost.detail || '暂无描述' }}</p>
        </div>
      </template>

      <template #footer>
        <el-button @click="showPostDialog = false">关闭</el-button>
        <el-button type="warning" @click="showPostDialog = false; showRejectDialog(viewingPost.id, 'post')">
          <el-icon><CloseBold /></el-icon> 驳回
        </el-button>
        <el-button type="success" @click="handleApprove(viewingPost.id); showPostDialog = false">
          <el-icon><Select /></el-icon> 审核通过
        </el-button>
      </template>
    </el-dialog>

    <!-- ==================== Claim Detail Dialog ==================== -->
    <el-dialog
      v-model="showClaimDialog"
      title="认领审核详情"
      width="720px"
      :close-on-click-modal="false"
      class="audit-detail-dialog"
    >
      <template v-if="viewingClaim">
        <div class="detail-tags">
          <el-tag type="info" effect="dark" size="large">{{ viewingClaim.apply_no }}</el-tag>
          <el-tag
            :type="viewingClaim.post_type === 1 ? 'warning' : 'success'"
            effect="dark"
            size="large"
          >
            {{ viewingClaim.post_type === 1 ? '失物' : '招领' }}
          </el-tag>
          <el-tag type="warning" effect="plain" size="large">待处理</el-tag>
        </div>

        <h2 class="detail-title">{{ viewingClaim.post_title }}</h2>

        <!-- Post Images (from original post) -->
        <div v-if="viewingClaim.post_images?.length" class="detail-images">
          <el-image
            v-for="(img, idx) in viewingClaim.post_images"
            :key="idx"
            :src="img.imgUrl"
            fit="cover"
            :preview-src-list="viewingClaim.post_images.map(i => i.imgUrl)"
            :initial-index="idx"
            class="detail-image"
          />
        </div>

        <!-- Evidence Images -->
        <div v-if="viewingClaim.evidence_images?.length" class="detail-section">
          <h4>证据图片</h4>
          <div class="detail-images">
            <el-image
              v-for="(url, idx) in viewingClaim.evidence_images"
              :key="'evi' + idx"
              :src="url"
              fit="cover"
              :preview-src-list="viewingClaim.evidence_images"
              :initial-index="idx"
              class="detail-image evidence"
            />
          </div>
        </div>

        <!-- Claim Info -->
        <div class="detail-info-grid">
          <div class="info-item">
            <span class="info-label">申请人</span>
            <span class="info-value">{{ viewingClaim.applicant_nickname || viewingClaim.applicant_name || '未知' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">物品地点</span>
            <span class="info-value">{{ viewingClaim.post_location || '未知' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">申请时间</span>
            <span class="info-value">{{ formatDate(viewingClaim.created_at) }}</span>
          </div>
        </div>

        <div class="detail-description">
          <h4>物品描述</h4>
          <p>{{ viewingClaim.post_detail || '暂无描述' }}</p>
        </div>

        <div class="detail-description verify">
          <h4>验证信息</h4>
          <p>{{ viewingClaim.verify_desc || '未填写验证信息' }}</p>
        </div>
      </template>

      <template #footer>
        <el-button @click="showClaimDialog = false">关闭</el-button>
        <el-button type="warning" @click="showClaimDialog = false; showRejectDialog(viewingClaim.id, 'claim')">
          <el-icon><CloseBold /></el-icon> 拒绝
        </el-button>
        <el-button type="success" @click="handleApproveClaim(viewingClaim.id); showClaimDialog = false">
          <el-icon><Select /></el-icon> 认领通过
        </el-button>
      </template>
    </el-dialog>

    <!-- Reject Dialog -->
    <el-dialog
      v-model="showReject"
      :title="rejectType === 'post' ? '驳回信息' : '拒绝认领'"
      width="440px"
      :close-on-click-modal="false"
    >
      <el-form>
        <el-form-item label="处理原因">
          <el-input
            v-model="rejectReason"
            type="textarea"
            :rows="3"
            :placeholder="rejectType === 'post' ? '请填写驳回原因...' : '请填写拒绝原因...'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReject = false">取消</el-button>
        <el-button type="warning" @click="confirmReject">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPendingPosts, approvePost, rejectPost, deletePost, hardDeletePost, getPendingClaims, approveClaim, rejectClaim, getPublishedPosts } from '@/api/admin'
import dayjs from 'dayjs'

const activeTab = ref('pending')
const loading = ref(false)
const postList = ref([])
const claimList = ref([])
const publishedList = ref([])
const publishedFilter = ref(0)
const postTotal = ref(0)
const claimTotal = ref(0)
const showReject = ref(false)
const rejectType = ref('post')
const rejectId = ref(null)
const rejectReason = ref('')

// Detail dialogs
const showPostDialog = ref(false)
const showClaimDialog = ref(false)
const viewingPost = ref(null)
const viewingClaim = ref(null)

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const showPostDetail = (item) => {
  viewingPost.value = item
  showPostDialog.value = true
}

const showClaimDetail = (item) => {
  viewingClaim.value = item
  showClaimDialog.value = true
}

const fetchData = async () => {
  loading.value = true
  try {
    if (activeTab.value === 'pending') {
      const res = await getPendingPosts()
      postList.value = res.data || []
      postTotal.value = postList.value.length
    } else if (activeTab.value === 'claims') {
      const res = await getPendingClaims()
      claimList.value = res.data || []
      claimTotal.value = claimList.value.length
    } else if (activeTab.value === 'published') {
      const params = publishedFilter.value > 0 ? { postType: publishedFilter.value } : {}
      const res = await getPublishedPosts(params)
      publishedList.value = res.data || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const getPublishedStatusType = (status) => {
  const map = { 2: 'success', 4: 'info', 6: '' }
  return map[status] || 'info'
}

const getPublishedStatusText = (status) => {
  const map = { 2: '已发布', 4: '已找回', 6: '已归还' }
  return map[status] || '--'
}

const handleApprove = async (id) => {
  try {
    await ElMessageBox.confirm('确认通过该信息？通过后将自动发布。', '确认', { type: 'success' })
  } catch { return }
  try {
    await approvePost(id)
    ElMessage.success('审核通过')
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

const handleApproveClaim = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确认通过该认领申请？通过后该物品将标记为已找回，其他待处理的认领申请将自动拒绝。',
      '确认通过认领',
      { type: 'success' }
    )
  } catch { return }
  try {
    const res = await approveClaim(id)
    const autoCount = res.data?.autoRejected || 0
    if (autoCount > 0) {
      ElMessage.success(`认领已通过，已自动拒绝 ${autoCount} 条其他申请`)
    } else {
      ElMessage.success('认领已通过')
    }
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

const showRejectDialog = (id, type) => {
  rejectId.value = id
  rejectType.value = type
  rejectReason.value = ''
  showReject.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写原因')
    return
  }
  try {
    if (rejectType.value === 'post') {
      await rejectPost(rejectId.value, rejectReason.value)
    } else {
      await rejectClaim(rejectId.value, rejectReason.value)
    }
    ElMessage.success('已处理')
    showReject.value = false
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

const showSoftDeleteDialog = async (id) => {
  try {
    await ElMessageBox.confirm('确认下架该信息？信息将标记为已删除但保留数据。', '确认下架', {
      type: 'warning',
      confirmButtonText: '下架',
      cancelButtonText: '取消'
    })
  } catch { return }
  try {
    await deletePost(id, '管理员下架')
    ElMessage.success('已下架')
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

const showHardDeleteDialog = async (id) => {
  try {
    await ElMessageBox.confirm('确认永久删除该信息？将同时删除关联的图片和认领记录，此操作不可恢复。', '危险操作', {
      type: 'error',
      confirmButtonText: '永久删除',
      cancelButtonText: '取消'
    })
  } catch { return }
  try {
    await hardDeletePost(id)
    ElMessage.success('已永久删除')
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.audit-page {
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

.tab-switch {
  display: flex;
  background: #fff;
  padding: 3px;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-xs);
  gap: 2px;

  .tab-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    color: var(--c-text-tertiary);
    cursor: pointer;
    transition: all var(--transition-fast);

    &:hover { color: var(--c-text-secondary); }

    &.active {
      background: var(--c-primary-gradient);
      color: #fff;
      box-shadow: var(--shadow-sm);

      .tab-badge {
        background: rgba(255,255,255,0.25);
      }
    }

    .tab-badge {
      background: var(--c-bg);
      color: inherit;
      font-size: 11px;
      padding: 1px 7px;
      border-radius: 10px;
      font-weight: 700;
      min-width: 20px;
      text-align: center;
    }
  }
}

.published-filters {
  margin-bottom: 16px;
}

.audit-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-full {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 0;
  color: var(--c-text-tertiary);
  background: #fff;
  border-radius: var(--radius-lg);

  .el-icon { color: var(--c-success); }
}

.audit-card {
  display: flex;
  gap: 20px;
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all var(--transition-base);

  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  .audit-card-left {
    flex-shrink: 0;

    .card-image {
      width: 120px;
      height: 90px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      background: var(--c-bg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--c-text-tertiary);

      .el-image { width: 100%; height: 100%; }
    }
  }

  .audit-card-body {
    flex: 1;
    min-width: 0;

    .card-header-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;

      .card-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--c-text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
      }

      .card-time {
        font-size: 13px;
        color: var(--c-text-tertiary);
        white-space: nowrap;
      }
    }

    .card-detail {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .detail-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--c-text-secondary);

        .el-icon { color: var(--c-text-tertiary); font-size: 14px; }
        span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      }
    }
  }

  .audit-card-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
    justify-content: center;

    .el-button { min-width: 80px; }
  }
}

// ==================== Detail Dialog ====================
:deep(.audit-detail-dialog) {
  .el-dialog__body {
    max-height: 65vh;
    overflow-y: auto;
    padding: 24px;
  }
}

.detail-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.detail-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--c-text-primary);
  margin-bottom: 20px;
}

.detail-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 24px;

  .detail-image {
    width: 100%;
    height: 140px;
    border-radius: var(--radius-sm);
    overflow: hidden;
    cursor: pointer;
    transition: all var(--transition-fast);

    &:hover { transform: scale(1.03); }

    &.evidence {
      border: 2px solid var(--c-warning);
    }
  }
}

.detail-no-image {
  width: 100%;
  height: 160px;
  border-radius: var(--radius-md);
  background: var(--c-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--c-text-tertiary);
  margin-bottom: 24px;
  font-size: 13px;
}

.detail-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--c-bg-elevated);
  border-radius: var(--radius-md);

  .info-item {
    .info-label {
      display: block;
      font-size: 12px;
      color: var(--c-text-tertiary);
      margin-bottom: 4px;
    }

    .info-value {
      font-size: 14px;
      color: var(--c-text-primary);
      font-weight: 500;

      &.reward {
        color: #d97706;
        font-weight: 700;
      }
    }
  }
}

.detail-description {
  margin-bottom: 20px;

  h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--c-text-primary);
    margin-bottom: 8px;
    padding-left: 10px;
    border-left: 3px solid var(--c-primary);
  }

  p {
    font-size: 14px;
    color: var(--c-text-secondary);
    line-height: 1.7;
    white-space: pre-wrap;
  }

  &.verify {
    p {
      padding: 14px;
      background: var(--c-warning-soft);
      border-radius: var(--radius-sm);
      color: #92400e;
    }
  }
}

@media (max-width: 768px) {
  .audit-card {
    flex-direction: column;
    .audit-card-actions { flex-direction: row; }
  }
  .page-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  .detail-info-grid { grid-template-columns: 1fr; }
}
</style>
