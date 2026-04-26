<template>
  <div class="login-page">
    <el-card class="login-card">
      <div class="logo">
        <el-icon><Bell /></el-icon>
        <span>校园失物招领</span>
      </div>
      <h2>用户登录</h2>
      
      <!-- 管理员快捷登录入口 -->
      <el-divider content-position="center">
        <el-button text size="small" @click="showAdminLogin = !showAdminLogin">
          <el-icon><Lock /></el-icon>
          {{ showAdminLogin ? '切换普通用户登录' : '管理员登录' }}
        </el-button>
      </el-divider>

      <!-- 管理员登录表单 -->
      <el-form v-if="showAdminLogin" :model="adminForm" :rules="adminRules" ref="adminFormRef" label-width="100px">
        <el-alert title="管理员快捷登录" type="warning" :closable="false" style="margin-bottom: 16px" show-icon>
          使用预设管理员账号登录管理后台
        </el-alert>
        <el-form-item label="管理员账号" prop="username">
          <el-input v-model="adminForm.username" placeholder="请输入管理员账号" />
        </el-form-item>
        <el-form-item label="管理员密码" prop="password">
          <el-input v-model="adminForm.password" type="password" show-password placeholder="请输入管理员密码" @keyup.enter="handleAdminLogin" />
        </el-form-item>
        <el-form-item>
          <el-button type="danger" :loading="adminLoading" @click="handleAdminLogin" style="width: 100%">
            管理员登录
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 普通用户登录表单 -->
      <el-form v-else :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="登录方式" prop="loginType">
          <el-radio-group v-model="loginType">
            <el-radio :label="1">学号/工号登录</el-radio>
            <el-radio :label="2">手机验证码</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="loginType === 1" label="学号/工号" prop="identityNo">
          <el-input v-model="form.identityNo" placeholder="请输入学号或工号" />
        </el-form-item>

        <el-form-item v-if="loginType === 1" label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>

        <el-form-item v-if="loginType === 1" label="真实姓名" prop="realName">
          <el-input v-model="form.realName" placeholder="请输入真实姓名（用于身份认证）" />
        </el-form-item>

        <el-form-item v-if="loginType === 2" label="手机号" prop="mobile">
          <el-input v-model="form.mobile" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>

        <el-form-item v-if="loginType === 2" label="验证码" prop="code">
          <el-row :gutter="12">
            <el-col :span="16">
              <el-input v-model="form.code" placeholder="请输入验证码" maxlength="6" />
            </el-col>
            <el-col :span="8">
              <el-button :disabled="countdown > 0" @click="sendCode">
                {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
              </el-button>
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleLogin" style="width: 100%">
            登录
          </el-button>
        </el-form-item>

        <div class="extra-links">
          <span>提示：首次登录自动创建账号</span>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login as apiLogin, wxLogin, adminLogin } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)
const loginType = ref(1)
const countdown = ref(0)

// 管理员登录状态
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

// 管理员登录
const handleAdminLogin = async () => {
  try {
    await adminFormRef.value.validate()
    adminLoading.value = true
    
    const res = await adminLogin(adminForm)
    userStore.setToken(res.data.token, res.data.user)
    ElMessage.success('管理员登录成功')
    
    // 跳转到管理后台
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
      // 学号/工号 + 密码登录（对接校园统一身份认证）
      res = await apiLogin({
        identityType: form.identityNo.startsWith('S') || !isNaN(form.identityNo) ? 1 : 2,
        identityNo: form.identityNo,
        password: form.password,
        realName: form.realName
      })
    } else {
      // 手机验证码登录（模拟）
      res = await wxLogin(form.mobile)
    }
    
    userStore.setToken(res.data.token, res.data.user)
    ElMessage.success('登录成功')
    
    // 如果是管理员，直接跳转到管理后台
    if (res.data.user?.role === 2) {
      router.push('/admin')
    } else {
      const redirect = route.query.redirect || '/'
      router.push(redirect)
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
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 450px;
  padding: 20px;

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 24px;
    font-weight: 600;
    color: #0b6cff;
    margin-bottom: 24px;

    .el-icon {
      font-size: 32px;
    }
  }

  h2 {
    text-align: center;
    margin-bottom: 24px;
    color: #333;
  }

  .extra-links {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;

    span {
      color: #999;
      font-size: 13px;
    }
  }
}
</style>
