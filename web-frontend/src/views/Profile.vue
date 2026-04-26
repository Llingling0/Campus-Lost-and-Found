<template>
  <div class="profile-page">
    <el-card class="profile-card">
      <template #header>
        <span>个人中心</span>
      </template>

      <el-form :model="form" label-width="100px" style="max-width: 600px">
        <el-form-item label="头像">
          <el-avatar :size="80" :src="form.avatarUrl">{{ form.nickname?.charAt(0) }}</el-avatar>
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" />
        </el-form-item>

        <el-form-item label="学号/工号">
          <el-input v-model="identityNo" disabled />
        </el-form-item>

        <el-form-item label="真实姓名">
          <el-input v-model="form.realName" disabled />
        </el-form-item>

        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="form.mobile" />
        </el-form-item>

        <el-form-item label="学院" prop="college">
          <el-input v-model="form.college" placeholder="请输入学院名称" />
        </el-form-item>

        <el-form-item label="班级" prop="className">
          <el-input v-model="form.className" placeholder="请输入班级" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">保存修改</el-button>
        </el-form-item>
      </el-form>

      <el-divider />

      <div class="stats-section">
        <h3>我的统计</h3>
        <el-row :gutter="16">
          <el-col :span="8">
            <div class="stat-box">
              <div class="stat-value">{{ stats.postCount }}</div>
              <div class="stat-label">发布数量</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-box">
              <div class="stat-value">{{ stats.claimCount }}</div>
              <div class="stat-label">认领次数</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-box">
              <div class="stat-value">{{ stats.foundCount }}</div>
              <div class="stat-label">找回数量</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getMyPosts } from '@/api/post'
import { getMyClaims } from '@/api/post'

const userStore = useUserStore()
const saving = ref(false)
const stats = ref({ postCount: 0, claimCount: 0, foundCount: 0 })

const form = reactive({
  nickname: userStore.user.nickname || '',
  mobile: userStore.user.mobile || '',
  college: userStore.user.college || '',
  className: userStore.user.class_name || '',
  avatarUrl: userStore.user.avatar_url || '',
  realName: userStore.user.real_name || ''
})

const identityNo = computed(() => {
  return userStore.user.student_no || userStore.user.staff_no || '-'
})

const handleSave = async () => {
  saving.value = true
  try {
    // TODO: 调用更新接口
    ElMessage.success('保存成功')
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

const fetchStats = async () => {
  try {
    const postsRes = await getMyPosts()
    stats.value.postCount = postsRes.data?.length || 0
    stats.value.foundCount = postsRes.data?.filter(p => p.status === 4).length || 0
    
    const claimsRes = await getMyClaims()
    stats.value.claimCount = claimsRes.data?.length || 0
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style lang="scss" scoped>
.profile-page {
  max-width: 700px;
  margin: 0 auto;
}

.stats-section {
  h3 {
    margin-bottom: 20px;
    font-size: 16px;
  }

  .stat-box {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    padding: 24px;
    border-radius: 8px;
    text-align: center;

    .stat-value {
      font-size: 32px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.9;
    }
  }
}
</style>
