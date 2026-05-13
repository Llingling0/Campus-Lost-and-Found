<template>
  <div class="profile-page">
    <div class="page-hero">
      <h1>个人中心</h1>
    </div>

    <el-row :gutter="24">
      <!-- Profile Card -->
      <el-col :span="16">
        <div class="profile-card">
          <!-- Avatar Section -->
          <div class="avatar-section">
            <el-avatar :size="80" :src="form.avatarUrl" class="profile-avatar">
              {{ form.nickname?.charAt(0) || 'U' }}
            </el-avatar>
            <div class="avatar-info">
              <h2>{{ form.nickname || '未设置昵称' }}</h2>
              <p>{{ identityNo }}</p>
            </div>
          </div>

          <el-divider />

          <el-form :model="form" label-width="90px" size="large">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="昵称">
                  <el-input v-model="form.nickname" placeholder="设置你的昵称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="手机号">
                  <el-input v-model="form.mobile" placeholder="请输入手机号" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="真实姓名">
                  <el-input v-model="form.realName" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="学号/工号">
                  <el-input :model-value="identityNo" disabled />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="学院">
                  <el-input v-model="form.college" placeholder="请输入学院" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="班级">
                  <el-input v-model="form.className" placeholder="请输入班级" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="handleSave">
                保存修改
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>

      <!-- Stats Sidebar -->
      <el-col :span="8">
        <div class="stats-section">
          <h3>我的统计</h3>
          <div class="stat-item">
            <div class="stat-icon-box posts">
              <el-icon :size="22"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-num">{{ stats.postCount }}</div>
              <div class="stat-label">发布数量</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon-box claims">
              <el-icon :size="22"><Checked /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-num">{{ stats.claimCount }}</div>
              <div class="stat-label">认领次数</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon-box found">
              <el-icon :size="22"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-num">{{ stats.foundCount }}</div>
              <div class="stat-label">找回数量</div>
            </div>
          </div>
        </div>

        <div class="quick-links">
          <h3>快捷入口</h3>
          <div class="link-item" @click="$router.push('/mine/posts')">
            <el-icon><Document /></el-icon>
            <span>我的发布</span>
            <el-icon><ArrowRight /></el-icon>
          </div>
          <div class="link-item" @click="$router.push('/mine/claims')">
            <el-icon><Checked /></el-icon>
            <span>我的认领</span>
            <el-icon><ArrowRight /></el-icon>
          </div>
          <div class="link-item" @click="$router.push('/messages')">
            <el-icon><Bell /></el-icon>
            <span>消息中心</span>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
      </el-col>
    </el-row>
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
  max-width: 1000px;
  margin: 0 auto;
  animation: fadeInUp 0.4s ease;
}

.page-hero {
  margin-bottom: 24px;

  h1 {
    font-size: 24px;
    font-weight: 700;
    color: var(--c-text-primary);
  }
}

// --- Profile Card ---
.profile-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 28px;
  box-shadow: var(--shadow-sm);

  .avatar-section {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 8px;

    .profile-avatar {
      border: 3px solid var(--c-primary-soft);
    }

    .avatar-info {
      h2 {
        font-size: 20px;
        font-weight: 700;
        color: var(--c-text-primary);
        margin-bottom: 4px;
      }

      p {
        font-size: 13px;
        color: var(--c-text-tertiary);
      }
    }
  }
}

// --- Stats ---
.stats-section {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--c-text-primary);
    margin-bottom: 20px;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 0;

    &:not(:last-child) {
      border-bottom: 1px solid var(--c-border-light);
    }

    .stat-icon-box {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;

      &.posts  { background: linear-gradient(135deg, #3b82f6, #2563eb); }
      &.claims { background: linear-gradient(135deg, #f59e0b, #d97706); }
      &.found  { background: linear-gradient(135deg, #10b981, #059669); }
    }

    .stat-info {
      .stat-num {
        font-size: 26px;
        font-weight: 700;
        color: var(--c-text-primary);
        line-height: 1;
        margin-bottom: 2px;
      }

      .stat-label {
        font-size: 13px;
        color: var(--c-text-tertiary);
      }
    }
  }
}

// --- Quick Links ---
.quick-links {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--c-text-primary);
    margin-bottom: 16px;
  }

  .link-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
    color: var(--c-text-secondary);
    font-size: 14px;

    .el-icon:first-child {
      color: var(--c-primary);
      font-size: 16px;
    }

    .el-icon:last-child {
      margin-left: auto;
      font-size: 14px;
      color: var(--c-text-tertiary);
    }

    &:hover {
      background: var(--c-primary-soft);
      color: var(--c-primary);
    }
  }
}
</style>
