import axios from 'axios'

const NETLIFY_API_BASE = 'https://api.netlify.com/api/v1'

// Netlify API 客户端
class NetlifyApi {
  constructor(token) {
    this.token = token
    this.client = axios.create({
      baseURL: NETLIFY_API_BASE,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
  }

  // 创建新站点并关联 GitHub 仓库
  async createSite(name, repoUrl, branch = 'main') {
    try {
      // 从 GitHub URL 提取 owner 和 repo
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
      if (!match) {
        throw new Error('无效的 GitHub 仓库地址')
      }
      const [, owner, repo] = match
      const cleanRepo = repo.replace(/\.git$/, '')
      const siteName = `${cleanRepo}-${Date.now()}`

      // 步骤1: 创建站点
      const siteConfig = {
        name: siteName,
        build_settings: {
          cmd: 'npm run build',
          dir: 'dist',
          env: {
            NODE_VERSION: '18'
          }
        }
      }

      const siteResponse = await this.client.post('/sites', siteConfig)
      const site = siteResponse.data
      const siteId = site.id
      
      // 步骤2: 关联 GitHub 仓库（使用 repo 配置）
      try {
        await this.client.put(`/sites/${siteId}`, {
          repo: {
            provider: 'github',
            repo_path: `${owner}/${cleanRepo}`,
            repo_branch: branch,
            cmd: 'npm run build',
            dir: 'dist',
            env: {
              NODE_VERSION: '18'
            }
          }
        })
      } catch (repoError) {
        console.warn('关联 GitHub 仓库失败:', repoError.message)
        // 如果关联失败，仍然返回站点信息，让用户手动配置
      }
      
      // 构建站点 URL
      const siteUrl = `https://${siteName}.netlify.app`
      
      return {
        success: true,
        siteId: siteId,
        siteName: siteName,
        url: siteUrl,
        adminUrl: `https://app.netlify.com/sites/${siteName}/overview`
      }
    } catch (error) {
      console.error('创建站点失败:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message
      }
    }
  }

  // 获取站点部署状态
  async getDeployStatus(siteId) {
    try {
      const response = await this.client.get(`/sites/${siteId}/deploys`)
      const latestDeploy = response.data[0]
      
      if (!latestDeploy) {
        return { status: 'pending', message: '等待部署' }
      }

      return {
        status: latestDeploy.state,
        message: this.getDeployMessage(latestDeploy.state),
        deployUrl: latestDeploy.ssl_url || latestDeploy.url,
        createdAt: latestDeploy.created_at
      }
    } catch (error) {
      console.error('获取部署状态失败:', error)
      return {
        status: 'error',
        message: '获取部署状态失败'
      }
    }
  }

  // 获取部署状态消息
  getDeployMessage(state) {
    const messages = {
      'new': '准备部署',
      'enqueued': '排队中',
      'building': '构建中',
      'processing': '处理中',
      'ready': '部署成功',
      'error': '部署失败',
      'skipped': '已跳过'
    }
    return messages[state] || '未知状态'
  }

  // 触发手动部署
  async triggerDeploy(siteId) {
    try {
      const response = await this.client.post(`/sites/${siteId}/deploys`)
      return {
        success: true,
        deployId: response.data.id,
        status: response.data.state
      }
    } catch (error) {
      console.error('触发部署失败:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message
      }
    }
  }
}

export default NetlifyApi
