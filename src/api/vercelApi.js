/**
 * Vercel API 封装
 * 提供项目创建、部署、域名获取等功能
 */

import axios from 'axios'

const VERCEL_API_BASE = 'https://api.vercel.com'

// Vercel Token 从环境变量获取
const VERCEL_TOKEN = import.meta.env.VITE_VERCEL_TOKEN || ''

// 创建 axios 实例
const vercelClient = axios.create({
  baseURL: VERCEL_API_BASE,
  timeout: 60000,
  headers: {
    'Authorization': `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json'
  }
})

/**
 * 检查 Vercel Token 是否有效
 * @returns {Promise<Object>}
 */
export async function verifyToken() {
  try {
    const response = await vercelClient.get('/v2/user')
    return {
      success: true,
      data: response.data.user
    }
  } catch (error) {
    return handleApiError(error, 'Token 验证失败')
  }
}

/**
 * 创建 Vercel 项目
 * @param {string} name - 项目名称
 * @param {string} repoUrl - GitHub 仓库地址
 * @param {string} repoId - GitHub 仓库 ID
 * @returns {Promise<Object>}
 */
export async function createProject(name, repoUrl, repoId) {
  try {
    // 解析 GitHub 仓库信息
    const repoInfo = parseGitHubUrl(repoUrl)
    if (!repoInfo) {
      return {
        success: false,
        error: '无法解析 GitHub 仓库地址'
      }
    }

    const projectName = sanitizeProjectName(name)

    // 创建项目
    const response = await vercelClient.post('/v9/projects', {
      name: projectName,
      framework: 'vite',
      gitRepository: {
        type: 'github',
        repo: `${repoInfo.owner}/${repoInfo.repo}`,
        repoId: repoId
      }
    })

    return {
      success: true,
      data: {
        id: response.data.id,
        name: response.data.name,
        url: `https://${response.data.name}.vercel.app`
      }
    }
  } catch (error) {
    // 如果项目已存在，返回已有项目信息
    const errorCode = error.response?.data?.error?.code
    const errorMessage = error.response?.data?.error?.message || ''
    
    if (errorCode === 'project_already_exists' || errorMessage.includes('already exists')) {
      return {
        success: true,
        data: {
          id: null,
          name: sanitizeProjectName(name),
          url: `https://${sanitizeProjectName(name)}.vercel.app`,
          existing: true
        }
      }
    }
    return handleApiError(error, '创建项目失败')
  }
}

/**
 * 部署项目
 * @param {string} projectId - 项目 ID
 * @param {string} repoUrl - GitHub 仓库地址
 * @param {string} branch - 分支名
 * @param {number} repoId - GitHub 仓库 ID
 * @returns {Promise<Object>}
 */
export async function deployProject(projectId, repoUrl, branch = 'main', repoId = null) {
  try {
    const repoInfo = parseGitHubUrl(repoUrl)
    if (!repoInfo) {
      return {
        success: false,
        error: '无法解析 GitHub 仓库地址'
      }
    }

    // 构建 gitSource
    const gitSource = {
      type: 'github',
      repo: `${repoInfo.owner}/${repoInfo.repo}`,
      ref: branch
    }
    
    // repoId 是必需字段
    if (!repoId) {
      return {
        success: false,
        error: '缺少 GitHub 仓库 ID，无法部署到 Vercel'
      }
    }
    
    gitSource.repoId = String(repoId)
    console.log('Vercel deploy gitSource:', gitSource)

    // 创建部署
    const response = await vercelClient.post('/v13/deployments', {
      name: projectId,
      gitSource: gitSource,
      target: 'production'
    })

    return {
      success: true,
      data: {
        id: response.data.id,
        url: response.data.url,
        status: response.data.status,
        readyState: response.data.readyState
      }
    }
  } catch (error) {
    return handleApiError(error, '部署失败')
  }
}

/**
 * 获取部署状态
 * @param {string} deploymentId - 部署 ID
 * @returns {Promise<Object>}
 */
export async function getDeploymentStatus(deploymentId) {
  try {
    const response = await vercelClient.get(`/v13/deployments/${deploymentId}`)
    
    return {
      success: true,
      data: {
        id: response.data.id,
        status: response.data.status,
        readyState: response.data.readyState,
        url: response.data.url,
        alias: response.data.alias || [],
        createdAt: response.data.created,
        buildingAt: response.data.buildingAt,
        readyAt: response.data.ready
      }
    }
  } catch (error) {
    return handleApiError(error, '获取部署状态失败')
  }
}

/**
 * 获取项目部署列表
 * @param {string} projectId - 项目 ID
 * @returns {Promise<Object>}
 */
export async function getProjectDeployments(projectId) {
  try {
    const response = await vercelClient.get(`/v6/deployments`, {
      params: {
        projectId: projectId,
        limit: 10
      }
    })

    return {
      success: true,
      data: response.data.deployments.map(d => ({
        id: d.uid,
        url: d.url,
        status: d.state,
        createdAt: d.created,
        readyAt: d.ready
      }))
    }
  } catch (error) {
    return handleApiError(error, '获取部署列表失败')
  }
}

/**
 * 删除项目
 * @param {string} projectId - 项目 ID
 * @returns {Promise<Object>}
 */
export async function deleteProject(projectId) {
  try {
    await vercelClient.delete(`/v9/projects/${projectId}`)
    return {
      success: true,
      data: { deleted: true }
    }
  } catch (error) {
    return handleApiError(error, '删除项目失败')
  }
}

/**
 * 解析 GitHub URL
 * @param {string} url 
 * @returns {Object|null}
 */
function parseGitHubUrl(url) {
  const patterns = [
    /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)/,
    /^git@github\.com:([^\/]+)\/([^\/]+)\.git$/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, '')
      }
    }
  }
  return null
}

/**
 * 规范化项目名称
 * @param {string} name 
 * @returns {string}
 */
function sanitizeProjectName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)
}

/**
 * 处理 API 错误
 * @param {Error} error 
 * @param {string} defaultMessage 
 * @returns {Object}
 */
function handleApiError(error, defaultMessage) {
  console.error('Vercel API Error:', error)

  if (error.response) {
    const status = error.response.status
    const errorData = error.response.data?.error || {}
    const message = errorData.message || defaultMessage

    switch (status) {
      case 401:
        return {
          success: false,
          error: 'Vercel Token 无效或已过期，请检查 VITE_VERCEL_TOKEN 环境变量'
        }
      case 403:
        return {
          success: false,
          error: '权限不足，请确保 Token 有 project 和 deployment 权限'
        }
      case 404:
        return {
          success: false,
          error: '项目或部署不存在'
        }
      case 429:
        return {
          success: false,
          error: '请求过于频繁，请稍后再试'
        }
      default:
        return {
          success: false,
          error: `${defaultMessage}: ${message}`
        }
    }
  }

  if (error.request) {
    return {
      success: false,
      error: '网络请求失败，请检查网络连接'
    }
  }

  return {
    success: false,
    error: defaultMessage
  }
}

/**
 * 轮询部署状态直到完成
 * @param {string} deploymentId 
 * @param {Function} onProgress 
 * @param {number} maxAttempts 
 * @returns {Promise<Object>}
 */
export async function pollDeploymentStatus(deploymentId, onProgress, maxAttempts = 120) {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await getDeploymentStatus(deploymentId)
    
    if (!result.success) {
      return result
    }

    const status = result.data.readyState
    
    // 调用进度回调
    onProgress && onProgress({
      attempt: i + 1,
      maxAttempts,
      status: status,
      url: result.data.url,
      alias: result.data.alias
    })

    // 部署完成
    if (status === 'READY') {
      return {
        success: true,
        data: result.data
      }
    }

    // 部署失败
    if (status === 'ERROR' || status === 'CANCELED') {
      return {
        success: false,
        error: `部署${status === 'ERROR' ? '失败' : '被取消'}`
      }
    }

    // 等待 3 秒后再次查询
    await sleep(3000)
  }

  return {
    success: false,
    error: '部署超时，请稍后手动检查状态'
  }
}

/**
 * 睡眠函数
 * @param {number} ms 
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default {
  verifyToken,
  createProject,
  deployProject,
  getDeploymentStatus,
  getProjectDeployments,
  deleteProject,
  pollDeploymentStatus
}
