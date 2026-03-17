<template>
  <div class="deploy-form">
    <div class="input-wrapper" :class="{ 'has-error': store.inputError }">
      <el-input
        v-model="inputValue"
        placeholder="https://github.com/username/repo"
        size="large"
        class="repo-input"
        :disabled="store.isDeploying"
        @keyup.enter="handleNetlifyDeploy"
        @input="handleInput"
      >
        <template #prefix>
          <el-icon class="input-icon"><Link /></el-icon>
        </template>
        <template #suffix v-if="inputValue">
          <el-icon class="clear-icon" @click="clearInput"><CircleClose /></el-icon>
        </template>
      </el-input>
      
      <el-button
        type="primary"
        size="large"
        class="deploy-btn"
        :loading="store.isDeploying"
        :disabled="!canDeploy"
        @click="handleNetlifyDeploy"
      >
        <template #icon>
          <el-icon v-if="!store.isDeploying"><Promotion /></el-icon>
        </template>
        {{ store.isDeploying ? '部署中...' : '🚀 一键部署' }}
      </el-button>
    </div>
    
    <!-- 错误提示 -->
    <transition name="fade">
      <div v-if="store.inputError" class="error-message">
        <el-icon><Warning /></el-icon>
        <span>{{ store.inputError }}</span>
      </div>
    </transition>
    
    <!-- 频率限制提示 -->
    <div v-if="store.isRateLimited && !store.inputError" class="rate-limit-info">
      <el-icon><Clock /></el-icon>
      <span>剩余请求次数: {{ store.rateLimitInfo.remaining }}/10</span>
    </div>
    
    <!-- 输入示例 -->
    <div class="input-examples">
      <span class="example-label">示例:</span>
      <span 
        v-for="example in examples" 
        :key="example"
        class="example-item"
        @click="useExample(example)"
      >
        {{ example }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useDeployStore } from '@/stores/deployStore.js'
import { Link, CircleClose, Promotion, Warning, Clock } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

const store = useDeployStore()
const inputValue = ref('')

// 示例地址
const examples = [
  'facebook/react',
  'vuejs/vue',
  'microsoft/vscode'
]

// 监听 store 中的 URL 变化
watch(() => store.repoUrl, (newVal) => {
  if (newVal !== inputValue.value) {
    inputValue.value = newVal
  }
})

// 是否可以部署
const canDeploy = computed(() => {
  return store.canDeploy && !store.isRateLimited
})

// 处理输入
function handleInput(value) {
  store.setRepoUrl(value)
}

// 清空输入
function clearInput() {
  inputValue.value = ''
  store.clearInput()
}

// 使用示例
function useExample(example) {
  const fullUrl = `https://github.com/${example}`
  inputValue.value = fullUrl
  store.setRepoUrl(fullUrl)
}

// Netlify 部署（OAuth 流程）
async function handleNetlifyDeploy() {
  if (!canDeploy.value) return
  
  // 检查是否已授权
  const token = localStorage.getItem('netlify_token')
  if (token) {
    // 已有 token，直接部署
    await store.startNetlifyDeployWithToken(token)
    return
  }
  
  // 没有 token，启动 OAuth 流程
  try {
    const response = await fetch(`http://localhost:3000/auth/netlify?repoUrl=${encodeURIComponent(store.repoUrl)}`)
    
    if (!response.ok) {
      throw new Error('后端服务未启动')
    }
    
    const data = await response.json()
    
    if (data.authUrl) {
      // 打开授权窗口
      window.open(
        data.authUrl,
        'Netlify OAuth',
        'width=800,height=600,scrollbars=yes'
      )
      
      // 监听授权完成消息
      window.addEventListener('message', handleOAuthMessage)
    }
  } catch (error) {
    console.error('启动授权失败:', error)
    
    // 提示用户需要先启动后端服务
    if (error.message === '后端服务未启动' || error.message.includes('fetch')) {
      ElMessageBox.alert(
        '自动部署需要启动后端服务。<br><br>' +
        '请在终端运行以下命令启动后端：<br>' +
        '<code>cd server && npm run dev</code><br><br>' +
        '或者继续使用手动部署模式。',
        '后端服务未启动',
        {
          confirmButtonText: '继续手动部署',
          cancelButtonText: '取消',
          showCancelButton: true,
          dangerouslyUseHTMLString: true,
          callback: (action) => {
            if (action === 'confirm') {
              // 降级到手动部署
              store.startNetlifyDeploy()
            }
          }
        }
      )
    } else {
      // 其他错误，降级到手动部署
      await store.startNetlifyDeploy()
    }
  }
}

// 处理 OAuth 回调消息
function handleOAuthMessage(event) {
  if (event.origin !== window.location.origin) return
  
  if (event.data.type === 'netlify-oauth-success') {
    const { token } = event.data
    localStorage.setItem('netlify_token', token)
    window.removeEventListener('message', handleOAuthMessage)
    
    // 自动开始部署
    store.startNetlifyDeployWithToken(token)
  }
}
</script>

<style scoped lang="scss">
.deploy-form {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: stretch;
  
  @media (max-width: 640px) {
    flex-direction: column;
  }
  
  &.has-error {
    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px $error-color inset;
    }
  }
}

.repo-input {
  flex: 1;
  
  :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid $border-color;
    border-radius: $radius-lg;
    padding: 12px 16px;
    box-shadow: none;
    transition: all $transition-base;
    
    &:hover, &.is-focus {
      background: rgba(255, 255, 255, 0.08);
      border-color: $border-color-hover;
      box-shadow: 0 0 0 1px $primary-color;
    }
  }
  
  :deep(.el-input__inner) {
    color: $text-primary;
    font-size: $font-size-base;
    height: 24px;
    line-height: 24px;
    
    &::placeholder {
      color: $text-muted;
    }
  }
  
  :deep(.el-input__prefix-inner) {
    color: $text-muted;
  }
}

.input-icon {
  font-size: 18px;
  color: $text-muted;
}

.clear-icon {
  font-size: 16px;
  color: $text-muted;
  cursor: pointer;
  transition: color $transition-fast;
  
  &:hover {
    color: $text-primary;
  }
}

.deploy-btn {
  min-width: 140px;
  height: auto;
  padding: 12px 24px;
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  border-radius: $radius-lg;
  background: $gradient-primary;
  border: none;
  transition: all $transition-base;
  
  @media (max-width: 640px) {
    width: 100%;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: $shadow-glow;
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  :deep(.el-icon) {
    font-size: 18px;
    margin-right: 6px;
  }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: $radius-md;
  color: $error-color;
  font-size: $font-size-sm;
  
  .el-icon {
    font-size: 16px;
    flex-shrink: 0;
  }
}

.rate-limit-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 16px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: $radius-md;
  color: $info-color;
  font-size: $font-size-sm;
  
  .el-icon {
    font-size: 14px;
  }
}

.input-examples {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
  
  .example-label {
    color: $text-muted;
    font-size: $font-size-sm;
  }
  
  .example-item {
    padding: 4px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid $border-color;
    border-radius: $radius-full;
    color: $text-secondary;
    font-size: $font-size-sm;
    cursor: pointer;
    transition: all $transition-fast;
    
    &:hover {
      background: rgba(99, 102, 241, 0.2);
      border-color: $primary-color;
      color: $primary-light;
    }
  }
}

// 过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
