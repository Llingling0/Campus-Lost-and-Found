<template>
  <div class="configs-page">
    <div class="page-toolbar">
      <h2 class="page-title">系统设置</h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <div class="config-card">
          <div class="config-header">
            <el-icon><Setting /></el-icon>
            <span>运行参数</span>
          </div>
          <div class="config-body">
            <div class="config-item">
              <div class="config-label">
                <div class="config-title">每日最大发布数</div>
                <div class="config-desc">每个用户每天最多可发布的失物/招领信息数量</div>
              </div>
              <div class="config-control">
                <el-input-number
                  v-model="configs.max_daily_publish"
                  :min="1"
                  :max="50"
                  controls-position="right"
                  @change="handleConfigChange('max_daily_publish', configs.max_daily_publish)"
                />
              </div>
            </div>

            <div class="config-item">
              <div class="config-label">
                <div class="config-title">审核超时时间</div>
                <div class="config-desc">管理员需在此时间内完成信息审核</div>
              </div>
              <div class="config-control">
                <el-input-number
                  v-model="configs.audit_timeout_hours"
                  :min="1"
                  :max="72"
                  controls-position="right"
                  @change="handleConfigChange('audit_timeout_hours', configs.audit_timeout_hours)"
                />
                <span class="unit">小时</span>
              </div>
            </div>

            <div class="config-item">
              <div class="config-label">
                <div class="config-title">认领处理超时</div>
                <div class="config-desc">认领申请在此时间内处理，逾期自动驳回</div>
              </div>
              <div class="config-control">
                <el-input-number
                  v-model="configs.claim_timeout_hours"
                  :min="1"
                  :max="168"
                  controls-position="right"
                  @change="handleConfigChange('claim_timeout_hours', configs.claim_timeout_hours)"
                />
                <span class="unit">小时</span>
              </div>
            </div>

            <div class="config-item">
              <div class="config-label">
                <div class="config-title">信息过期天数</div>
                <div class="config-desc">信息发布后超过此天数自动标记为过期</div>
              </div>
              <div class="config-control">
                <el-input-number
                  v-model="configs.post_expire_days"
                  :min="7"
                  :max="365"
                  controls-position="right"
                  @change="handleConfigChange('post_expire_days', configs.post_expire_days)"
                />
                <span class="unit">天</span>
              </div>
            </div>

            <div class="config-item">
              <div class="config-label">
                <div class="config-title">图片上传大小限制</div>
                <div class="config-desc">单张图片上传的最大文件大小</div>
              </div>
              <div class="config-control">
                <el-select
                  v-model="configs.image_size_limit"
                  style="width: 120px"
                  @change="handleConfigChange('image_size_limit', configs.image_size_limit)"
                >
                  <el-option label="2 MB" value="2" />
                  <el-option label="5 MB" value="5" />
                  <el-option label="10 MB" value="10" />
                </el-select>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="info-card">
          <div class="info-header">
            <el-icon color="#3b82f6"><InfoFilled /></el-icon>
            <span>配置说明</span>
          </div>
          <div class="info-body">
            <p>系统运行参数用于控制失物招领平台的日常运行规则。修改后即时生效，无需重启服务。</p>
            <ul class="info-list">
              <li>发布限制可有效防止恶意刷屏</li>
              <li>超时设置确保及时处理用户请求</li>
              <li>过期机制自动清理长期未处理的信息</li>
            </ul>
          </div>
        </div>

        <div class="info-card" style="margin-top: 20px">
          <div class="info-header">
            <el-icon color="#8b5cf6"><QuestionFilled /></el-icon>
            <span>帮助中心</span>
          </div>
          <div class="info-body">
            <p>帮助中心提供用户使用指南和常见问题解答。您可以编辑帮助内容来指导用户使用本系统。</p>
            <el-button type="primary" disabled style="margin-top: 12px">编辑帮助中心</el-button>
          </div>
        </div>
      </el-col>
    </el-row>
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
  animation: fadeInUp 0.4s ease;
}

.page-toolbar {
  margin-bottom: 24px;

  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--c-text-primary);
  }
}

// --- Config Card ---
.config-card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;

  .config-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 24px;
    border-bottom: 1px solid var(--c-border-light);
    font-size: 15px;
    font-weight: 600;
    color: var(--c-text-primary);

    .el-icon {
      color: var(--c-primary);
    }
  }

  .config-body {
    padding: 8px 0;
  }

  .config-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px;
    transition: background var(--transition-fast);

    &:not(:last-child) {
      border-bottom: 1px solid var(--c-border-light);
    }

    &:hover {
      background: var(--c-bg-elevated);
    }

    .config-label {
      flex: 1;

      .config-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--c-text-primary);
        margin-bottom: 4px;
      }

      .config-desc {
        font-size: 13px;
        color: var(--c-text-tertiary);
      }
    }

    .config-control {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      margin-left: 24px;

      .unit {
        font-size: 13px;
        color: var(--c-text-tertiary);
      }
    }
  }
}

// --- Info Card ---
.info-card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;

  .info-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--c-border-light);
    font-size: 15px;
    font-weight: 600;
    color: var(--c-text-primary);
  }

  .info-body {
    padding: 20px;
    font-size: 13px;
    color: var(--c-text-secondary);
    line-height: 1.7;

    .info-list {
      margin-top: 12px;
      padding-left: 18px;

      li {
        margin-bottom: 6px;
        color: var(--c-text-tertiary);
      }
    }
  }
}
</style>
