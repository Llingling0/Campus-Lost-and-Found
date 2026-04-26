<template>
  <div class="audit-page">
    <el-card>
      <template #header>
        <span>信息审核</span>
      </template>

      <el-tabs v-model="activeTab" @change="fetchData">
        <el-tab-pane label="待审核" name="pending" />
        <el-tab-pane label="认领审核" name="claims" />
      </el-tabs>

      <!-- 信息审核列表 -->
      <div v-if="activeTab === 'pending'" v-loading="loading" class="post-list">
        <div v-for="item in postList" :key="item.id" class="post-item">
          <div class="post-header">
            <el-tag :type="item.post_type === 1 ? 'warning' : 'success'">
              {{ item.post_type === 1 ? '失物' : '招领' }}
            </el-tag>
            <span class="post-title">{{ item.title }}</span>
            <span class="post-time">{{ formatDate(item.created_at) }}</span>
          </div>
          <div class="post-body">
            <div class="post-detail">
              <strong>地点：</strong>{{ item.occur_location || '未知' }}
              <strong style="margin-left: 16px;">描述：</strong>{{ item.detail || '无' }}
            </div>
          </div>
          <div class="post-actions">
            <el-button type="success" @click="handleApprove(item.id)">通过</el-button>
            <el-button type="warning" @click="showRejectDialog(item.id, 'post')">驳回</el-button>
            <el-button type="danger" @click="showDeleteDialog(item.id)">删除</el-button>
          </div>
        </div>
        <el-empty v-if="!loading && postList.length === 0" description="暂无待审核信息" />
      </div>

      <!-- 认领审核列表 -->
      <div v-else v-loading="loading" class="claim-list">
        <div v-for="item in claimList" :key="item.id" class="claim-item">
          <div class="claim-header">
            <span class="claim-title">认领申请 - {{ item.apply_no }}</span>
            <span class="claim-time">{{ formatDate(item.created_at) }}</span>
          </div>
          <div class="claim-body">
            <div><strong>验证信息：</strong>{{ item.verify_desc || '无' }}</div>
            <div v-if="item.evidence_images"><strong>证据图片：</strong>{{ item.evidence_images }}</div>
          </div>
          <div class="claim-actions">
            <el-button type="success" @click="handleApproveClaim(item.id)">通过</el-button>
            <el-button type="warning" @click="showRejectDialog(item.id, 'claim')">拒绝</el-button>
          </div>
        </div>
        <el-empty v-if="!loading && claimList.length === 0" description="暂无待处理认领" />
      </div>
    </el-card>

    <!-- 驳回对话框 -->
    <el-dialog v-model="showReject" :title="rejectType === 'post' ? '驳回原因' : '拒绝原因'" width="400px">
      <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请输入原因" />
      <template #footer>
        <el-button @click="showReject = false">取消</el-button>
        <el-button type="primary" @click="confirmReject">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPendingPosts, approvePost, rejectPost, deletePost, getPendingClaims, approveClaim, rejectClaim } from '@/api/admin'
import dayjs from 'dayjs'

const activeTab = ref('pending')
const loading = ref(false)
const postList = ref([])
const claimList = ref([])
const showReject = ref(false)
const rejectType = ref('post')
const rejectId = ref(null)
const rejectReason = ref('')

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const fetchData = async () => {
  loading.value = true
  try {
    if (activeTab.value === 'pending') {
      const res = await getPendingPosts()
      postList.value = res.data || []
    } else {
      const res = await getPendingClaims()
      claimList.value = res.data || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleApprove = async (id) => {
  try {
    await approvePost(id)
    ElMessage.success('已通过')
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

const handleApproveClaim = async (id) => {
  try {
    await approveClaim(id)
    ElMessage.success('已通过')
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
  if (!rejectReason.value) {
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

const showDeleteDialog = async (id) => {
  try {
    await deletePost(id, '违规信息')
    ElMessage.success('已删除')
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
  .post-list,
  .claim-list {
    .post-item,
    .claim-item {
      padding: 16px;
      border: 1px solid #eee;
      border-radius: 8px;
      margin-bottom: 16px;

      .post-header,
      .claim-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;

        .post-title,
        .claim-title {
          font-weight: 500;
        }

        .post-time,
        .claim-time {
          margin-left: auto;
          font-size: 13px;
          color: #999;
        }
      }

      .post-body {
        margin-bottom: 12px;
        font-size: 14px;
        color: #666;
      }

      .post-actions,
      .claim-actions {
        text-align: right;
      }
    }
  }
}
</style>
