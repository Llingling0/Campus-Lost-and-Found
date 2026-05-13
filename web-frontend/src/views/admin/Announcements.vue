<template>
  <div class="announcements-page">
    <div class="page-header">
      <h2>公告管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon> 发布公告
      </el-button>
    </div>

    <div class="content-card">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="图片" width="80">
          <template #default="{ row }">
            <el-image v-if="row.image_url" :src="row.image_url" fit="cover" style="width:48px;height:48px;border-radius:6px" />
            <span v-else style="color:#ccc;font-size:22px">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="150" />
        <el-table-column prop="content" label="内容" min-width="200">
          <template #default="{ row }">
            <span class="content-preview">{{ row.content }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm title="确认删除该公告？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button size="small" type="danger" plain>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingId ? '编辑公告' : '发布公告'"
      width="600px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入公告标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="图片(可选)">
          <div class="announcement-upload">
            <div v-if="form.imageUrl" class="image-preview">
              <el-image :src="form.imageUrl" fit="cover" style="width:200px;height:120px;border-radius:8px" />
              <el-button type="danger" size="small" circle @click="form.imageUrl = ''">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <el-upload
              v-else
              :http-request="uploadImage"
              :show-file-list="false"
              accept="image/*"
            >
              <div class="upload-trigger">
                <el-icon :size="28"><Plus /></el-icon>
                <span>上传图片</span>
              </div>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="请输入公告内容"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">立即发布</el-radio>
            <el-radio :value="0">保存草稿</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ editingId ? '保存修改' : '发布' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import dayjs from 'dayjs'

const list = ref([])
const loading = ref(false)
const showCreateDialog = ref(false)
const editingId = ref(null)
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  title: '',
  content: '',
  imageUrl: '',
  status: 1
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const fetchList = async () => {
  loading.value = true
  try {
    const res = await request.get('/announcements/all')
    list.value = (res.data || []).map(item => ({
      ...item,
      image_url: item.image_url ? (item.image_url.startsWith('/') ? window.location.origin + item.image_url : item.image_url) : null
    }))
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const uploadImage = async (options) => {
  const formData = new FormData()
  formData.append('file', options.file)
  try {
    const res = await request.post('/announcements/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    form.imageUrl = res.data.url
    options.onSuccess(res)
  } catch (e) {
    options.onError(e)
  }
}

const openEdit = (row) => {
  editingId.value = row.id
  form.title = row.title
  form.content = row.content
  form.imageUrl = row.image_url || ''
  form.status = row.status
  showCreateDialog.value = true
}

const resetForm = () => {
  editingId.value = null
  form.title = ''
  form.content = ''
  form.imageUrl = ''
  form.status = 1
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch { return }

  submitting.value = true
  const payload = {
    title: form.title,
    content: form.content,
    imageUrl: form.imageUrl || null,
    status: form.status
  }
  try {
    if (editingId.value) {
      await request.put(`/announcements/${editingId.value}`, payload)
      ElMessage.success('修改成功')
    } else {
      await request.post('/announcements', {
        ...payload,
        publishAt: form.status === 1 ? new Date().toISOString() : null
      })
      ElMessage.success('发布成功')
    }
    showCreateDialog.value = false
    fetchList()
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id) => {
  try {
    await request.delete(`/announcements/${id}`)
    ElMessage.success('已删除')
    fetchList()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style lang="scss" scoped>
.announcements-page {
  animation: fadeInUp 0.3s ease;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    font-size: 20px;
    font-weight: 700;
    color: var(--c-text-primary);
  }
}

.content-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.content-preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 13px;
  color: var(--c-text-secondary);
}

.announcement-upload {
  .image-preview {
    position: relative;
    display: inline-block;

    .el-button {
      position: absolute;
      top: -8px;
      right: -8px;
    }
  }

  .upload-trigger {
    width: 120px;
    height: 80px;
    border: 2px dashed var(--c-border);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    color: var(--c-text-tertiary);
    font-size: 12px;
    transition: all var(--transition-fast);

    &:hover {
      border-color: var(--c-primary);
      color: var(--c-primary);
      background: var(--c-primary-soft);
    }
  }
}
</style>
