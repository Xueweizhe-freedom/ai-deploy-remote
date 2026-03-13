<template>
  <div v-if="store.deployHistory.length > 0" class="deploy-history">
    <div class="history-header">
      <h3 class="history-title">
        <el-icon><Clock /></el-icon>
        部署历史
      </h3>
      <el-button 
        link 
        type="danger" 
        size="small"
        @click="confirmClear"
      >
        <el-icon><Delete /></el-icon>
        清空
      </el-button>
    </div>
    
    <div class="history-list">
      <div 
        v-for="item in store.deployHistory" 
        :key="item.timestamp"
        class="history-item"
        :class="{ 'is-error': item.status === 'error' }"
      >
        <div class="history-icon">
          <el-icon v-if="item.status === 'success'" class="success-icon"><CircleCheck /></el-icon>
          <el-icon v-else class="error-icon"><CircleClose /></el-icon>
        </div>
        
        <div class="history-content">
          <div class="history-repo">{{ item.repoName }}</div>
          <div class="history-url">{{ item.url }}</div>
          <div class="history-time">{{ formatTime(item.timestamp) }}</div>
        </div>
        
        <div class="history-actions">
          <el-button 
            v-if="item.status === 'success' && item.deployUrl"
            link 
            type="primary"
            @click="visitUrl(item.deployUrl)"
          >
            <el-icon><View /></el-icon>
          </el-button>
          <el-button 
            link 
            type="primary"
            @click="redeploy(item)"
          >
            <el-icon><RefreshRight /></el-icon>
          </el-button>
          <el-button 
            link 
            @click="copyUrl(item.url)"
          >
            <el-icon><CopyDocument /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDeployStore } from '@/stores/deployStore.js'
import { 
  Clock, 
  Delete, 
  CircleCheck, 
  CircleClose, 
  View, 
  RefreshRight,
  CopyDocument 
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const store = useDeployStore()

// 格式化时间
function formatTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diff = now - date
  
  // 小于1分钟
  if (diff < 60000) {
    return '刚刚'
  }
  
  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`
  }
  
  // 小于24小时
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`
  }
  
  // 小于7天
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)} 天前`
  }
  
  // 默认显示日期
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}

// 确认清空
async function confirmClear() {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有部署历史记录吗？',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    store.clearHistory()
    ElMessage.success('历史记录已清空')
  } catch {
    // 用户取消
  }
}

// 重新部署
async function redeploy(item) {
  await store.redeployFromHistory(item)
}

// 访问链接
function visitUrl(url) {
  window.open(url, '_blank')
}

// 复制链接
async function copyUrl(url) {
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('链接已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}
</script>

<style scoped lang="scss">
.deploy-history {
  width: 100%;
  max-width: 640px;
  margin: 32px auto 0;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.history-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: $text-primary;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  margin: 0;
  
  .el-icon {
    font-size: 20px;
    color: $primary-light;
  }
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  transition: all $transition-base;
  
  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: $border-color-hover;
  }
  
  &.is-error {
    border-left: 3px solid $error-color;
    
    .history-icon {
      background: rgba(239, 68, 68, 0.1);
    }
  }
}

.history-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(34, 197, 94, 0.1);
  
  .el-icon {
    font-size: 18px;
  }
  
  .success-icon {
    color: $success-color;
  }
  
  .error-icon {
    color: $error-color;
  }
}

.history-content {
  flex: 1;
  min-width: 0;
}

.history-repo {
  color: $text-primary;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-url {
  color: $text-muted;
  font-size: $font-size-xs;
  font-family: $font-family-mono;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-time {
  color: $text-muted;
  font-size: $font-size-xs;
  opacity: 0.7;
}

.history-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  
  .el-button {
    padding: 6px;
    
    .el-icon {
      font-size: 16px;
    }
  }
}
</style>
