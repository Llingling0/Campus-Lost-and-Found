<template>
  <div class="users-page">
    <div class="page-toolbar">
      <h2 class="page-title">用户管理</h2>
      <div class="toolbar-right">
        <el-input
          v-model="searchKey"
          placeholder="搜索用户..."
          clearable
          :prefix-icon="Search"
          style="width: 240px"
        />
      </div>
    </div>

    <div v-loading="loading" class="table-wrapper">
      <el-table :data="filteredUsers" stripe style="width: 100%">
        <el-table-column label="用户" min-width="180">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="36">{{ row.nickname?.charAt(0) || 'U' }}</el-avatar>
              <div class="user-cell-info">
                <div class="user-name">{{ row.nickname || '-' }}</div>
                <div class="user-id">{{ row.student_no || row.staff_no || '-' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="real_name" label="真实姓名" width="120" />
        <el-table-column prop="mobile" label="手机号" width="140" />
        <el-table-column label="角色" width="100" align="center">
          <template #default="{ row }">
            <span :class="['role-badge', row.role === 2 ? 'admin' : 'user']">
              {{ row.role === 2 ? '管理员' : '普通用户' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <span :class="['status-dot', row.status === 1 ? 'active' : 'disabled']"></span>
            {{ row.status === 1 ? '正常' : '禁用' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 1 && row.role !== 2"
              type="danger"
              size="small"
              plain
              @click="handleDisable(row.id)"
            >
              禁用
            </el-button>
            <el-button
              v-if="row.status === 2"
              type="success"
              size="small"
              @click="handleEnable(row.id)"
            >
              解禁
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div v-if="!loading && userList.length === 0" class="empty-full">
      <el-icon :size="48"><User /></el-icon>
      <p>暂无用户数据</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getUserList, disableUser, enableUser } from '@/api/admin'
import dayjs from 'dayjs'

const loading = ref(false)
const userList = ref([])
const searchKey = ref('')

const filteredUsers = computed(() => {
  if (!searchKey.value) return userList.value
  const kw = searchKey.value.toLowerCase()
  return userList.value.filter(u =>
    u.nickname?.toLowerCase().includes(kw) ||
    u.real_name?.toLowerCase().includes(kw) ||
    u.student_no?.toLowerCase().includes(kw) ||
    u.mobile?.includes(kw)
  )
})

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await getUserList()
    userList.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleDisable = async (id) => {
  try {
    await ElMessageBox.confirm('确认禁用该用户？', '提示', { type: 'warning' })
  } catch { return }
  try {
    await disableUser(id)
    ElMessage.success('已禁用')
    fetchUsers()
  } catch (e) {
    console.error(e)
  }
}

const handleEnable = async (id) => {
  try {
    await enableUser(id)
    ElMessage.success('已解禁')
    fetchUsers()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style lang="scss" scoped>
.users-page {
  animation: fadeInUp 0.4s ease;
}

.page-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--c-text-primary);
  }
}

.table-wrapper {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 0;
  overflow: hidden;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;

  .user-cell-info {
    .user-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--c-text-primary);
    }
    .user-id {
      font-size: 12px;
      color: var(--c-text-tertiary);
      margin-top: 2px;
    }
  }
}

.role-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;

  &.admin {
    background: var(--c-primary-soft);
    color: var(--c-primary-dark);
  }

  &.user {
    background: var(--c-bg);
    color: var(--c-text-secondary);
  }
}

.status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 6px;

  &.active {
    background: var(--c-success);
    box-shadow: 0 0 0 3px var(--c-success-soft);
  }

  &.disabled {
    background: var(--c-danger);
    box-shadow: 0 0 0 3px var(--c-danger-soft);
  }
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
}
</style>
