<template>
  <el-config-provider :locale="zhCn">
    <Home />
  </el-config-provider>
</template>

<script setup>
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import Home from '@/views/Home.vue'
</script>

<style lang="scss">
// 全局样式在 style.scss 中定义
</style>
