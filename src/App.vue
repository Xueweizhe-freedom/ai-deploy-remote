<template>
  <el-config-provider :locale="zhCn">
    <Home v-if="!isOAuthCallback" />
    <OAuthCallback v-else />
  </el-config-provider>
</template>

<script setup>
import { computed } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import Home from '@/views/Home.vue'
import OAuthCallback from '@/views/OAuthCallback.vue'

// 检查是否是 OAuth 回调页面
const isOAuthCallback = computed(() => {
  const hash = window.location.hash
  const search = window.location.search
  return hash.includes('/deploy/callback') || 
         (search.includes('token=') && search.includes('repoUrl='))
})
</script>

<style lang="scss">
// 全局样式在 style.scss 中定义
</style>
