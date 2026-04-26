<template>
  <div id="app">
    <el-container v-if="isAuthPage || isAdminRoute">
      <router-view />
    </el-container>
    <el-container v-else>
      <el-header class="main-header">
        <div class="header-content">
          <div class="logo" @click="$router.push('/')">
            <el-icon><Bell /></el-icon>
            <span>校园失物招领</span>
          </div>
          <el-menu mode="horizontal" :router="true" :default-active="route.path" class="nav-menu">
            <el-menu-item index="/">首页</el-menu-item>
            <el-menu-item index="/lost">失物信息</el-menu-item>
            <el-menu-item index="/found">招领信息</el-menu-item>
            <el-menu-item index="/publish">发布</el-menu-item>
          </el-menu>
          <div class="user-actions">
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="message-badge">
              <el-icon @click="$router.push('/messages')"><Message /></el-icon>
            </el-badge>
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="32" :src="userStore.avatarUrl">{{ userStore.nickname?.charAt(0) }}</el-avatar>
                <span class="username">{{ userStore.nickname || '未登录' }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="mine">我的发布</el-dropdown-item>
                  <el-dropdown-item command="claims">我的认领</el-dropdown-item>
                  <el-dropdown-item v-if="userStore.role === 2" command="admin">管理后台</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
      <el-footer class="main-footer">
        <p>© 2026 校园失物招领系统 - 智慧校园服务</p>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const notificationStore = useNotificationStore()

const isAuthPage = computed(() => route.path.startsWith('/auth'))
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const unreadCount = computed(() => notificationStore.unreadCount)

onMounted(async () => {
  await userStore.checkLogin()
  if (userStore.isLoggedIn) {
    await notificationStore.fetchUnreadCount()
  }
})

const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'mine':
      router.push('/mine/posts')
      break
    case 'claims':
      router.push('/mine/claims')
      break
    case 'admin':
      router.push('/admin')
      break
    case 'logout':
      await ElMessageBox.confirm('确认退出登录？', '提示', { confirmButtonText: '确定', cancelButtonText: '取消' })
      userStore.logout()
      router.push('/')
      location.reload()
      break
  }
}
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  min-height: 100vh;
}

.main-header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
  height: 60px;

  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
    font-weight: 600;
    color: #0b6cff;
    cursor: pointer;

    .el-icon {
      font-size: 28px;
    }
  }

  .nav-menu {
    border-bottom: none;
    flex: 1;
    margin: 0 40px;
    justify-content: center;
  }

  .user-actions {
    display: flex;
    align-items: center;
    gap: 20px;

    .message-badge {
      cursor: pointer;
      font-size: 22px;
      color: #666;

      &:hover {
        color: #0b6cff;
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;

      .username {
        font-size: 14px;
        color: #333;
      }
    }
  }
}

.main-content {
  min-height: calc(100vh - 120px);
  background: #f5f6f8;
  padding: 24px;
}

.main-footer {
  background: #fff;
  text-align: center;
  padding: 16px;
  color: #999;
  font-size: 14px;
}
</style>
