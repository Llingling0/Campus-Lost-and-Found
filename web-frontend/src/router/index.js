import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Home', component: () => import('@/views/Home.vue') },
  { path: '/lost', name: 'LostList', component: () => import('@/views/PostList.vue'), meta: { type: 1 } },
  { path: '/found', name: 'FoundList', component: () => import('@/views/PostList.vue'), meta: { type: 2 } },
  { path: '/detail/:id', name: 'Detail', component: () => import('@/views/Detail.vue') },
  { path: '/publish', name: 'Publish', component: () => import('@/views/Publish.vue') },
  { path: '/auth/login', name: 'Login', component: () => import('@/views/auth/Login.vue') },
  { path: '/messages', name: 'Messages', component: () => import('@/views/Messages.vue'), meta: { requiresAuth: true } },
  { path: '/profile', name: 'Profile', component: () => import('@/views/Profile.vue'), meta: { requiresAuth: true } },
  { path: '/mine/posts', name: 'MyPosts', component: () => import('@/views/mine/Posts.vue'), meta: { requiresAuth: true } },
  { path: '/mine/claims', name: 'MyClaims', component: () => import('@/views/mine/Claims.vue'), meta: { requiresAuth: true } },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/admin/Index.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    redirect: '/admin/dashboard',
    children: [
      { path: 'dashboard', name: 'AdminDashboard', component: () => import('@/views/admin/Dashboard.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'audit', name: 'AdminAudit', component: () => import('@/views/admin/Audit.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'users', name: 'AdminUsers', component: () => import('@/views/admin/Users.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'stats', name: 'AdminStats', component: () => import('@/views/admin/Stats.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'configs', name: 'AdminConfigs', component: () => import('@/views/admin/Configs.vue'), meta: { requiresAuth: true, requiresAdmin: true } }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.meta.requiresAuth && !token) {
    next('/auth/login?redirect=' + encodeURIComponent(to.fullPath))
  } else if (to.meta.requiresAdmin) {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.role !== 2) {
      next('/')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
