/**
 * Cloudflare Pages API 封装
 * 提供项目创建、部署等功能
 */

import axios from 'axios'

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4'

// Cloudflare Token 从环境变量获取
const CLOUDFLARE_TOKEN = import.meta.env.VITE_CLOUDFLARE_TOKEN || ''
const CLOUDFLARE_ACCOUNT_ID = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID || ''

// 创建 axios 实例
const cloudflareClient = axios.create({
  baseURL: CLOUDFLARE_API_BASE,
  timeout: 60000,
  headers: {
    'Authorization': `Bearer ${CLOUDFLARE_TOKEN}`,
    'Content-Type': 'application/json'
  }
})

/**
 * 验证 Cloudflare Token
 * @returns {Promise<Object>}
 */
export async function verifyToken() {
  try {
    const response = await cloudflareClient.get('/user/tokens/verify')
    return {
      success: true,
      data: response.data.result
    }
  } catch (error) {
    return handleApiError(error, 'Token 验证失败')
  }
}

/**
 * 获取账户信息
 * @returns {Promise<Object>}
 */
export async function getAccounts() {
  try {
    const response = await cloudflareClient.get('/accounts')
    return {
      success: true,
      data: response.data.result
    }
  } catch (error) {
    return handleApiError(error, '获取账户信息失败')
  }
}

/**
 * 创建 Cloudflare Pages 项目
 * @param {string} name - 项目名称
 * @param {string} repoUrl - GitHub 仓库地址
 * @returns {Promise<Object>}
 */
export async function createPagesProject(name, repoUrl) {
  try {
    if (!CLOUDFLARE_ACCOUNT_ID) {
      return {
        success: false,
        error: '缺少 Cloudflare Account ID，请在环境变量中设置 VITE_CLOUDFLARE_ACCOUNT_ID'
      }
    }

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
    const response = await cloudflareClient.post(
      `/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects`,
      {
        name: projectName,
        production_branch: 'main',
        source: {
          type: 'github',
          config: {
            owner: repoInfo.owner,
            repo_name: repoInfo.repo,
            production_branch: 'main'
          }
        },
        build_config: {
          build_command: 'npm run build',
          destination_dir: 'dist',
          root_dir: ''
        }
      }
    )

    return {
      success: true,
      data: {
        id: response.data.result.id,
        name: response.data.result.name,
        url: `https://${projectName}.pages.dev`,
        subdomain: response.data.result.subdomain
      }
    }
  } catch (error) {
    // 如果项目已存在，返回已有项目信息
    if (error.response?.data?.errors?.[0]?.message?.includes('already exists')) {
      return {
        success: true,
        data: {
          id: null,
          name: sanitizeProjectName(name),
          url: `https://${sanitizeProjectName(name)}.pages.dev`,
          existing: true
        }
      }
    }
    return handleApiError(error, '创建项目失败')
  }
}

/**
 * 创建部署（通过上传文件或触发 GitHub 构建）
 * @param {string} projectName - 项目名称
 * @returns {Promise<Object>}
 */
export async function createPagesDeployment(projectName) {
  try {
    if (!CLOUDFLARE_ACCOUNT_ID) {
      return {
        success: false,
        error: '缺少 Cloudflare Account ID'
      }
    }

    // 触发部署
    const response = await cloudflareClient.post(
      `/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${projectName}/deployments`,
      {}
    )

    return {
      success: true,
      data: {
        id: response.data.result.id,
        url: response.data.result.url,
        environment: response.data.result.environment
      }
    }
  } catch (error) {
    return handleApiError(error, '部署失败')
  }
}

/**
 * 获取部署状态
 * @param {string} projectName - 项目名称
 * @param {string} deploymentId - 部署 ID
 * @returns {Promise<Object>}
 */
export async function getPagesDeploymentStatus(projectName, deploymentId) {
  try {
    if (!CLOUDFLARE_ACCOUNT_ID) {
      return {
        success: false,
        error: '缺少 Cloudflare Account ID'
      }
    }

    const response = await cloudflareClient.get(
      `/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${projectName}/deployments/${deploymentId}`
    )

    return {
      success: true,
      data: {
        id: response.data.result.id,
        status: response.data.result.latest_stage?.status || 'unknown',
        url: response.data.result.url,
        environment: response.data.result.environment
      }
    }
  } catch (error) {
    return handleApiError(error, '获取部署状态失败')
  }
}

/**
 * 获取项目部署列表
 * @param {string} projectName - 项目名称
 * @returns {Promise<Object>}
 */
export async function getPagesProjectDeployments(projectName) {
  try {
    if (!CLOUDFLARE_ACCOUNT_ID) {
      return {
        success: false,
        error: '缺少 Cloudflare Account ID'
      }
    }

    const response = await cloudflareClient.get(
      `/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${projectName}/deployments`
    )

    return {
      success: true,
      data: response.data.result.map(d => ({
        id: d.id,
        url: d.url,
        status: d.latest_stage?.status,
        createdAt: d.created_on
      }))
    }
  } catch (error) {
    return handleApiError(error, '获取部署列表失败')
  }
}

/**
 * 删除项目
 * @param {string} projectName - 项目名称
 * @returns {Promise<Object>}
 */
export async function deletePagesProject(projectName) {
  try {
    if (!CLOUDFLARE_ACCOUNT_ID) {
      return {
        success: false,
        error: '缺少 Cloudflare Account ID'
      }
    }

    await cloudflareClient.delete(
      `/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${projectName}`
    )

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
    .substring(0, 28)
}

/**
 * 处理 API 错误
 * @param {Error} error 
 * @param {string} defaultMessage 
 * @returns {Object}
 */
function handleApiError(error, defaultMessage) {
  console.error('Cloudflare API Error:', error)

  if (error.response) {
    const status = error.response.status
    const errors = error.response.data?.errors || []
    const message = errors[0]?.message || defaultMessage

    switch (status) {
      case 401:
        return {
          success: false,
          error: 'Cloudflare Token 无效或已过期，请检查 VITE_CLOUDFLARE_TOKEN 环境变量'
        }
      case 403:
        return {
          success: false,
          error: '权限不足，请确保 Token 有 Pages 写入权限'
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
 * @param {string} projectName 
 * @param {string} deploymentId 
 * @param {Function} onProgress 
 * @param {number} maxAttempts 
 * @returns {Promise<Object>}
 */
export async function pollPagesDeploymentStatus(projectName, deploymentId, onProgress, maxAttempts = 120) {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await getPagesDeploymentStatus(projectName, deploymentId)
    
    if (!result.success) {
      return result
    }

    const status = result.data.status
    
    // 调用进度回调
    onProgress && onProgress({
      attempt: i + 1,
      maxAttempts,
      status: status,
      url: result.data.url
    })

    // 部署完成
    if (status === 'success') {
      return {
        success: true,
        data: result.data
      }
    }

    // 部署失败
    if (status === 'failure' || status === 'canceled') {
      return {
        success: false,
        error: `部署${status === 'failure' ? '失败' : '被取消'}`
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
  getAccounts,
  createPagesProject,
  createPagesDeployment,
  getPagesDeploymentStatus,
  getPagesProjectDeployments,
  deletePagesProject,
  pollPagesDeploymentStatus
}
