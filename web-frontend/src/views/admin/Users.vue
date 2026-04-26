<template>
  <div class="users-page">
    <el-card>
      <template #header>
        <span>用户管理</span>
      </template>

      <div v-loading="loading" class="user-table">
        <el-table :data="userList" stripe>
          <el-table-column prop="student_no" label="学号" />
          <el-table-column prop="staff_no" label="工号" />
          <el-table-column prop="real_name" label="姓名" />
          <el-table-column prop="mobile" label="手机号" />
          <el-table-column prop="nickname" label="昵称" />
          <el-table-column label="角色" width="80">
            <template #default="{ row }">
              <el-tag :type="row.role === 2 ? 'danger' : ''">
                {{ row.role === 2 ? '管理员' : '普通用户' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                {{ row.status === 1 ? '正常' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="注册时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 1 && row.role !== 2"
                type="danger"
                size="small"
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
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserList, disableUser, enableUser } from '@/api/admin'
import dayjs from 'dayjs'

const loading = ref(false)
const userList = ref([])

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
  .user-table {
    margin-top: 16px;
  }
}
</style>
