<template>
  <div class="home-page">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>
    
    <!-- 头部导航 -->
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <el-icon class="logo-icon"><Promotion /></el-icon>
          <span class="logo-text">AI Deploy</span>
        </div>
        <nav class="nav-links">
          <a href="https://github.com" target="_blank" class="nav-link">
            <el-icon><GithubIcon /></el-icon>
            GitHub
          </a>
        </nav>
      </div>
    </header>
    
    <!-- 主要内容 -->
    <main class="main-content">
      <!-- Hero 区域 -->
      <section class="hero-section">
        <div class="hero-badge">
          <el-icon><MagicStick /></el-icon>
          <span>一键部署 GitHub 前端项目</span>
        </div>
        
        <h1 class="hero-title">
          <span class="gradient-text">一键部署</span>
          <br />
          GitHub 网站
        </h1>
        
        <p class="hero-subtitle">
          输入 GitHub 仓库地址，3 秒部署为公网网站
          <br />
          自动检测项目类型，智能配置 GitHub Pages
        </p>
        
        <!-- 部署表单 -->
        <DeployForm />
        
        <!-- 部署状态 -->
        <DeployStatus />
        
        <!-- 结果卡片 -->
        <ResultCard />
        
        <!-- 部署历史 -->
        <DeployHistory />
      </section>
      
      <!-- 特性介绍 -->
      <section class="features-section">
        <h2 class="section-title">为什么选择 AI Deploy</h2>
        
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <el-icon><Lightning /></el-icon>
            </div>
            <h3 class="feature-title">极速部署</h3>
            <p class="feature-desc">3 秒完成部署，无需等待，即时访问您的网站</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <el-icon><Cpu /></el-icon>
            </div>
            <h3 class="feature-title">智能识别</h3>
            <p class="feature-desc">自动检测 Vue、React、Next.js 等前端框架</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <el-icon><Link /></el-icon>
            </div>
            <h3 class="feature-title">免费域名</h3>
            <p class="feature-desc">自动生成 github.io 域名，免费访问您的网站</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <el-icon><Lock /></el-icon>
            </div>
            <h3 class="feature-title">安全可靠</h3>
            <p class="feature-desc">基于 GitHub Pages，全球 CDN 加速，稳定可靠</p>
          </div>
        </div>
      </section>
      
      <!-- 使用步骤 -->
      <section class="steps-section">
        <h2 class="section-title">三步完成部署</h2>
        
        <div class="steps-timeline">
          <div class="step-node">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>输入仓库地址</h4>
              <p>粘贴您的 GitHub 仓库链接</p>
            </div>
          </div>
          
          <div class="step-connector"></div>
          
          <div class="step-node">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>点击一键部署</h4>
              <p>系统自动检测并配置</p>
            </div>
          </div>
          
          <div class="step-connector"></div>
          
          <div class="step-node">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>获取访问地址</h4>
              <p>立即访问您的网站</p>
            </div>
          </div>
        </div>
      </section>
    </main>
    
    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <p class="footer-text">
          Made with <span class="heart-icon">❤️</span> for developers
        </p>
        <p class="footer-copyright">
          © 2024 AI Deploy. Powered by GitHub Pages.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { h } from 'vue'
import { Promotion, MagicStick, Lightning, Cpu, Link, Lock } from '@element-plus/icons-vue'
import DeployForm from '@/components/DeployForm.vue'
import DeployStatus from '@/components/DeployStatus.vue'
import ResultCard from '@/components/ResultCard.vue'
import DeployHistory from '@/components/DeployHistory.vue'

// GitHub 图标组件
const GithubIcon = {
  render() {
    return h('svg', {
      viewBox: '0 0 24 24',
      fill: 'currentColor',
      style: 'width: 1em; height: 1em;'
    }, [
      h('path', {
        d: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z'
      })
    ])
  }
}
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  background: $gradient-background;
  position: relative;
  overflow-x: hidden;
}

// 背景装饰
.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
}

.orb-1 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%);
  top: -200px;
  right: -200px;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
  bottom: 10%;
  left: -150px;
}

.orb-3 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%);
  top: 40%;
  right: 10%;
}

// 头部
.header {
  position: relative;
  z-index: 10;
  padding: 20px 0;
  border-bottom: 1px solid $border-color;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 28px;
  color: $primary-light;
}

.logo-text {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  background: $gradient-primary;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 24px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: $text-secondary;
  text-decoration: none;
  font-size: $font-size-sm;
  transition: color $transition-fast;
  
  &:hover {
    color: $text-primary;
  }
  
  .el-icon {
    font-size: 18px;
  }
}

// 主要内容
.main-content {
  position: relative;
  z-index: 1;
}

// Hero 区域
.hero-section {
  padding: 80px 24px 120px;
  text-align: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: $radius-full;
  color: $primary-light;
  font-size: $font-size-sm;
  margin-bottom: 24px;
  
  .el-icon {
    font-size: 16px;
  }
}

.hero-title {
  color: $text-primary;
  font-size: $font-size-4xl;
  font-weight: $font-weight-bold;
  line-height: 1.2;
  margin: 0 0 20px;
  
  @media (max-width: 640px) {
    font-size: $font-size-3xl;
  }
}

.gradient-text {
  background: $gradient-primary;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  color: $text-secondary;
  font-size: $font-size-lg;
  line-height: 1.6;
  margin: 0 0 40px;
  
  @media (max-width: 640px) {
    font-size: $font-size-base;
  }
}

// 特性介绍
.features-section {
  padding: 80px 24px;
  background: linear-gradient(180deg, transparent 0%, rgba(99, 102, 241, 0.05) 50%, transparent 100%);
}

.section-title {
  text-align: center;
  color: $text-primary;
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  margin: 0 0 48px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  max-width: 1000px;
  margin: 0 auto;
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.feature-card {
  padding: 24px;
  background: $gradient-card;
  border: 1px solid $border-color;
  border-radius: $radius-xl;
  text-align: center;
  transition: all $transition-base;
  
  &:hover {
    transform: translateY(-4px);
    border-color: $border-color-hover;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }
}

.feature-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  background: $gradient-primary;
  border-radius: $radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .el-icon {
    font-size: 28px;
    color: $text-primary;
  }
}

.feature-title {
  color: $text-primary;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  margin: 0 0 8px;
}

.feature-desc {
  color: $text-secondary;
  font-size: $font-size-sm;
  line-height: 1.5;
  margin: 0;
}

// 使用步骤
.steps-section {
  padding: 80px 24px;
}

.steps-timeline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  max-width: 800px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.step-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex-shrink: 0;
}

.step-number {
  width: 48px;
  height: 48px;
  background: $gradient-primary;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-primary;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  margin-bottom: 12px;
}

.step-content {
  h4 {
    color: $text-primary;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    margin: 0 0 4px;
  }
  
  p {
    color: $text-secondary;
    font-size: $font-size-sm;
    margin: 0;
  }
}

.step-connector {
  width: 80px;
  height: 2px;
  background: linear-gradient(90deg, $primary-color, $primary-light);
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    width: 2px;
    height: 40px;
    background: linear-gradient(180deg, $primary-color, $primary-light);
  }
}

// 页脚
.footer {
  padding: 40px 24px;
  border-top: 1px solid $border-color;
  text-align: center;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-text {
  color: $text-secondary;
  font-size: $font-size-sm;
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.heart-icon {
  color: #ef4444;
  font-size: 14px;
}

.footer-copyright {
  color: $text-muted;
  font-size: $font-size-xs;
  margin: 0;
}
</style>
