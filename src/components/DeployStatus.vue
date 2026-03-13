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
      <h3 class="success-title">部署成功！</h3>
      <p class="success-desc">您的网站已成功部署到 GitHub Pages</p>
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
import { Check, Loading, CircleCheck, CircleClose } from '@element-plus/icons-vue'

const store = useDeployStore()

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
  margin: 0;
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

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
