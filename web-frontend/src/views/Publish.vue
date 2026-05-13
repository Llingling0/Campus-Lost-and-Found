<template>
  <div class="publish-page">
    <div class="page-hero">
      <h1>{{ isEdit ? '编辑信息' : '发布信息' }}</h1>
      <p>请如实填写物品信息，帮助失主更快找回物品</p>
    </div>

    <div class="form-card">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" size="large">
        <!-- Type -->
        <el-form-item label="信息类型" prop="postType">
          <div class="type-toggle">
            <div
              :class="['type-option', { active: form.postType === 1 }]"
              @click="form.postType = 1"
            >
              <div class="type-icon lost">
                <el-icon :size="24"><Warning /></el-icon>
              </div>
              <div class="type-text">
                <div class="type-name">失物</div>
                <div class="type-desc">我丢失了物品</div>
              </div>
            </div>
            <div
              :class="['type-option', { active: form.postType === 2 }]"
              @click="form.postType = 2"
            >
              <div class="type-icon found">
                <el-icon :size="24"><CircleCheck /></el-icon>
              </div>
              <div class="type-text">
                <div class="type-name">招领</div>
                <div class="type-desc">我拾获了物品</div>
              </div>
            </div>
          </div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物品名称" prop="title">
              <el-input v-model="form.title" :placeholder="`请输入${form.postType === 1 ? '丢失' : '拾获'}物品名称`" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物品分类" prop="categoryId">
              <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
                <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="时间" prop="occurTime">
              <el-date-picker
                v-model="form.occurTime"
                type="datetime"
                placeholder="选择日期时间"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地点" prop="occurLocation">
              <el-select v-model="form.occurLocation" placeholder="请选择地点" allow-create filterable style="width: 100%">
                <el-option label="教学楼 A 栋" value="教学楼 A 栋" />
                <el-option label="教学楼 B 栋" value="教学楼 B 栋" />
                <el-option label="图书馆" value="图书馆" />
                <el-option label="食堂一楼" value="食堂一楼" />
                <el-option label="食堂二楼" value="食堂二楼" />
                <el-option label="宿舍区" value="宿舍区" />
                <el-option label="操场" value="操场" />
                <el-option label="校医院" value="校医院" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="详细描述" prop="detail">
          <el-input
            v-model="form.detail"
            type="textarea"
            :rows="5"
            placeholder="请详细描述物品特征，如颜色、品牌、特殊标识、磨损细节等"
          />
          <div class="char-count">{{ form.detail?.length || 0 }}/500</div>
        </el-form-item>

        <el-form-item label="上传图片" prop="images">
          <el-upload
            v-model:file-list="imageList"
            list-type="picture-card"
            :on-change="handleImageChange"
            :on-remove="handleImageRemove"
            :before-upload="beforeImageUpload"
            :http-request="uploadImage"
            :limit="5"
          >
            <div class="upload-placeholder">
              <el-icon :size="24"><Plus /></el-icon>
              <span>上传图片</span>
            </div>
          </el-upload>
          <div class="upload-tip">最多 5 张，支持 JPG/PNG，单张不超过 5MB</div>
        </el-form-item>

        <!-- Lost-specific -->
        <template v-if="form.postType === 1">
          <el-form-item label="悬赏金额" prop="rewardAmount">
            <el-input-number v-model="form.rewardAmount" :min="0" :max="1000" :precision="2" controls-position="right" />
            <span class="unit-text">元</span>
          </el-form-item>
        </template>

        <!-- Found-specific -->
        <template v-if="form.postType === 2">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="存放地点" prop="depositLocation">
                <el-input v-model="form.depositLocation" placeholder="请输入物品存放地点" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系方式" prop="contactInfo">
                <el-input v-model="form.contactInfo" placeholder="仅管理员和认领人可见" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <el-divider />

        <el-form-item>
          <div class="form-actions">
            <el-button @click="saveDraft" :loading="submitLoading">保存草稿</el-button>
            <el-button type="primary" @click="submitPost" :loading="submitLoading" size="large">
              {{ isEdit ? '更新信息' : '提交审核' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCategories, createPost, updatePost, getPostDetail } from '@/api/post'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const isEdit = ref(false)
const submitLoading = ref(false)
const categories = ref([])
const imageList = ref([])

const form = reactive({
  postType: 1,
  title: '',
  categoryId: undefined,
  occurTime: '',
  occurLocation: '',
  detail: '',
  images: [],
  rewardAmount: 0,
  depositLocation: '',
  contactInfo: ''
})

const rules = {
  postType: [{ required: true, message: '请选择信息类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入物品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择物品分类', trigger: 'change' }],
  occurTime: [{ required: true, message: '请选择时间', trigger: 'change' }],
  occurLocation: [{ required: true, message: '请选择或输入地点', trigger: 'change' }]
}

const fetchCategories = async () => {
  try {
    const res = await getCategories()
    categories.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

const loadPostDetail = async (id) => {
  try {
    const res = await getPostDetail(id)
    const data = res.data
    Object.assign(form, {
      postType: data.post_type,
      title: data.title,
      categoryId: data.category_id,
      occurTime: data.occur_time,
      occurLocation: data.occur_location,
      detail: data.detail,
      rewardAmount: data.reward_amount,
      depositLocation: data.deposit_location,
      contactInfo: data.contact_info
    })
    if (data.images) {
      const baseURL = window.location.origin
      imageList.value = data.images.map((img, idx) => ({
        url: img.imgUrl?.startsWith('/') ? baseURL + img.imgUrl : img.imgUrl,
        name: `image${idx}`,
        status: 'success'
      }))
      form.images = data.images.map(img => img.imgUrl)
    }
    isEdit.value = true
  } catch (e) {
    console.error(e)
  }
}

const beforeImageUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) ElMessage.error('只能上传图片文件')
  if (!isLt5M) ElMessage.error('图片大小不能超过 5MB')
  return isImage && isLt5M
}

const handleImageChange = (file, fileList) => {
  imageList.value = fileList
}

const handleImageRemove = (file, fileList) => {
  imageList.value = fileList
  form.images = fileList
    .filter(f => f.url)
    .map(f => f.url)
}

const uploadImage = async (options) => {
  const formData = new FormData()
  formData.append('file', options.file)
  try {
    const res = await request.post('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const url = res.data.url
    form.images.push(url)
    options.onSuccess(res)
  } catch (e) {
    options.onError(e)
  }
}

const saveDraft = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    await createPost({ ...form, isDraft: true })
    ElMessage.success('草稿已保存')
    router.push('/mine/posts')
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }
}

const submitPost = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    if (isEdit.value) {
      await updatePost(route.params.id, form)
      ElMessage.success('更新成功')
    } else {
      await createPost({ ...form, isDraft: false })
      ElMessage.success('提交成功，请等待审核')
    }
    router.push('/mine/posts')
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchCategories()
  if (route.params.id) {
    loadPostDetail(route.params.id)
  }
})
</script>

<style lang="scss" scoped>
.publish-page {
  max-width: 800px;
  margin: 0 auto;
}

.page-hero {
  text-align: center;
  margin-bottom: 28px;

  h1 {
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

.form-card {
  background: #fff;
  border-radius: var(--radius-xl);
  padding: 32px;
  box-shadow: var(--shadow-sm);
  animation: fadeInUp 0.4s ease;
}

// Type Toggle
.type-toggle {
  display: flex;
  gap: 16px;

  .type-option {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    border: 2px solid var(--c-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-base);

    &:hover {
      border-color: var(--c-primary-light);
      background: var(--c-primary-soft);
    }

    &.active {
      border-color: var(--c-primary);
      background: var(--c-primary-soft);
      box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
    }

    .type-icon {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;

      &.lost  { background: linear-gradient(135deg, #f59e0b, #f97316); }
      &.found { background: linear-gradient(135deg, #10b981, #059669); }
    }

    .type-text {
      .type-name {
        font-size: 16px;
        font-weight: 600;
        color: var(--c-text-primary);
        margin-bottom: 4px;
      }

      .type-desc {
        font-size: 13px;
        color: var(--c-text-tertiary);
      }
    }
  }
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: var(--c-text-tertiary);
  margin-top: 6px;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--c-text-tertiary);
  font-size: 12px;
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--c-text-tertiary);
}

.unit-text {
  margin-left: 8px;
  color: var(--c-text-secondary);
  font-size: 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
}

:deep(.el-upload-list__item) {
  width: 100px;
  height: 100px;
  border-radius: var(--radius-sm);
}
</style>
