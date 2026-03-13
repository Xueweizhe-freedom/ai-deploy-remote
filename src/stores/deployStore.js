/**
 * 部署状态管理 (Pinia)
 * 管理部署流程状态、历史记录、频率限制
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { parseRepoUrl } from '@/utils/repoParser.js'
import { 
  validateGitHubUrl, 
  checkRateLimit, 
  recordRequest,
  sanitizeInput 
} from '@/utils/validators.js'
import { 
  checkDeployability, 
  simulateDeploy 
} from '@/api/githubApi.js'
import {
  createProject,
  deployProject,
  pollDeploymentStatus
} from '@/api/vercelApi.js'

// 本地存储键名
const HISTORY_KEY = 'deploy_history'
const MAX_HISTORY = 10

export const useDeployStore = defineStore('deploy', () => {
  // ============ State ============
  
  // 输入状态
  const repoUrl = ref('')
  const inputError = ref('')
  
  // 部署状态
  const deployStatus = ref('idle') // idle, validating, parsing, checking, deploying, success, error
  const currentStep = ref(0)
  const totalSteps = ref(6)
  const stepMessage = ref('')
  const deployProgress = ref(0)
  
  // 结果状态
  const deployResult = ref(null)
  const deployError = ref('')
  
  // 仓库信息
  const repoInfo = ref(null)
  const projectType = ref(null)
  const pagesInfo = ref(null)
  
  // 历史记录
  const deployHistory = ref([])

  // ============ Getters ============
  
  // 是否正在部署中
  const isDeploying = computed(() => 
    ['validating', 'parsing', 'checking', 'deploying'].includes(deployStatus.value)
  )
  
  // 是否可以部署
  const canDeploy = computed(() => {
    if (!repoUrl.value || inputError.value) return false
    if (isDeploying.value) return false
    return true
  })
  
  // 解析后的仓库信息
  const parsedRepo = computed(() => {
    if (!repoUrl.value) return null
    return parseRepoUrl(repoUrl.value)
  })
  
  // 部署是否成功
  const isSuccess = computed(() => deployStatus.value === 'success')
  
  // 部署是否失败
  const isError = computed(() => deployStatus.value === 'error')
  
  // 频率限制信息
  const rateLimitInfo = computed(() => checkRateLimit())
  
  // 是否超过频率限制
  const isRateLimited = computed(() => !rateLimitInfo.value.allowed)

  // ============ Actions ============
  
  /**
   * 设置仓库 URL
   * @param {string} url 
   */
  function setRepoUrl(url) {
    repoUrl.value = sanitizeInput(url)
    inputError.value = ''
    
    // 实时验证
    if (repoUrl.value) {
      const validation = validateGitHubUrl(repoUrl.value)
      if (!validation.valid) {
        inputError.value = validation.message
      }
    }
  }
  
  /**
   * 验证输入
   * @returns {boolean}
   */
  function validateInput() {
    const validation = validateGitHubUrl(repoUrl.value)
    
    if (!validation.valid) {
      inputError.value = validation.message
      return false
    }
    
    // 检查频率限制
    const rateLimit = checkRateLimit()
    if (!rateLimit.allowed) {
      inputError.value = `请求过于频繁，请在 ${formatResetTime(rateLimit.resetTime)} 后再试`
      return false
    }
    
    inputError.value = ''
    return true
  }
  
  /**
   * 开始部署流程
   */
  async function startDeploy() {
    // 验证输入
    if (!validateInput()) {
      deployStatus.value = 'error'
      return false
    }
    
    // 解析仓库地址
    const parsed = parseRepoUrl(repoUrl.value)
    if (!parsed) {
      inputError.value = '无法解析仓库地址'
      deployStatus.value = 'error'
      return false
    }
    
    // 记录请求
    recordRequest()
    
    // 重置状态
    deployStatus.value = 'validating'
    currentStep.value = 1
    totalSteps.value = 6
    deployProgress.value = 0
    deployError.value = ''
    deployResult.value = null
    
    try {
      // 步骤 1: 解析仓库
      updateStep(1, '解析仓库地址...')
      await delay(300)
      
      // 步骤 2: 获取仓库信息
      deployStatus.value = 'parsing'
      updateStep(2, '获取仓库信息...')
      
      const checkResult = await checkDeployability(parsed.username, parsed.repo)
      
      if (!checkResult.success) {
        throw new Error(checkResult.error)
      }
      
      repoInfo.value = checkResult.data.repo
      projectType.value = checkResult.data.projectType
      pagesInfo.value = checkResult.data.pages
      
      // 检查是否为后端项目
      if (projectType.value && projectType.value.isBackend) {
        deployStatus.value = 'error'
        deployError.value = '检测到后端项目，不支持部署'
        
        // 添加到历史记录（失败）
        addToHistory({
          url: repoUrl.value,
          repoName: `${parsed.username}/${parsed.repo}`,
          timestamp: new Date().toISOString(),
          status: 'error',
          error: '后端项目不支持',
          projectType: projectType.value
        })
        
        return false
      }
      
      // 检查是否可部署
      if (projectType.value && !projectType.value.deployable) {
        deployStatus.value = 'error'
        deployError.value = projectType.value.reason || '该项目类型不支持部署'
        
        // 添加到历史记录（失败）
        addToHistory({
          url: repoUrl.value,
          repoName: `${parsed.username}/${parsed.repo}`,
          timestamp: new Date().toISOString(),
          status: 'error',
          error: projectType.value.reason || '不支持的项目类型',
          projectType: projectType.value
        })
        
        return false
      }
      
      await delay(500)
      
      // 步骤 3-6: 模拟部署流程
      deployStatus.value = 'deploying'
      
      const deployResult_data = await simulateDeploy(
        parsed.username,
        parsed.repo,
        (progress) => {
          currentStep.value = progress.step
          stepMessage.value = progress.message
          deployProgress.value = progress.percent
        }
      )
      
      if (!deployResult_data.success) {
        throw new Error(deployResult_data.error)
      }
      
      // 部署成功
      deployStatus.value = 'success'
      deployResult.value = {
        url: deployResult_data.data.url,
        setupUrl: deployResult_data.data.setupUrl,
        repoInfo: repoInfo.value,
        projectType: projectType.value,
        pagesInfo: pagesInfo.value,
        deployedAt: new Date().toISOString()
      }
      
      // 添加到历史记录
      addToHistory({
        url: repoUrl.value,
        deployUrl: deployResult_data.data.url,
        repoName: `${parsed.username}/${parsed.repo}`,
        timestamp: new Date().toISOString(),
        status: 'success'
      })
      
      return true
      
    } catch (error) {
      deployStatus.value = 'error'
      deployError.value = error.message || '部署失败，请稍后重试'
      
      // 添加到历史记录（失败）
      addToHistory({
        url: repoUrl.value,
        repoName: `${parsed.username}/${parsed.repo}`,
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error.message
      })
      
      return false
    }
  }
  
  /**
   * 使用 Vercel 进行真实部署
   * @returns {Promise<boolean>}
   */
  async function startVercelDeploy() {
    // 验证输入
    if (!validateInput()) {
      deployStatus.value = 'error'
      return false
    }
    
    // 解析仓库地址
    const parsed = parseRepoUrl(repoUrl.value)
    if (!parsed) {
      inputError.value = '无法解析仓库地址'
      deployStatus.value = 'error'
      return false
    }
    
    // 记录请求
    recordRequest()
    
    // 重置状态
    deployStatus.value = 'validating'
    currentStep.value = 1
    totalSteps.value = 6
    deployProgress.value = 0
    deployError.value = ''
    deployResult.value = null
    
    try {
      // 步骤 1: 解析仓库
      updateStep(1, '解析仓库地址...')
      await delay(300)
      
      // 步骤 2: 获取仓库信息
      deployStatus.value = 'parsing'
      updateStep(2, '获取仓库信息...')
      
      const checkResult = await checkDeployability(parsed.username, parsed.repo)
      
      if (!checkResult.success) {
        throw new Error(checkResult.error)
      }
      
      repoInfo.value = checkResult.data.repo
      projectType.value = checkResult.data.projectType
      pagesInfo.value = checkResult.data.pages
      
      // 检查是否为后端项目
      if (projectType.value && projectType.value.isBackend) {
        deployStatus.value = 'error'
        deployError.value = '检测到后端项目，不支持部署'
        
        addToHistory({
          url: repoUrl.value,
          repoName: `${parsed.username}/${parsed.repo}`,
          timestamp: new Date().toISOString(),
          status: 'error',
          error: '后端项目不支持',
          projectType: projectType.value
        })
        
        return false
      }
      
      // 检查是否可部署
      if (projectType.value && !projectType.value.deployable) {
        deployStatus.value = 'error'
        deployError.value = projectType.value.reason || '该项目类型不支持部署'
        
        addToHistory({
          url: repoUrl.value,
          repoName: `${parsed.username}/${parsed.repo}`,
          timestamp: new Date().toISOString(),
          status: 'error',
          error: projectType.value.reason || '不支持的项目类型',
          projectType: projectType.value
        })
        
        return false
      }
      
      await delay(500)
      
      // 步骤 3: 创建 Vercel 项目
      deployStatus.value = 'deploying'
      updateStep(3, '创建 Vercel 项目...')
      
      const projectResult = await createProject(
        parsed.repo,
        repoUrl.value,
        repoInfo.value.id
      )
      
      if (!projectResult.success) {
        throw new Error(projectResult.error)
      }
      
      const projectName = projectResult.data.name
      
      // 步骤 4: 开始部署
      updateStep(4, '开始构建部署...')
      
      const deployResult_data = await deployProject(
        projectName,
        repoUrl.value,
        repoInfo.value.defaultBranch || 'main'
      )
      
      if (!deployResult_data.success) {
        throw new Error(deployResult_data.error)
      }
      
      const deploymentId = deployResult_data.data.id
      
      // 步骤 5-6: 轮询部署状态
      updateStep(5, '等待构建完成...')
      
      const pollResult = await pollDeploymentStatus(
        deploymentId,
        (progress) => {
          if (progress.status === 'BUILDING') {
            stepMessage.value = '正在构建中...'
            deployProgress.value = 70
          } else if (progress.status === 'DEPLOYING') {
            stepMessage.value = '正在部署...'
            deployProgress.value = 90
          }
        }
      )
      
      if (!pollResult.success) {
        throw new Error(pollResult.error)
      }
      
      // 部署成功
      updateStep(6, '部署完成！')
      deployStatus.value = 'success'
      deployResult.value = {
        url: `https://${projectName}.vercel.app`,
        vercelUrl: pollResult.data.url,
        alias: pollResult.data.alias,
        repoInfo: repoInfo.value,
        projectType: projectType.value,
        deployedAt: new Date().toISOString(),
        isVercel: true
      }
      
      // 添加到历史记录
      addToHistory({
        url: repoUrl.value,
        deployUrl: `https://${projectName}.vercel.app`,
        repoName: `${parsed.username}/${parsed.repo}`,
        timestamp: new Date().toISOString(),
        status: 'success',
        isVercel: true
      })
      
      return true
      
    } catch (error) {
      deployStatus.value = 'error'
      deployError.value = error.message || '部署失败，请稍后重试'
      
      // 添加到历史记录（失败）
      addToHistory({
        url: repoUrl.value,
        repoName: `${parsed.username}/${parsed.repo}`,
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error.message
      })
      
      return false
    }
  }
  
  /**
   * 更新步骤状态
   * @param {number} step 
   * @param {string} message 
   */
  function updateStep(step, message) {
    currentStep.value = step
    stepMessage.value = message
    deployProgress.value = Math.round((step / totalSteps.value) * 100)
  }
  
  /**
   * 重置部署状态
   */
  function resetDeploy() {
    deployStatus.value = 'idle'
    currentStep.value = 0
    deployProgress.value = 0
    stepMessage.value = ''
    deployResult.value = null
    deployError.value = ''
    repoInfo.value = null
    projectType.value = null
    pagesInfo.value = null
  }
  
  /**
   * 清空输入
   */
  function clearInput() {
    repoUrl.value = ''
    inputError.value = ''
    resetDeploy()
  }
  
  /**
   * 加载历史记录
   */
  function loadHistory() {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      if (saved) {
        deployHistory.value = JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load history:', error)
      deployHistory.value = []
    }
  }
  
  /**
   * 保存历史记录
   */
  function saveHistory() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(deployHistory.value))
    } catch (error) {
      console.warn('Failed to save history:', error)
    }
  }
  
  /**
   * 添加到历史记录
   * @param {Object} record 
   */
  function addToHistory(record) {
    // 去重：如果相同仓库已存在，先移除
    const existingIndex = deployHistory.value.findIndex(
      h => h.repoName === record.repoName
    )
    if (existingIndex !== -1) {
      deployHistory.value.splice(existingIndex, 1)
    }
    
    // 添加到开头
    deployHistory.value.unshift(record)
    
    // 限制数量
    if (deployHistory.value.length > MAX_HISTORY) {
      deployHistory.value = deployHistory.value.slice(0, MAX_HISTORY)
    }
    
    saveHistory()
  }
  
  /**
   * 清空历史记录
   */
  function clearHistory() {
    deployHistory.value = []
    saveHistory()
  }
  
  /**
   * 从历史记录重新部署
   * @param {Object} record 
   */
  function redeployFromHistory(record) {
    setRepoUrl(record.url)
    return startDeploy()
  }
  
  /**
   * 格式化重置时间
   * @param {number} timestamp 
   * @returns {string}
   */
  function formatResetTime(timestamp) {
    const now = Date.now()
    const diff = timestamp - now
    
    if (diff <= 0) return '现在'
    
    const minutes = Math.ceil(diff / (60 * 1000))
    if (minutes < 60) return `${minutes} 分钟后`
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (remainingMinutes === 0) return `${hours} 小时后`
    return `${hours} 小时 ${remainingMinutes} 分钟后`
  }
  
  /**
   * 延迟函数
   * @param {number} ms 
   * @returns {Promise<void>}
   */
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  // 初始化时加载历史记录
  loadHistory()
  
  return {
    // State
    repoUrl,
    inputError,
    deployStatus,
    currentStep,
    totalSteps,
    stepMessage,
    deployProgress,
    deployResult,
    deployError,
    repoInfo,
    projectType,
    pagesInfo,
    deployHistory,
    
    // Getters
    isDeploying,
    canDeploy,
    parsedRepo,
    isSuccess,
    isError,
    rateLimitInfo,
    isRateLimited,
    
    // Actions
    setRepoUrl,
    validateInput,
    startDeploy,
    startVercelDeploy,
    resetDeploy,
    clearInput,
    loadHistory,
    clearHistory,
    redeployFromHistory
  }
})
