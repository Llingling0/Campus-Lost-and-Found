<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Left: Brand Panel -->
      <div class="brand-panel">
        <div class="brand-overlay"></div>
        <div class="brand-content">
          <div class="brand-icon">
            <el-icon :size="48"><Search /></el-icon>
          </div>
          <h1>校园失物招领</h1>
          <p class="brand-desc">智慧校园服务平台</p>
          <div class="brand-features">
            <div class="feature-item">
              <el-icon :size="20"><CircleCheck /></el-icon>
              <span>快速发布失物 / 招领信息</span>
            </div>
            <div class="feature-item">
              <el-icon :size="20"><CircleCheck /></el-icon>
              <span>智能匹配 + 双向通知</span>
            </div>
            <div class="feature-item">
              <el-icon :size="20"><CircleCheck /></el-icon>
              <span>安全可靠的身份认证</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Form Panel -->
      <div class="form-panel">
        <div class="form-wrapper">
          <div class="form-header">
            <h2>{{ showAdminLogin ? '管理员登录' : '欢迎回来' }}</h2>
            <p>{{ showAdminLogin ? '使用管理员账号登录后台' : '登录您的账号以使用完整功能' }}</p>
          </div>

          <!-- Toggle Switch -->
          <div class="login-toggle">
            <div
              :class="['toggle-option', { active: !showAdminLogin }]"
              @click="showAdminLogin = false"
            >
              <el-icon><User /></el-icon>
              <span>用户登录</span>
            </div>
            <div
              :class="['toggle-option', { active: showAdminLogin }]"
              @click="showAdminLogin = true"
            >
              <el-icon><Lock /></el-icon>
              <span>管理员</span>
            </div>
          </div>

          <!-- Admin Login Form -->
          <el-form
            v-if="showAdminLogin"
            ref="adminFormRef"
            :model="adminForm"
            :rules="adminRules"
            class="login-form"
          >
            <el-form-item prop="username">
              <el-input
                v-model="adminForm.username"
                placeholder="管理员账号"
                size="large"
                :prefix-icon="User"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="adminForm.password"
                type="password"
                show-password
                placeholder="管理员密码"
                size="large"
                :prefix-icon="Lock"
                @keyup.enter="handleAdminLogin"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="adminLoading"
                @click="handleAdminLogin"
                class="submit-btn"
              >
                登录管理后台
              </el-button>
            </el-form-item>
          </el-form>

          <!-- User Login Form -->
          <el-form
            v-else
            ref="formRef"
            :model="form"
            :rules="rules"
            class="login-form"
          >
            <el-form-item>
              <el-radio-group v-model="loginType" class="login-type-group">
                <el-radio-button :label="1">
                  <el-icon><Document /></el-icon> 学号/工号
                </el-radio-button>
                <el-radio-button :label="2">
                  <el-icon><Iphone /></el-icon> 手机验证码
                </el-radio-button>
              </el-radio-group>
            </el-form-item>

            <template v-if="loginType === 1">
              <el-form-item prop="identityNo">
                <el-input
                  v-model="form.identityNo"
                  placeholder="请输入学号或工号"
                  size="large"
                  :prefix-icon="User"
                />
              </el-form-item>
              <el-form-item prop="password">
                <el-input
                  v-model="form.password"
                  type="password"
                  show-password
                  placeholder="请输入密码"
                  size="large"
                  :prefix-icon="Lock"
                />
              </el-form-item>
              <el-form-item prop="realName">
                <el-input
                  v-model="form.realName"
                  placeholder="请输入真实姓名（用于身份认证）"
                  size="large"
                  :prefix-icon="Checked"
                />
              </el-form-item>
            </template>

            <template v-if="loginType === 2">
              <el-form-item prop="mobile">
                <el-input
                  v-model="form.mobile"
                  placeholder="请输入手机号"
                  size="large"
                  maxlength="11"
                  :prefix-icon="Iphone"
                />
              </el-form-item>
              <el-form-item prop="code">
                <el-row :gutter="12" style="width: 100%">
                  <el-col :span="15">
                    <el-input
                      v-model="form.code"
                      placeholder="验证码"
                      size="large"
                      maxlength="6"
                      :prefix-icon="Message"
                    />
                  </el-col>
                  <el-col :span="9">
                    <el-button
                      :disabled="countdown > 0"
                      @click="sendCode"
                      size="large"
                      style="width: 100%"
                    >
                      {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                    </el-button>
                  </el-col>
                </el-row>
              </el-form-item>
            </template>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                @click="handleLogin"
                class="submit-btn"
              >
                登录
              </el-button>
            </el-form-item>

            <p class="login-hint">首次登录将自动创建账号</p>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Checked, Message, Iphone, Document } from '@element-plus/icons-vue'
import { login as apiLogin, wxLogin, adminLogin } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)
const loginType = ref(1)
const countdown = ref(0)

const showAdminLogin = ref(false)
const adminFormRef = ref(null)
const adminLoading = ref(false)
const adminForm = reactive({
  username: 'admin',
  password: 'admin123'
})

const adminRules = {
  username: [{ required: true, message: '请输入管理员账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入管理员密码', trigger: 'blur' }]
}

const form = reactive({
  identityNo: '',
  password: '',
  realName: '',
  mobile: '',
  code: ''
})

const rules = {
  identityNo: [{ required: true, message: '请输入学号或工号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  mobile: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

const sendCode = async () => {
  if (!form.mobile) {
    ElMessage.warning('请先输入手机号')
    return
  }
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
  ElMessage.success('验证码已发送（模拟）')
}

const handleAdminLogin = async () => {
  try {
    await adminFormRef.value.validate()
    adminLoading.value = true
    const res = await adminLogin(adminForm)
    userStore.setToken(res.data.token, res.data.user)
    ElMessage.success('管理员登录成功')
    router.push('/admin')
  } catch (e) {
    console.error(e)
  } finally {
    adminLoading.value = false
  }
}

const handleLogin = async () => {
  try {
    await formRef.value.validate()
    loading.value = true
    let res
    if (loginType.value === 1) {
      res = await apiLogin({
        identityType: form.identityNo.startsWith('S') || !isNaN(form.identityNo) ? 1 : 2,
        identityNo: form.identityNo,
        password: form.password,
        realName: form.realName
      })
    } else {
      res = await wxLogin(form.mobile)
    }
    userStore.setToken(res.data.token, res.data.user)
    ElMessage.success('登录成功')
    if (res.data.user?.role === 2) {
      router.push('/admin')
    } else {
      router.push(route.query.redirect || '/')
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  padding: 24px;
}

.login-container {
  display: flex;
  width: 960px;
  min-height: 580px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  animation: scaleIn 0.4s ease;
}

// --- Brand Panel ---
.brand-panel {
  flex: 0 0 420px;
  position: relative;
  background: var(--c-primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  overflow: hidden;

  .brand-overlay {
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }

  .brand-content {
    position: relative;
    z-index: 1;
    text-align: center;
    color: #fff;
  }

  .brand-icon {
    width: 80px;
    height: 80px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
  }

  h1 {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
    letter-spacing: 1px;
  }

  .brand-desc {
    font-size: 15px;
    opacity: 0.85;
    margin-bottom: 40px;
  }

  .brand-features {
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 16px;

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      opacity: 0.9;
    }
  }
}

// --- Form Panel ---
.form-panel {
  flex: 1;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
}

.form-wrapper {
  width: 100%;
  max-width: 360px;

  .form-header {
    text-align: center;
    margin-bottom: 28px;

    h2 {
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
}

.login-toggle {
  display: flex;
  background: var(--c-bg);
  border-radius: var(--radius-sm);
  padding: 3px;
  margin-bottom: 28px;

  .toggle-option {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    color: var(--c-text-tertiary);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-weight: 500;

    &.active {
      background: #fff;
      color: var(--c-primary);
      box-shadow: var(--shadow-sm);
    }

    &:hover:not(.active) {
      color: var(--c-text-secondary);
    }
  }
}

.login-form {
  .login-type-group {
    width: 100%;
    display: flex;

    :deep(.el-radio-button) {
      flex: 1;
    }

    :deep(.el-radio-button__inner) {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      border-radius: var(--radius-sm) !important;
    }
  }

  .submit-btn {
    width: 100%;
    height: 46px;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .login-hint {
    text-align: center;
    font-size: 13px;
    color: var(--c-text-tertiary);
    margin-top: 16px;
  }
}

// --- Responsive ---
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
    width: 100%;
    max-width: 420px;
  }

  .brand-panel {
    flex: 0 0 auto;
    padding: 32px 24px;

    h1 { font-size: 22px; }
    .brand-features { display: none; }
    .brand-icon { width: 56px; height: 56px; border-radius: 14px; }
    .brand-icon .el-icon { font-size: 32px !important; }
  }

  .form-panel {
    padding: 32px 24px;
  }
}
</style>
