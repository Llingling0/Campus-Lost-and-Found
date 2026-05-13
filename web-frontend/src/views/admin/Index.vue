<template>
  <div class="admin-layout">
    <el-container>
      <!-- Sidebar -->
      <el-aside :width="isCollapse ? '64px' : '220px'" class="admin-aside">
        <div class="aside-header">
          <div class="aside-logo" @click="$router.push('/admin')">
            <div class="logo-icon">
              <el-icon :size="20"><Setting /></el-icon>
            </div>
            <transition name="fade">
              <span v-if="!isCollapse" class="logo-text">管理后台</span>
            </transition>
          </div>
        </div>

        <div class="aside-menu">
          <div
            v-for="item in menuItems"
            :key="item.path"
            :class="['menu-item', { active: isActive(item.path) }]"
            @click="$router.push(item.path)"
          >
            <el-icon :size="18"><component :is="item.icon" /></el-icon>
            <transition name="fade">
              <span v-if="!isCollapse" class="menu-label">{{ item.label }}</span>
            </transition>
            <span v-if="item.badge && !isCollapse" class="menu-badge">{{ item.badge }}</span>
          </div>
        </div>

        <div class="aside-footer">
          <div class="collapse-btn" @click="isCollapse = !isCollapse">
            <el-icon :size="16">
              <ArrowLeft v-if="!isCollapse" />
              <ArrowRight v-else />
            </el-icon>
          </div>
        </div>
      </el-aside>

      <!-- Main Area -->
      <el-container>
        <el-header class="admin-header">
          <div class="header-left">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/admin' }">管理后台</el-breadcrumb-item>
              <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <el-button text @click="$router.push('/')" class="back-btn">
              <el-icon><HomeFilled /></el-icon>
              <span>返回前台</span>
            </el-button>
            <el-divider direction="vertical" />
            <el-dropdown trigger="click">
              <div class="user-info">
                <el-avatar :size="32" class="user-avatar">
                  {{ userStore.nickname?.charAt(0) || 'A' }}
                </el-avatar>
                <span class="user-name">{{ userStore.nickname || '管理员' }}</span>
                <el-icon :size="12"><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleLogout">
                    <el-icon><SwitchButton /></el-icon> 退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <el-main class="admin-main">
          <router-view v-slot="{ Component }">
            <transition name="page" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isCollapse = ref(false)

const menuItems = [
  { path: '/admin/dashboard', label: '控制台', icon: 'HomeFilled' },
  { path: '/admin/audit', label: '信息审核', icon: 'DocumentChecked' },
  { path: '/admin/users', label: '用户管理', icon: 'User' },
  { path: '/admin/stats', label: '数据统计', icon: 'DataAnalysis' },
  { path: '/admin/configs', label: '系统设置', icon: 'Setting' },
  { path: '/admin/announcements', label: '公告管理', icon: 'Bell' },
  { path: '/admin/feedbacks', label: '反馈管理', icon: 'ChatLineSquare' }
]

const currentTitle = computed(() => {
  const item = menuItems.find(m => route.path.startsWith(m.path))
  return item?.label || ''
})

const isActive = (path) => {
  if (path === '/admin/dashboard') {
    return route.path === '/admin' || route.path === '/admin/dashboard'
  }
  return route.path.startsWith(path)
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确认退出登录？', '提示', { type: 'warning' })
  } catch { return }
  userStore.logout()
  router.push('/')
  location.reload()
}
</script>

<style lang="scss" scoped>
.admin-layout {
  height: 100%;
  display: flex;

  > .el-container {
    height: 100%;
    flex: 1;
  }
}

// --- Sidebar ---
.admin-aside {
  background: #fff;
  border-right: 1px solid var(--c-border);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-base);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  z-index: 10;

  .aside-header {
    padding: 16px;
    border-bottom: 1px solid var(--c-border-light);

    .aside-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;

      .logo-icon {
        width: 32px;
        height: 32px;
        border-radius: var(--radius-sm);
        background: var(--c-primary-gradient);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        flex-shrink: 0;
      }

      .logo-text {
        font-size: 16px;
        font-weight: 700;
        color: var(--c-text-primary);
        white-space: nowrap;
      }
    }
  }

  .aside-menu {
    flex: 1;
    padding: 12px 8px;
    overflow-y: auto;

    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      margin-bottom: 4px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all var(--transition-fast);
      color: var(--c-text-secondary);
      font-size: 14px;
      font-weight: 500;
      position: relative;

      &:hover {
        background: var(--c-primary-soft);
        color: var(--c-primary);
      }

      &.active {
        background: var(--c-primary-soft);
        color: var(--c-primary);
        font-weight: 600;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: var(--c-primary-gradient);
          border-radius: 0 2px 2px 0;
        }
      }

      .menu-label {
        white-space: nowrap;
      }

      .menu-badge {
        margin-left: auto;
        background: var(--c-danger);
        color: #fff;
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 10px;
        font-weight: 600;
      }
    }
  }

  .aside-footer {
    padding: 12px;
    border-top: 1px solid var(--c-border-light);

    .collapse-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      color: var(--c-text-tertiary);
      transition: all var(--transition-fast);

      &:hover {
        background: var(--c-bg);
        color: var(--c-text-secondary);
      }
    }
  }
}

// --- Header ---
.admin-header {
  background: #fff;
  border-bottom: 1px solid var(--c-border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;

  .header-left {
    :deep(.el-breadcrumb__inner) {
      font-weight: 500;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;

    .back-btn {
      color: var(--c-text-secondary);
      font-size: 13px;
      &:hover { color: var(--c-primary); }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 20px;
      transition: all var(--transition-fast);

      &:hover {
        background: var(--c-bg);
      }

      .user-avatar {
        border: 2px solid var(--c-primary-light);
      }

      .user-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--c-text-primary);
      }
    }
  }
}

// --- Main ---
.admin-main {
  background: var(--c-bg);
  padding: 24px;
  overflow-y: auto;
}

// --- Transitions ---
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.page-enter-active {
  animation: fadeInUp 0.3s ease;
}
.page-leave-active {
  animation: fadeIn 0.15s ease reverse;
}
</style>
