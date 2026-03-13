/**
 * GitHub API 封装
 * 提供仓库信息获取、GitHub Pages 检测等功能
 */

import axios from 'axios'

// 创建 axios 实例
const githubClient = axios.create({
  baseURL: 'https://api.github.com',
  timeout: 30000,
  headers: {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'AI-Deploy-Tool'
  }
})

// 如果存在 GitHub Token，添加到请求头
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || ''
if (GITHUB_TOKEN) {
  githubClient.defaults.headers.common['Authorization'] = `token ${GITHUB_TOKEN}`
}

/**
 * 获取仓库信息
 * @param {string} username - GitHub 用户名
 * @param {string} repo - 仓库名
 * @returns {Promise<Object>} - 仓库信息
 */
export async function getRepoInfo(username, repo) {
  try {
    const response = await githubClient.get(`/repos/${username}/${repo}`)
    return {
      success: true,
      data: {
        name: response.data.name,
        fullName: response.data.full_name,
        description: response.data.description,
        isPrivate: response.data.private,
        isFork: response.data.fork,
        stars: response.data.stargazers_count,
        forks: response.data.forks_count,
        language: response.data.language,
        defaultBranch: response.data.default_branch,
        topics: response.data.topics || [],
        htmlUrl: response.data.html_url,
        cloneUrl: response.data.clone_url,
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at
      }
    }
  } catch (error) {
    return handleApiError(error, '获取仓库信息失败')
  }
}

/**
 * 获取仓库内容
 * @param {string} username 
 * @param {string} repo 
 * @param {string} path - 文件路径，默认为根目录
 * @param {string} ref - 分支或标签，默认为默认分支
 * @returns {Promise<Object>}
 */
export async function getRepoContents(username, repo, path = '', ref = '') {
  try {
    const params = ref ? { ref } : {}
    const response = await githubClient.get(
      `/repos/${username}/${repo}/contents/${path}`,
      { params }
    )
    return {
      success: true,
      data: Array.isArray(response.data) ? response.data : [response.data]
    }
  } catch (error) {
    return handleApiError(error, '获取仓库内容失败')
  }
}

/**
 * 检测是否为前端项目
 * 检查是否存在 index.html 或 package.json 等前端项目特征文件
 * @param {string} username 
 * @param {string} repo 
 * @returns {Promise<Object>} - 项目类型检测结果
 */
export async function detectProjectType(username, repo) {
  try {
    // 获取根目录文件列表
    const contentsResult = await getRepoContents(username, repo)
    
    if (!contentsResult.success) {
      return {
        success: false,
        error: contentsResult.error
      }
    }

    const files = contentsResult.data
    const fileNames = files.map(f => f.name.toLowerCase())

    // 检测项目类型
    const projectType = {
      type: 'unknown',
      isFrontend: false,
      hasIndexHtml: false,
      hasPackageJson: false,
      buildTool: null,
      framework: null
    }

    // 检查 index.html
    if (fileNames.includes('index.html')) {
      projectType.hasIndexHtml = true
      projectType.isFrontend = true
      projectType.type = 'static'
    }

    // 检查 package.json
    if (fileNames.includes('package.json')) {
      projectType.hasPackageJson = true
      projectType.isFrontend = true
      
      // 获取 package.json 内容来检测框架
      const packageJsonResult = await getPackageJson(username, repo)
      if (packageJsonResult.success) {
        const pkg = packageJsonResult.data
        const dependencies = {
          ...pkg.dependencies,
          ...pkg.devDependencies
        }

        // 检测框架
        if (dependencies.vue) {
          projectType.framework = 'Vue'
          projectType.type = 'vue'
        } else if (dependencies.react || dependencies['react-dom']) {
          projectType.framework = 'React'
          projectType.type = 'react'
        } else if (dependencies.next) {
          projectType.framework = 'Next.js'
          projectType.type = 'nextjs'
        } else if (dependencies.nuxt) {
          projectType.framework = 'Nuxt.js'
          projectType.type = 'nuxt'
        }

        // 检测构建工具
        if (dependencies.vite || fileNames.includes('vite.config.js') || fileNames.includes('vite.config.ts')) {
          projectType.buildTool = 'Vite'
        } else if (dependencies.webpack || fileNames.includes('webpack.config.js')) {
          projectType.buildTool = 'Webpack'
        } else if (dependencies['@angular/cli']) {
          projectType.buildTool = 'Angular CLI'
        }
      }
    }

    // 检查特定配置文件
    if (fileNames.includes('vite.config.js') || fileNames.includes('vite.config.ts')) {
      projectType.buildTool = projectType.buildTool || 'Vite'
    }
    if (fileNames.includes('next.config.js') || fileNames.includes('next.config.ts')) {
      projectType.type = 'nextjs'
      projectType.framework = 'Next.js'
    }
    if (fileNames.includes('nuxt.config.js') || fileNames.includes('nuxt.config.ts')) {
      projectType.type = 'nuxt'
      projectType.framework = 'Nuxt.js'
    }

    // 如果存在 dist 或 build 目录，说明可能是已构建的项目
    if (fileNames.includes('dist') || fileNames.includes('build')) {
      projectType.hasBuildDir = true
    }

    return {
      success: true,
      data: projectType
    }
  } catch (error) {
    return handleApiError(error, '检测项目类型失败')
  }
}

/**
 * 获取 package.json 内容
 * @param {string} username 
 * @param {string} repo 
 * @returns {Promise<Object>}
 */
async function getPackageJson(username, repo) {
  try {
    const response = await githubClient.get(
      `/repos/${username}/${repo}/contents/package.json`
    )
    
    if (response.data.content) {
      const content = atob(response.data.content)
      return {
        success: true,
        data: JSON.parse(content)
      }
    }
    
    return {
      success: false,
      error: '无法读取 package.json'
    }
  } catch (error) {
    return handleApiError(error, '获取 package.json 失败')
  }
}

/**
 * 获取 GitHub Pages 信息
 * @param {string} username 
 * @param {string} repo 
 * @returns {Promise<Object>}
 */
export async function getPagesInfo(username, repo) {
  try {
    const response = await githubClient.get(`/repos/${username}/${repo}/pages`)
    return {
      success: true,
      data: {
        enabled: true,
        url: response.data.html_url,
        status: response.data.status,
        source: response.data.source
      }
    }
  } catch (error) {
    // 404 表示 Pages 未启用
    if (error.response && error.response.status === 404) {
      return {
        success: true,
        data: {
          enabled: false,
          url: null,
          status: null,
          source: null
        }
      }
    }
    return handleApiError(error, '获取 Pages 信息失败')
  }
}

/**
 * 启用 GitHub Pages
 * 注意：这需要仓库所有者的权限，普通用户无法通过 API 启用
 * @param {string} username 
 * @param {string} repo 
 * @param {string} branch - 分支名，默认为 'main'
 * @returns {Promise<Object>}
 */
export async function enablePages(username, repo, branch = 'main') {
  try {
    // GitHub Pages API 需要特定权限，这里模拟返回
    // 实际启用 Pages 需要用户手动在仓库设置中开启
    return {
      success: true,
      data: {
        message: 'GitHub Pages 需要在仓库设置中手动启用',
        setupUrl: `https://github.com/${username}/${repo}/settings/pages`,
        pagesUrl: `https://${username}.github.io/${repo}`,
        instructions: [
          `1. 访问 https://github.com/${username}/${repo}/settings/pages`,
          `2. 在 "Source" 部分选择 "Deploy from a branch"`,
          `3. 选择 "${branch}" 分支并保存`,
          `4. 等待几分钟，访问 https://${username}.github.io/${repo}`
        ]
      }
    }
  } catch (error) {
    return handleApiError(error, '启用 Pages 失败')
  }
}

/**
 * 检查仓库是否可部署
 * @param {string} username 
 * @param {string} repo 
 * @returns {Promise<Object>}
 */
export async function checkDeployability(username, repo) {
  try {
    // 并行获取仓库信息和项目类型
    const [repoInfo, projectType, pagesInfo] = await Promise.all([
      getRepoInfo(username, repo),
      detectProjectType(username, repo),
      getPagesInfo(username, repo)
    ])

    if (!repoInfo.success) {
      return repoInfo
    }

    const result = {
      success: true,
      data: {
        repo: repoInfo.data,
        projectType: projectType.success ? projectType.data : null,
        pages: pagesInfo.success ? pagesInfo.data : null,
        canDeploy: false,
        deployUrl: `https://${username}.github.io/${repo}`,
        issues: []
      }
    }

    // 检查部署条件
    if (repoInfo.data.isPrivate) {
      result.data.issues.push('私有仓库需要 GitHub Pro 才能使用 Pages')
    }

    if (projectType.success && !projectType.data.isFrontend) {
      result.data.issues.push('未检测到前端项目特征（index.html 或 package.json）')
    }

    // 判断是否可以部署
    result.data.canDeploy = result.data.issues.length === 0 || 
                           (projectType.success && projectType.data.isFrontend)

    return result
  } catch (error) {
    return handleApiError(error, '检查部署条件失败')
  }
}

/**
 * 处理 API 错误
 * @param {Error} error 
 * @param {string} defaultMessage 
 * @returns {Object}
 */
function handleApiError(error, defaultMessage) {
  console.error('GitHub API Error:', error)

  if (error.response) {
    const status = error.response.status
    const message = error.response.data?.message || defaultMessage

    switch (status) {
      case 404:
        return {
          success: false,
          error: '仓库不存在或无法访问'
        }
      case 403:
        if (error.response.data?.message?.includes('rate limit')) {
          return {
            success: false,
            error: 'GitHub API 请求次数超限，请稍后再试'
          }
        }
        return {
          success: false,
          error: '访问被拒绝，可能需要权限'
        }
      case 401:
        return {
          success: false,
          error: '认证失败，请检查 GitHub Token'
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
 * 模拟部署流程
 * 用于演示，实际部署需要后端服务
 * @param {string} username 
 * @param {string} repo 
 * @param {Function} onProgress - 进度回调
 * @returns {Promise<Object>}
 */
export async function simulateDeploy(username, repo, onProgress) {
  const steps = [
    { message: '解析仓库地址...', delay: 500 },
    { message: '获取仓库信息...', delay: 800 },
    { message: '检测项目类型...', delay: 1000 },
    { message: '检查 GitHub Pages 状态...', delay: 800 },
    { message: '生成部署配置...', delay: 600 },
    { message: '部署完成！', delay: 500 }
  ]

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    onProgress && onProgress({
      step: i + 1,
      total: steps.length,
      message: step.message,
      percent: Math.round(((i + 1) / steps.length) * 100)
    })
    await sleep(step.delay)
  }

  return {
    success: true,
    data: {
      url: `https://${username}.github.io/${repo}`,
      setupUrl: `https://github.com/${username}/${repo}/settings/pages`
    }
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
  getRepoInfo,
  getRepoContents,
  detectProjectType,
  getPagesInfo,
  enablePages,
  checkDeployability,
  simulateDeploy
}
