<template>
  <div class="configs-page">
    <el-card>
      <template #header>
        <span>系统设置</span>
      </template>

      <el-form :model="configs" label-width="200px" style="max-width: 600px">
        <el-form-item label="每日最大发布数">
          <el-input-number
            v-model="configs.max_daily_publish"
            :min="1"
            :max="50"
            @change="handleConfigChange('max_daily_publish', configs.max_daily_publish)"
          />
          <div class="form-tip">每个用户每天最多可发布的失物/招领信息数量</div>
        </el-form-item>

        <el-form-item label="审核超时时间（小时）">
          <el-input-number
            v-model="configs.audit_timeout_hours"
            :min="1"
            :max="72"
            @change="handleConfigChange('audit_timeout_hours', configs.audit_timeout_hours)"
          />
          <div class="form-tip">管理员需在指定时间内完成信息审核</div>
        </el-form-item>

        <el-form-item label="认领处理超时（小时）">
          <el-input-number
            v-model="configs.claim_timeout_hours"
            :min="1"
            :max="168"
            @change="handleConfigChange('claim_timeout_hours', configs.claim_timeout_hours)"
          />
          <div class="form-tip">认领申请需在指定时间内处理，逾期自动驳回</div>
        </el-form-item>

        <el-form-item label="信息过期天数">
          <el-input-number
            v-model="configs.post_expire_days"
            :min="7"
            :max="365"
            @change="handleConfigChange('post_expire_days', configs.post_expire_days)"
          />
          <div class="form-tip">信息发布后超过指定天数自动标记为过期</div>
        </el-form-item>

        <el-form-item label="图片上传大小限制">
          <el-select v-model="configs.image_size_limit" style="width: 200px">
            <el-option label="2MB" value="2" />
            <el-option label="5MB" value="5" />
            <el-option label="10MB" value="10" />
          </el-select>
          <div class="form-tip">单张图片上传的最大文件大小</div>
        </el-form-item>
      </el-form>

      <el-divider />

      <el-card class="help-card">
        <template #header>
          <span><el-icon><QuestionFilled /></el-icon> 帮助中心管理</span>
        </template>
        <p>帮助中心提供用户使用指南和常见问题解答。</p>
        <el-button type="primary" disabled>编辑帮助中心</el-button>
      </el-card>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getConfigs, updateConfigs } from '@/api/admin'

const configs = reactive({
  max_daily_publish: 10,
  audit_timeout_hours: 24,
  claim_timeout_hours: 72,
  post_expire_days: 90,
  image_size_limit: '5'
})

const fetchConfigs = async () => {
  try {
    const res = await getConfigs()
    const list = res.data || []
    list.forEach(item => {
      if (item.config_key === 'max_daily_publish') {
        configs.max_daily_publish = Number(item.config_value)
      } else if (item.config_key === 'audit_timeout_hours') {
        configs.audit_timeout_hours = Number(item.config_value)
      } else if (item.config_key === 'claim_timeout_hours') {
        configs.claim_timeout_hours = Number(item.config_value)
      } else if (item.config_key === 'post_expire_days') {
        configs.post_expire_days = Number(item.config_value)
      }
    })
  } catch (e) {
    console.error(e)
  }
}

const handleConfigChange = async (key, value) => {
  try {
    await updateConfigs([{ configKey: key, configValue: value }])
    ElMessage.success('配置已更新')
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchConfigs()
})
</script>

<style lang="scss" scoped>
.configs-page {
  max-width: 800px;
  margin: 0 auto;

  .form-tip {
    margin-top: 4px;
    font-size: 12px;
    color: #999;
  }

  .help-card {
    margin-top: 24px;

    p {
      margin-bottom: 16px;
      color: #666;
    }
  }
}
</style>
