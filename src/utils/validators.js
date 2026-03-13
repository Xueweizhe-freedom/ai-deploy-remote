/**
 * 输入验证工具
 * 提供 URL 验证、XSS 过滤等安全功能
 */

/**
 * 验证 GitHub 仓库 URL
 * @param {string} url 
 * @returns {Object} - { valid: boolean, message: string }
 */
export function validateGitHubUrl(url) {
  if (!url || typeof url !== 'string') {
    return {
      valid: false,
      message: '请输入 GitHub 仓库地址'
    }
  }

  const trimmedUrl = url.trim()

  if (trimmedUrl.length === 0) {
    return {
      valid: false,
      message: '请输入 GitHub 仓库地址'
    }
  }

  // 检查是否为 GitHub 域名
  const githubPattern = /^(https?:\/\/)?(www\.)?github\.com\//i
  if (!githubPattern.test(trimmedUrl)) {
    return {
      valid: false,
      message: '仅支持 GitHub 仓库地址 (github.com)'
    }
  }

  // 验证 URL 格式
  const repoPattern = /^(https?:\/\/)?(www\.)?github\.com\/[^\/]+\/[^\/]+\/?$/i
  const repoPatternWithGit = /^(https?:\/\/)?(www\.)?github\.com\/[^\/]+\/[^\/]+\.git$/i
  
  if (!repoPattern.test(trimmedUrl) && !repoPatternWithGit.test(trimmedUrl)) {
    return {
      valid: false,
      message: '请输入正确的 GitHub 仓库地址格式，例如：https://github.com/username/repo'
    }
  }

  // 检查是否为特殊页面
  const invalidPaths = [
    '/settings',
    '/notifications',
    '/explore',
    '/marketplace',
    '/issues',
    '/pulls',
    '/search',
    '/new',
    '/login',
    '/signup'
  ]
  
  for (const path of invalidPaths) {
    if (trimmedUrl.toLowerCase().includes(path)) {
      return {
        valid: false,
        message: '请输入有效的仓库地址，而非 GitHub 功能页面'
      }
    }
  }

  return {
    valid: true,
    message: ''
  }
}

/**
 * XSS 过滤 - 转义 HTML 特殊字符
 * @param {string} str 
 * @returns {string}
 */
export function escapeHtml(str) {
  if (!str || typeof str !== 'string') {
    return ''
  }

  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  }

  return str.replace(/[&<>"'`=/]/g, char => htmlEscapes[char] || char)
}

/**
 * 清理用户输入
 * @param {string} input 
 * @returns {string}
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // 移除控制字符
    .replace(/\s+/g, ' ') // 合并多个空白字符
}

/**
 * 检查请求频率限制
 * 每个 IP 每小时限制 10 次请求
 * @returns {Object} - { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit() {
  const STORAGE_KEY = 'deploy_rate_limit'
  const MAX_REQUESTS = 10
  const HOUR_IN_MS = 60 * 60 * 1000

  try {
    const now = Date.now()
    let rateData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')

    // 如果没有数据或已过期，重置
    if (!rateData.timestamp || now - rateData.timestamp > HOUR_IN_MS) {
      rateData = {
        count: 0,
        timestamp: now
      }
    }

    const remaining = Math.max(0, MAX_REQUESTS - rateData.count)
    const resetTime = rateData.timestamp + HOUR_IN_MS

    return {
      allowed: remaining > 0,
      remaining,
      resetTime,
      currentCount: rateData.count
    }
  } catch (error) {
    // 如果 localStorage 不可用，允许请求
    console.warn('Rate limit check failed:', error)
    return {
      allowed: true,
      remaining: MAX_REQUESTS,
      resetTime: Date.now() + HOUR_IN_MS,
      currentCount: 0
    }
  }
}

/**
 * 记录请求
 */
export function recordRequest() {
  const STORAGE_KEY = 'deploy_rate_limit'
  const HOUR_IN_MS = 60 * 60 * 1000

  try {
    const now = Date.now()
    let rateData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')

    // 如果没有数据或已过期，重置
    if (!rateData.timestamp || now - rateData.timestamp > HOUR_IN_MS) {
      rateData = {
        count: 0,
        timestamp: now
      }
    }

    rateData.count += 1
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rateData))
  } catch (error) {
    console.warn('Failed to record request:', error)
  }
}

/**
 * 格式化剩余时间
 * @param {number} timestamp 
 * @returns {string}
 */
export function formatResetTime(timestamp) {
  const now = Date.now()
  const diff = timestamp - now

  if (diff <= 0) {
    return '现在'
  }

  const minutes = Math.ceil(diff / (60 * 1000))
  if (minutes < 60) {
    return `${minutes} 分钟后`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours} 小时后`
  }
  
  return `${hours} 小时 ${remainingMinutes} 分钟后`
}
