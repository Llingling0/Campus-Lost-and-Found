<template>
  <div id="app">
    <el-container v-if="isAuthPage || isAdminRoute">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-container>

    <el-container v-else>
      <el-header class="main-header">
        <div class="header-content">
          <div class="logo" @click="$router.push('/')">
            <div class="logo-icon">
              <el-icon :size="22"><Search /></el-icon>
            </div>
            <span class="logo-text">校园失物招领</span>
          </div>

          <el-menu mode="horizontal" :router="true" :default-active="route.path" class="nav-menu">
            <el-menu-item index="/">
              <el-icon><HomeFilled /></el-icon>
              <span>首页</span>
            </el-menu-item>
            <el-menu-item index="/lost">
              <el-icon><Document /></el-icon>
              <span>失物信息</span>
            </el-menu-item>
            <el-menu-item index="/found">
              <el-icon><CircleCheck /></el-icon>
              <span>招领信息</span>
            </el-menu-item>
            <el-menu-item index="/publish">
              <el-icon><Plus /></el-icon>
              <span>发布</span>
            </el-menu-item>
          </el-menu>

          <div class="user-actions">
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="message-badge">
              <div class="icon-btn" @click="$router.push('/messages')">
                <el-icon :size="20"><Bell /></el-icon>
              </div>
            </el-badge>

            <el-dropdown @command="handleCommand" trigger="click">
              <div class="user-info">
                <el-avatar :size="34" :src="userStore.avatarUrl" class="user-avatar">
                  {{ userStore.nickname?.charAt(0) || 'U' }}
                </el-avatar>
                <span class="username">{{ userStore.nickname || '未登录' }}</span>
                <el-icon class="arrow-icon"><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon> 个人中心
                  </el-dropdown-item>
                  <el-dropdown-item command="mine">
                    <el-icon><Document /></el-icon> 我的发布
                  </el-dropdown-item>
                  <el-dropdown-item command="claims">
                    <el-icon><Checked /></el-icon> 我的认领
                  </el-dropdown-item>
                  <el-dropdown-item command="feedback">
                    <el-icon><ChatLineSquare /></el-icon> 意见反馈
                  </el-dropdown-item>
                  <el-dropdown-item v-if="userStore.role === 2" command="admin" divided>
                    <el-icon><Setting /></el-icon> 管理后台
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon><SwitchButton /></el-icon> 退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>

      <el-footer class="main-footer">
        <div class="footer-content">
          <div class="footer-left">
            <div class="footer-logo">
              <el-icon :size="18"><Search /></el-icon>
              <span>校园失物招领</span>
            </div>
            <p>智慧校园服务 · 让每一件失物都能回家</p>
          </div>
          <div class="footer-links">
            <span @click="$router.push('/feedback')">意见反馈</span>
            <span>关于我们</span>
            <span>帮助中心</span>
            <span>用户协议</span>
            <span>隐私政策</span>
          </div>
          <div class="footer-right">
            <p>&copy; 2026 Campus Lost & Found</p>
          </div>
        </div>
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
    case 'feedback':
      router.push('/feedback')
      break
    case 'admin':
      router.push('/admin')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确认退出登录？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
      } catch { return }
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

html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#app {
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  color: var(--c-text-primary);
  display: flex;
  flex-direction: column;

  > .el-container {
    flex: 1;
    height: 100%;
    overflow: auto;
  }
}

// --- Header ---
.main-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid var(--c-border);
  padding: 0;
  height: 64px;

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
    gap: 10px;
    cursor: pointer;
    user-select: none;

    .logo-icon {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-sm);
      background: var(--c-primary-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 700;
      background: var(--c-primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: 0.5px;
    }
  }

  .nav-menu {
    border-bottom: none !important;
    flex: 1;
    margin: 0 32px;
    justify-content: center;
    background: transparent !important;

    .el-menu-item {
      border-bottom: 2px solid transparent !important;
      margin: 0 2px;
      border-radius: var(--radius-sm);
      transition: all var(--transition-base);
      color: var(--c-text-secondary) !important;
      font-weight: 500;
      height: 64px;

      &:hover {
        color: var(--c-primary) !important;
        background: var(--c-primary-soft) !important;
      }

      &.is-active {
        color: var(--c-primary) !important;
        border-bottom-color: var(--c-primary) !important;
        font-weight: 600;
      }

      .el-icon {
        margin-right: 6px;
      }
    }
  }

  .user-actions {
    display: flex;
    align-items: center;
    gap: 16px;

    .message-badge {
      .icon-btn {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--c-text-tertiary);
        background: var(--c-bg);
        transition: all var(--transition-fast);

        &:hover {
          color: var(--c-primary);
          background: var(--c-primary-soft);
        }
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 4px 12px 4px 4px;
      border-radius: 40px;
      background: var(--c-bg);
      transition: all var(--transition-fast);

      &:hover {
        background: var(--c-primary-soft);
      }

      .user-avatar {
        border: 2px solid var(--c-primary-light);
      }

      .username {
        font-size: 14px;
        font-weight: 500;
        color: var(--c-text-primary);
        max-width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .arrow-icon {
        font-size: 12px;
        color: var(--c-text-tertiary);
      }
    }
  }
}

// --- Main Content ---
.main-content {
  min-height: calc(100vh - 140px);
  background: var(--c-bg);
  padding: 24px;
}

// --- Footer ---
.main-footer {
  background: #fff;
  border-top: 1px solid var(--c-border-light);
  padding: 0;
  height: auto;

  .footer-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .footer-left {
    .footer-logo {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      color: var(--c-primary);
      margin-bottom: 4px;
    }

    p {
      font-size: 13px;
      color: var(--c-text-tertiary);
    }
  }

  .footer-links {
    display: flex;
    gap: 24px;

    span {
      font-size: 13px;
      color: var(--c-text-tertiary);
      cursor: pointer;
      transition: color var(--transition-fast);

      &:hover {
        color: var(--c-primary);
      }
    }
  }

  .footer-right {
    p {
      font-size: 13px;
      color: var(--c-text-tertiary);
    }
  }
}

// --- Page Transitions ---
.page-enter-active {
  animation: fadeInUp 0.3s ease;
}
.page-leave-active {
  animation: fadeIn 0.15s ease reverse;
}
</style>
