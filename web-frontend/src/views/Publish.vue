<template>
  <div class="publish-page">
    <el-card class="publish-card">
      <template #header>
        <span>发布信息</span>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="信息类型" prop="postType">
          <el-radio-group v-model="form.postType">
            <el-radio :label="1"><el-icon><Warning /></el-icon> 失物</el-radio>
            <el-radio :label="2"><el-icon><CircleCheck /></el-icon> 招领</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="物品名称" prop="title">
          <el-input v-model="form.title" :placeholder="`请输入${form.postType === 1 ? '丢失' : '拾获'}的物品名称`" />
        </el-form-item>

        <el-form-item label="物品分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="时间" prop="occurTime">
          <el-date-picker
            v-model="form.occurTime"
            type="datetime"
            placeholder="选择日期时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="地点" prop="occurLocation">
          <el-select
            v-model="form.occurLocation"
            placeholder="请选择地点"
            allow-create
            filterable
            style="width: 100%"
          >
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

        <el-form-item label="详细描述" prop="detail">
          <el-input
            v-model="form.detail"
            type="textarea"
            :rows="4"
            placeholder="请详细描述物品特征，如颜色、品牌、特殊标识等"
          />
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
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">最多上传 5 张图片，单张不超过 5MB</div>
        </el-form-item>

        <el-form-item v-if="form.postType === 1" label="悬赏金额" prop="rewardAmount">
          <el-input-number v-model="form.rewardAmount" :min="0" :max="1000" :precision="2" :step="1" />
          <span class="unit">元</span>
        </el-form-item>

        <el-form-item v-if="form.postType === 2" label="存放地点" prop="depositLocation">
          <el-input v-model="form.depositLocation" placeholder="请输入物品当前存放地点" />
        </el-form-item>

        <el-form-item v-if="form.postType === 2" label="联系方式" prop="contactInfo">
          <el-input v-model="form.contactInfo" placeholder="请输入联系方式（仅管理员和认领人可见）" />
        </el-form-item>

        <el-form-item>
          <el-button @click="saveDraft">保存草稿</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitPost">
            {{ isEdit ? '更新' : '提交审核' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
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
  occurLocation: [{ required: true, message: '请选择地点', trigger: 'change' }]
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
      imageList.value = data.images.map((img, idx) => ({
        url: img.imgUrl,
        name: `image${idx}`
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
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
  }
  return isImage && isLt5M
}

const handleImageChange = (file, fileList) => {
  imageList.value = fileList
}

const handleImageRemove = (file, fileList) => {
  imageList.value = fileList
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

.publish-card {
  .unit {
    margin-left: 8px;
    color: #666;
  }

  .upload-tip {
    margin-top: 8px;
    font-size: 12px;
    color: #999;
  }

  :deep(.el-upload-list__item) {
    width: 100px;
    height: 100px;
  }
}
</style>
