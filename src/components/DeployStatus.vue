<template>
  <div v-if="store.isDeploying || store.isSuccess || store.isError" class="deploy-status">
    <!-- 部署中状态 -->
    <div v-if="store.isDeploying" class="status-deploying">
      <!-- 进度条 -->
      <div class="progress-section">
        <div class="progress-header">
          <span class="step-indicator">步骤 {{ store.currentStep }}/{{ store.totalSteps }}</span>
          <span class="progress-percent">{{ store.deployProgress }}%</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill"
            :style="{ width: `${store.deployProgress}%` }"
          ></div>
        </div>
      </div>
      
      <!-- 步骤列表 -->
      <div class="steps-list">
        <div 
          v-for="(step, index) in deploySteps" 
          :key="index"
          class="step-item"
          :class="{
            'is-active': index + 1 === store.currentStep,
            'is-completed': index + 1 < store.currentStep,
            'is-pending': index + 1 > store.currentStep
          }"
        >
          <div class="step-icon">
            <el-icon v-if="index + 1 < store.currentStep" class="completed-icon"><Check /></el-icon>
            <el-icon v-else-if="index + 1 === store.currentStep" class="loading-icon"><Loading /></el-icon>
            <span v-else class="step-number">{{ index + 1 }}</span>
          </div>
          <div class="step-content">
            <div class="step-title">{{ step.title }}</div>
            <div v-if="index + 1 === store.currentStep" class="step-desc">
              {{ store.stepMessage || step.desc }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 成功状态 -->
    <div v-else-if="store.isSuccess" class="status-success">
      <div class="success-icon">
        <el-icon><CircleCheck /></el-icon>
      </div>
      <h3 class="success-title">
        {{ store.deployResult?.needsManualSetup ? '站点创建成功' : '部署成功！' }}
      </h3>
      <p class="success-desc">
        {{ getDeployPlatformText() }}
      </p>
      <div v-if="store.deployResult?.needsManualSetup" class="manual-setup-guide">
        <div class="setup-card">
          <div class="setup-header">
            <el-icon class="setup-icon"><InfoFilled /></el-icon>
            <span class="setup-title">请按以下步骤完成部署</span>
          </div>
          <div class="setup-steps">
            <div class="step-item">
              <span class="step-number">1</span>
              <span class="step-text">
                <a :href="store.deployResult?.adminUrl" target="_blank" class="step-link">
                  点击进入 Netlify 控制台
                  <el-icon><Link /></el-icon>
                </a>
              </span>
            </div>
            <div class="step-item">
              <span class="step-number">2</span>
              <span class="step-text">
                点击左侧 <strong>"Project configuration"</strong>（项目配置）
              </span>
            </div>
            <div class="step-item">
              <span class="step-number">3</span>
              <span class="step-text">
                选择 <strong>"Build & deploy"</strong>（构建和部署）
              </span>
            </div>
            <div class="step-item">
              <span class="step-number">4</span>
              <span class="step-text">
                点击 <strong>"Link site to Git"</strong> 或 <strong>"Configure"</strong>
              </span>
            </div>
            <div class="step-item">
              <span class="step-number">5</span>
              <span class="step-text">
                选择 GitHub，然后选择仓库：
                <a :href="`https://github.com/${store.deployResult?.repoInfo?.fullName}`" target="_blank" class="step-link">
                  {{ store.deployResult?.repoInfo?.fullName }}
                  <el-icon><Link /></el-icon>
                </a>
              </span>
            </div>
            <div class="step-item">
              <span class="step-number">6</span>
              <span class="step-text">
                配置构建命令：<code>npm run build</code>
                <el-button 
                  link 
                  type="primary" 
                  size="small"
                  class="copy-btn"
                  @click="copyText('npm run build')"
                >
                  复制
                </el-button>
              </span>
            </div>
            <div class="step-item">
              <span class="step-number">7</span>
              <span class="step-text">
                配置发布目录：<code>dist</code>
                <el-button 
                  link 
                  type="primary" 
                  size="small"
                  class="copy-btn"
                  @click="copyText('dist')"
                >
                  复制
                </el-button>
              </span>
            </div>
            <div class="step-item">
              <span class="step-number">8</span>
              <span class="step-text">
                点击 <strong>"Deploy site"</strong> 或 <strong>"Save"</strong> 开始部署
              </span>
            </div>
          </div>
          <div class="setup-tip">
            <el-icon><Warning /></el-icon>
            <span>部署完成后，您的网站将在几分钟内上线</span>
          </div>
        </div>
      </div>
      <div v-else-if="store.deployResult?.isVercel || store.deployResult?.isNetlify" class="platform-badge">
        <el-tag type="success" effect="dark" size="large">
          <el-icon><Cloudy /></el-icon>
          {{ store.deployResult?.isNetlify ? 'Netlify 部署' : 'Vercel 部署' }}
        </el-tag>
      </div>
    </div>
    
    <!-- 后端项目不支持提示 -->
    <div v-else-if="store.isError && store.projectType?.isBackend" class="status-error backend-notice">
      <div class="error-icon">
        <el-icon><Warning /></el-icon>
      </div>
      <h3 class="error-title">不支持后端项目</h3>
      <p class="error-desc">
        检测到该项目包含后端代码，本工具仅支持部署纯前端项目。
      </p>
      <div class="backend-indicators" v-if="store.projectType?.backendIndicators?.length">
        <p class="indicators-title">检测到的后端特征：</p>
        <div class="indicators-list">
          <el-tag 
            v-for="(indicator, index) in store.projectType.backendIndicators.slice(0, 5)" 
            :key="index"
            type="warning"
            size="small"
            class="indicator-tag"
          >
            {{ indicator }}
          </el-tag>
        </div>
      </div>
      <div class="suggestion">
        <p>建议：</p>
        <ul>
          <li>如果是全栈项目，请将前端部分分离出来单独部署</li>
          <li>后端项目建议使用 Vercel、Railway 或云服务器部署</li>
          <li>纯静态网站请确保包含 index.html 文件</li>
        </ul>
      </div>
      <el-button type="primary" @click="store.resetDeploy">
        返回
      </el-button>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="store.isError" class="status-error">
      <div class="error-icon">
        <el-icon><CircleClose /></el-icon>
      </div>
      <h3 class="error-title">部署失败</h3>
      <p class="error-desc">{{ store.deployError }}</p>
      <el-button type="primary" @click="store.resetDeploy">
        重试
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { useDeployStore } from '@/stores/deployStore.js'
import { Check, Loading, CircleCheck, CircleClose, Warning, Cloudy, InfoFilled, Link } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const store = useDeployStore()

// 复制文本到剪贴板
function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success(`已复制: ${text}`)
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 获取部署平台文本
function getDeployPlatformText() {
  if (store.deployResult?.needsManualSetup) {
    return 'Netlify 站点已创建，请按下方步骤完成 GitHub 集成和部署'
  }
  if (store.deployResult?.isNetlify) {
    return '您的网站已成功部署到 Netlify，现在可以访问了'
  }
  if (store.deployResult?.isVercel) {
    return '您的网站已成功部署到 Vercel'
  }
  return '您的网站已成功部署到 GitHub Pages'
}

// 部署步骤定义
const deploySteps = [
  { title: '解析仓库', desc: '解析 GitHub 仓库地址...' },
  { title: '获取信息', desc: '获取仓库基本信息...' },
  { title: '检测项目', desc: '检测项目类型和配置...' },
  { title: '检查 Pages', desc: '检查 GitHub Pages 状态...' },
  { title: '生成配置', desc: '生成部署配置...' },
  { title: '完成部署', desc: '部署完成！' }
]
</script>

<style scoped lang="scss">
.deploy-status {
  width: 100%;
  max-width: 640px;
  margin: 32px auto 0;
}

// 部署中状态
.status-deploying {
  background: $gradient-card;
  border: 1px solid $border-color;
  border-radius: $radius-xl;
  padding: 24px;
  backdrop-filter: blur(10px);
}

.progress-section {
  margin-bottom: 24px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  
  .step-indicator {
    color: $text-secondary;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
  }
  
  .progress-percent {
    color: $primary-light;
    font-size: $font-size-sm;
    font-weight: $font-weight-bold;
  }
}

.progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: $radius-full;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: $gradient-primary;
  border-radius: $radius-full;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  
  &.is-active {
    .step-icon {
      background: $gradient-primary;
      border-color: transparent;
    }
    
    .step-title {
      color: $text-primary;
      font-weight: $font-weight-semibold;
    }
  }
  
  &.is-completed {
    .step-icon {
      background: rgba(34, 197, 94, 0.2);
      border-color: $success-color;
    }
    
    .step-title {
      color: $success-color;
    }
  }
  
  &.is-pending {
    opacity: 0.5;
    
    .step-icon {
      background: transparent;
      border-color: $border-color;
    }
  }
}

.step-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all $transition-base;
}

.completed-icon {
  color: $success-color;
  font-size: 16px;
}

.loading-icon {
  color: $text-primary;
  font-size: 16px;
  animation: spin 1s linear infinite;
}

.step-number {
  color: $text-muted;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
}

.step-content {
  flex: 1;
  padding-top: 4px;
}

.step-title {
  color: $text-secondary;
  font-size: $font-size-sm;
  transition: color $transition-base;
}

.step-desc {
  color: $text-muted;
  font-size: $font-size-xs;
  margin-top: 4px;
}

// 成功状态
.status-success {
  text-align: center;
  padding: 32px;
  background: linear-gradient(145deg, rgba(34, 197, 94, 0.1) 0%, rgba(20, 20, 35, 0.9) 100%);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: $radius-xl;
  backdrop-filter: blur(10px);
}

.success-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: rgba(34, 197, 94, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .el-icon {
    font-size: 32px;
    color: $success-color;
  }
}

.success-title {
  color: $success-color;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  margin: 0 0 8px;
}

.success-desc {
  color: $text-secondary;
  font-size: $font-size-sm;
  margin: 0 0 20px;
}

// 手动配置引导
.manual-setup-guide {
  margin-top: 20px;
  text-align: left;
}

.setup-card {
  background: rgba(30, 30, 50, 0.8);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: $radius-lg;
  padding: 20px;
}

.setup-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.setup-icon {
  font-size: 20px;
  color: $info-color;
}

.setup-title {
  color: $text-primary;
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
}

.setup-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.step-number {
  width: 24px;
  height: 24px;
  background: $gradient-primary;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: $font-weight-bold;
  flex-shrink: 0;
}

.step-text {
  color: $text-secondary;
  font-size: $font-size-sm;
  line-height: 1.6;
  padding-top: 2px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  
  strong {
    color: $primary-light;
  }
  
  code {
    background: rgba(99, 102, 241, 0.2);
    padding: 2px 8px;
    border-radius: $radius-sm;
    color: $primary-light;
    font-family: $font-family-mono;
    font-size: 12px;
  }
}

.step-link {
  color: $primary-light;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all $transition-fast;
  
  &:hover {
    color: $primary-color;
    text-decoration: underline;
  }
  
  .el-icon {
    font-size: 14px;
  }
}

.copy-btn {
  margin-left: 4px;
  font-size: 12px;
}

.setup-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: $warning-color;
  font-size: $font-size-sm;
  
  .el-icon {
    font-size: 16px;
  }
}

// 错误状态
.status-error {
  text-align: center;
  padding: 32px;
  background: linear-gradient(145deg, rgba(239, 68, 68, 0.1) 0%, rgba(20, 20, 35, 0.9) 100%);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: $radius-xl;
  backdrop-filter: blur(10px);
}

.error-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: rgba(239, 68, 68, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .el-icon {
    font-size: 32px;
    color: $error-color;
  }
}

.error-title {
  color: $error-color;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  margin: 0 0 8px;
}

.error-desc {
  color: $text-secondary;
  font-size: $font-size-sm;
  margin: 0 0 20px;
  line-height: 1.6;
}

// 后端项目提示特殊样式
.backend-notice {
  background: linear-gradient(145deg, rgba(245, 158, 11, 0.1) 0%, rgba(20, 20, 35, 0.9) 100%);
  border: 1px solid rgba(245, 158, 11, 0.3);
  
  .error-icon {
    background: rgba(245, 158, 11, 0.2);
    
    .el-icon {
      color: $warning-color;
    }
  }
  
  .error-title {
    color: $warning-color;
  }
}

.backend-indicators {
  margin: 20px 0;
  text-align: left;
  
  .indicators-title {
    color: $text-secondary;
    font-size: $font-size-sm;
    margin-bottom: 12px;
    text-align: center;
  }
  
  .indicators-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }
  
  .indicator-tag {
    background: rgba(245, 158, 11, 0.15);
    border-color: rgba(245, 158, 11, 0.3);
    color: $warning-color;
  }
}

.suggestion {
  margin: 20px 0;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: $radius-lg;
  text-align: left;
  
  p {
    color: $text-primary;
    font-weight: $font-weight-semibold;
    margin: 0 0 10px;
  }
  
  ul {
    margin: 0;
    padding-left: 20px;
    color: $text-secondary;
    font-size: $font-size-sm;
    line-height: 1.8;
  }
  
  li {
    margin-bottom: 4px;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
