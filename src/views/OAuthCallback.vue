<template>
  <div class="oauth-callback-page">
    <div class="callback-container">
      <!-- 授权成功，正在部署 -->
      <div v-if="status === 'deploying'" class="deploying-status">
        <div class="loading-animation">
          <el-icon class="loading-icon"><Loading /></el-icon>
        </div>
        <h2>授权成功！</h2>
        <p class="subtitle">正在自动部署您的网站...</p>
        
        <div class="deploy-steps">
          <div 
            v-for="(step, index) in deploySteps" 
            :key="index"
            class="deploy-step"
            :class="{ 
              'is-active': currentStep === index,
              'is-completed': currentStep > index 
            }"
          >
            <div class="step-icon">
              <el-icon v-if="currentStep > index" class="completed"><CircleCheck /></el-icon>
              <el-icon v-else-if="currentStep === index" class="loading"><Loading /></el-icon>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <div class="step-content">
              <div class="step-title">{{ step.title }}</div>
              <div v-if="currentStep === index" class="step-desc">{{ step.desc }}</div>
            </div>
          </div>
        </div>
        
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <p class="progress-text">{{ progress }}%</p>
      </div>
      
      <!-- 部署成功 -->
      <div v-else-if="status === 'success'" class="success-status">
        <div class="success-icon">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <h2>部署成功！</h2>
        <p class="subtitle">您的网站已成功部署到 Netlify</p>
        
        <div class="result-card">
          <div class="result-item">
            <span class="label">网站地址</span>
            <a :href="deployResult.url" target="_blank" class="url-link">
              {{ deployResult.url }}
              <el-icon><Link /></el-icon>
            </a>
          </div>
          <div class="result-item">
            <span class="label">管理后台</span>
            <a :href="deployResult.adminUrl" target="_blank" class="url-link">
              Netlify 控制台
              <el-icon><Link /></el-icon>
            </a>
          </div>
        </div>
        
        <div class="actions">
          <el-button type="primary" size="large" @click="visitSite">
            <el-icon><View /></el-icon>
            访问网站
          </el-button>
          <el-button size="large" @click="goHome">
            返回首页
          </el-button>
        </div>
      </div>
      
      <!-- 部署失败 -->
      <div v-else-if="status === 'error'" class="error-status">
        <div class="error-icon">
          <el-icon><CircleClose /></el-icon>
        </div>
        <h2>部署失败</h2>
        <p class="subtitle">{{ errorMessage }}</p>
        <el-button type="primary" size="large" @click="goHome">
          返回重试
        </el-button>
      </div>
      
      <!-- 处理中 -->
      <div v-else class="processing-status">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <h2>正在处理...</h2>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, CircleCheck, CircleClose, Link, View } from '@element-plus/icons-vue'

const status = ref('processing')
const errorMessage = ref('')
const currentStep = ref(0)
const progress = ref(0)
const deployResult = ref(null)

const deploySteps = [
  { title: '创建站点', desc: '正在创建 Netlify 站点...' },
  { title: '关联 GitHub', desc: '正在关联 GitHub 仓库...' },
  { title: '配置构建设置', desc: '正在配置构建命令和发布目录...' },
  { title: '触发部署', desc: '正在触发首次部署...' },
  { title: '等待构建完成', desc: '正在等待构建完成，请稍候...' }
]

onMounted(async () => {
  // 从 URL 参数获取 token 和 repoUrl
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')
  const repoUrl = urlParams.get('repoUrl')
  
  if (!token || !repoUrl) {
    status.value = 'error'
    errorMessage.value = '授权信息不完整，请重新尝试'
    return
  }
  
  // 保存 token
  localStorage.setItem('netlify_token', token)
  
  // 通知父窗口授权成功
  if (window.opener) {
    window.opener.postMessage({
      type: 'netlify-oauth-success',
      token,
      repoUrl
    }, window.location.origin)
    
    // 关闭当前窗口
    setTimeout(() => {
      window.close()
    }, 2000)
  } else {
    // 如果没有 opener，直接开始部署
    status.value = 'deploying'
    await startDeploy(token, repoUrl)
  }
})

async function startDeploy(token, repoUrl) {
  try {
    // 步骤 1: 创建站点
    currentStep.value = 0
    updateProgress(10)
    
    const createResponse = await fetch('http://localhost:3000/api/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, repoUrl })
    })
    
    if (!createResponse.ok) {
      const error = await createResponse.json()
      throw new Error(error.error || '创建站点失败')
    }
    
    const result = await createResponse.json()
    deployResult.value = result
    
    // 步骤 2-4: 模拟进度
    for (let i = 1; i <= 3; i++) {
      currentStep.value = i
      updateProgress(10 + i * 15)
      await delay(1000)
    }
    
    // 步骤 5: 等待构建完成
    currentStep.value = 4
    await waitForDeploy(token, result.siteId)
    
    status.value = 'success'
    
    // 保存到历史记录
    saveToHistory(repoUrl, result)
    
  } catch (error) {
    console.error('部署失败:', error)
    status.value = 'error'
    errorMessage.value = error.message || '部署失败，请稍后重试'
  }
}

async function waitForDeploy(token, siteId) {
  const maxAttempts = 60
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`http://localhost:3000/api/deploy-status?token=${token}&siteId=${siteId}`)
    const data = await response.json()
    
    updateProgress(55 + (i / maxAttempts) * 45)
    
    if (data.status === 'ready') {
      if (data.deployUrl) {
        deployResult.value.url = data.deployUrl
      }
      return
    } else if (data.status === 'error') {
      throw new Error('构建失败')
    }
    
    await delay(5000)
  }
  
  throw new Error('构建超时')
}

function updateProgress(value) {
  progress.value = Math.min(Math.round(value), 99)
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function saveToHistory(repoUrl, result) {
  const history = JSON.parse(localStorage.getItem('deploy_history') || '[]')
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
  const repoName = match ? `${match[1]}/${match[2].replace(/\.git$/, '')}` : repoUrl
  
  history.unshift({
    url: repoUrl,
    repoName,
    deployUrl: result.url,
    timestamp: new Date().toISOString(),
    status: 'success',
    isNetlify: true
  })
  
  localStorage.setItem('deploy_history', JSON.stringify(history.slice(0, 10)))
}

function visitSite() {
  if (deployResult.value?.url) {
    window.open(deployResult.value.url, '_blank')
  }
}

function goHome() {
  window.location.href = '/'
}
</script>

<style scoped lang="scss">
.oauth-callback-page {
  min-height: 100vh;
  background: $gradient-background;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.callback-container {
  width: 100%;
  max-width: 600px;
}

// 部署中状态
.deploying-status {
  text-align: center;
  padding: 40px;
  background: $gradient-card;
  border: 1px solid $border-color;
  border-radius: $radius-xl;
  backdrop-filter: blur(10px);
}

.loading-animation {
  margin-bottom: 24px;
}

.loading-icon {
  font-size: 48px;
  color: $primary-color;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

h2 {
  color: $text-primary;
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  margin: 0 0 8px;
}

.subtitle {
  color: $text-secondary;
  font-size: $font-size-base;
  margin: 0 0 32px;
}

.deploy-steps {
  text-align: left;
  margin-bottom: 32px;
}

.deploy-step {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
}

.step-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-muted;
  font-size: 14px;
  font-weight: $font-weight-bold;
  flex-shrink: 0;
  
  .el-icon {
    font-size: 16px;
  }
  
  .completed {
    color: $success-color;
  }
  
  .loading {
    color: $primary-color;
    animation: rotate 2s linear infinite;
  }
}

.deploy-step.is-active .step-icon {
  background: rgba(99, 102, 241, 0.2);
  color: $primary-light;
}

.deploy-step.is-completed .step-icon {
  background: rgba(34, 197, 94, 0.2);
}

.step-content {
  flex: 1;
  padding-top: 4px;
}

.step-title {
  color: $text-secondary;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
}

.deploy-step.is-active .step-title {
  color: $text-primary;
}

.step-desc {
  color: $text-muted;
  font-size: $font-size-sm;
  margin-top: 4px;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: $radius-full;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: $gradient-primary;
  border-radius: $radius-full;
  transition: width 0.3s ease;
}

.progress-text {
  color: $primary-light;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  margin: 0;
}

// 成功状态
.success-status {
  text-align: center;
  padding: 40px;
  background: linear-gradient(145deg, rgba(34, 197, 94, 0.1) 0%, rgba(20, 20, 35, 0.9) 100%);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: $radius-xl;
  backdrop-filter: blur(10px);
}

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: rgba(34, 197, 94, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .el-icon {
    font-size: 40px;
    color: $success-color;
  }
}

.result-card {
  background: rgba(0, 0, 0, 0.2);
  border-radius: $radius-lg;
  padding: 20px;
  margin: 24px 0;
  text-align: left;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
}

.label {
  color: $text-muted;
  font-size: $font-size-sm;
}

.url-link {
  color: $primary-light;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: $font-size-sm;
  
  &:hover {
    text-decoration: underline;
  }
  
  .el-icon {
    font-size: 14px;
  }
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

// 错误状态
.error-status {
  text-align: center;
  padding: 40px;
  background: linear-gradient(145deg, rgba(239, 68, 68, 0.1) 0%, rgba(20, 20, 35, 0.9) 100%);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: $radius-xl;
  backdrop-filter: blur(10px);
}

.error-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: rgba(239, 68, 68, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .el-icon {
    font-size: 40px;
    color: $error-color;
  }
}

// 处理中状态
.processing-status {
  text-align: center;
  padding: 40px;
  
  .loading-icon {
    font-size: 48px;
    color: $primary-color;
    animation: rotate 2s linear infinite;
    margin-bottom: 16px;
  }
}
</style>
