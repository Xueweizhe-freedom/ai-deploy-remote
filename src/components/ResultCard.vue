<template>
  <div v-if="store.isSuccess && store.deployResult" class="result-card">
    <!-- 项目信息 -->
    <div class="project-info">
      <div class="project-icon">
        <el-icon><FolderOpened /></el-icon>
      </div>
      <div class="project-details">
        <h4 class="project-name">{{ store.deployResult.repoInfo?.fullName }}</h4>
        <p class="project-desc">{{ store.deployResult.repoInfo?.description || '暂无描述' }}</p>
        <div class="project-meta">
          <span v-if="store.deployResult.projectType?.framework" class="meta-tag framework">
            {{ store.deployResult.projectType.framework }}
          </span>
          <span v-if="store.deployResult.projectType?.buildTool" class="meta-tag buildtool">
            {{ store.deployResult.projectType.buildTool }}
          </span>
          <span class="meta-tag stars">
            <el-icon><Star /></el-icon>
            {{ formatStars(store.deployResult.repoInfo?.stars) }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- 访问地址 -->
    <div class="deploy-url-section">
      <div class="url-label">访问地址</div>
      <div class="url-box">
        <a 
          :href="store.deployResult.url" 
          target="_blank" 
          class="url-link"
        >
          {{ store.deployResult.url }}
        </a>
        <el-button 
          type="primary" 
          class="copy-btn"
          @click="copyUrl"
        >
          <el-icon><CopyDocument /></el-icon>
          {{ copied ? '已复制' : '复制' }}
        </el-button>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button 
        type="primary" 
        size="large"
        class="visit-btn"
        @click="visitSite"
      >
        <el-icon><View /></el-icon>
        打开网站
      </el-button>
      <el-button 
        v-if="store.deployResult.isNetlify"
        size="large"
        class="setup-btn"
        @click="openNetlifyDashboard"
      >
        <el-icon><Cloudy /></el-icon>
        Netlify 管理
      </el-button>
      <el-button 
        v-else-if="store.deployResult.isVercel"
        size="large"
        class="setup-btn"
        @click="openVercelDashboard"
      >
        <el-icon><Cloudy /></el-icon>
        Vercel 管理
      </el-button>
      <el-button 
        v-else
        size="large"
        class="setup-btn"
        @click="openSettings"
      >
        <el-icon><Setting /></el-icon>
        Pages 设置
      </el-button>
    </div>
    
    <!-- Netlify 提示 -->
    <div v-if="store.deployResult.isNetlify" class="netlify-notice">
      <el-icon><CircleCheck /></el-icon>
      <div class="notice-content">
        <p class="notice-title">部署成功</p>
        <p class="notice-desc">
          您的网站已部署到 Netlify，会自动绑定域名并启用 HTTPS。
        </p>
      </div>
    </div>
    
    <!-- Vercel 提示 -->
    <div v-else-if="store.deployResult.isVercel && !store.deployResult.pending" class="vercel-notice">
      <el-icon><CircleCheck /></el-icon>
      <div class="notice-content">
        <p class="notice-title">Vercel 部署成功</p>
        <p class="notice-desc">
          您的网站已部署到 Vercel，会自动绑定域名并启用 HTTPS。
        </p>
      </div>
    </div>
    
    <!-- GitHub Pages 提示 -->
    <div v-else-if="!store.deployResult.pagesInfo?.enabled" class="setup-notice">
      <el-icon><InfoFilled /></el-icon>
      <div class="notice-content">
        <p class="notice-title">需要手动启用 GitHub Pages</p>
        <p class="notice-desc">
          首次部署需要在仓库设置中手动启用 GitHub Pages 功能。
          <a :href="store.deployResult.setupUrl" target="_blank">前往设置</a>
        </p>
      </div>
    </div>
    
    <!-- Vercel 部署中提示 -->
    <div v-if="store.deployResult.isVercel && store.deployResult.pending" class="vercel-pending">
      <el-icon><Loading /></el-icon>
      <div class="notice-content">
        <p class="notice-title">Vercel 正在部署中</p>
        <p class="notice-desc">
          项目较大，部署需要较长时间。您可以点击"打开网站"查看进度，通常 2-5 分钟后可访问。
        </p>
      </div>
    </div>
    
    <!-- 部署时间 -->
    <div class="deploy-time">
      <el-icon><Clock /></el-icon>
      <span>部署于 {{ formatTime(store.deployResult.deployedAt) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useDeployStore } from '@/stores/deployStore.js'
import { 
  FolderOpened, 
  Star, 
  CopyDocument, 
  View, 
  Setting, 
  InfoFilled,
  Clock,
  Cloudy,
  CircleCheck,
  Loading
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const store = useDeployStore()
const copied = ref(false)

// 格式化星标数
function formatStars(stars) {
  if (!stars) return '0'
  if (stars >= 1000) {
    return (stars / 1000).toFixed(1) + 'k'
  }
  return stars.toString()
}

// 格式化时间
function formatTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 复制地址
async function copyUrl() {
  try {
    await navigator.clipboard.writeText(store.deployResult.url)
    copied.value = true
    ElMessage.success('链接已复制到剪贴板')
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    ElMessage.error('复制失败')
  }
}

// 访问网站
function visitSite() {
  window.open(store.deployResult.url, '_blank')
}

// 打开设置页面
function openSettings() {
  window.open(store.deployResult.setupUrl, '_blank')
}

// 打开 Vercel 管理页面
function openVercelDashboard() {
  window.open(`https://vercel.com/dashboard`, '_blank')
}

// 打开 Netlify 管理页面
function openNetlifyDashboard() {
  if (store.deployResult.adminUrl) {
    window.open(store.deployResult.adminUrl, '_blank')
  } else {
    window.open('https://app.netlify.com/', '_blank')
  }
}
</script>

<style scoped lang="scss">
.result-card {
  width: 100%;
  max-width: 640px;
  margin: 32px auto 0;
  background: $gradient-card;
  border: 1px solid $border-color;
  border-radius: $radius-xl;
  padding: 24px;
  backdrop-filter: blur(10px);
}

// 项目信息
.project-info {
  display: flex;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid $border-color;
  margin-bottom: 20px;
}

.project-icon {
  width: 48px;
  height: 48px;
  background: $gradient-primary;
  border-radius: $radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  .el-icon {
    font-size: 24px;
    color: $text-primary;
  }
}

.project-details {
  flex: 1;
  min-width: 0;
}

.project-name {
  color: $text-primary;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  margin: 0 0 6px;
  word-break: break-all;
}

.project-desc {
  color: $text-secondary;
  font-size: $font-size-sm;
  margin: 0 0 10px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: $radius-full;
  font-size: $font-size-xs;
  color: $text-secondary;
  
  &.framework {
    background: rgba(99, 102, 241, 0.15);
    color: $primary-light;
  }
  
  &.buildtool {
    background: rgba(139, 92, 246, 0.15);
    color: #c4b5fd;
  }
  
  &.stars {
    background: rgba(245, 158, 11, 0.15);
    color: $warning-color;
  }
  
  .el-icon {
    font-size: 12px;
  }
}

// 访问地址
.deploy-url-section {
  margin-bottom: 20px;
}

.url-label {
  color: $text-muted;
  font-size: $font-size-sm;
  margin-bottom: 8px;
}

.url-box {
  display: flex;
  gap: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: 12px 16px;
  
  @media (max-width: 640px) {
    flex-direction: column;
  }
}

.url-link {
  flex: 1;
  color: $primary-light;
  font-size: $font-size-base;
  font-family: $font-family-mono;
  text-decoration: none;
  word-break: break-all;
  transition: color $transition-fast;
  
  &:hover {
    color: $primary-color;
    text-decoration: underline;
  }
}

.copy-btn {
  flex-shrink: 0;
  
  :deep(.el-icon) {
    margin-right: 4px;
  }
}

// 操作按钮
.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  
  @media (max-width: 640px) {
    flex-direction: column;
  }
  
  .el-button {
    flex: 1;
    
    :deep(.el-icon) {
      margin-right: 6px;
    }
  }
}

.visit-btn {
  background: $gradient-primary;
  border: none;
  
  &:hover {
    box-shadow: $shadow-glow;
  }
}

.setup-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid $border-color;
  color: $text-secondary;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: $border-color-hover;
    color: $text-primary;
  }
}

// 提示信息
.setup-notice {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: $radius-lg;
  margin-bottom: 16px;
  
  .el-icon {
    font-size: 20px;
    color: $warning-color;
    flex-shrink: 0;
  }
}

.notice-content {
  flex: 1;
}

.notice-title {
  color: $warning-color;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  margin: 0 0 4px;
}

.notice-desc {
  color: $text-secondary;
  font-size: $font-size-xs;
  margin: 0;
  line-height: 1.5;
  
  a {
    color: $primary-light;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

// 部署时间
.deploy-time {
  display: flex;
  align-items: center;
  gap: 8px;
  color: $text-muted;
  font-size: $font-size-xs;
  
  .el-icon {
    font-size: 14px;
  }
}
</style>
