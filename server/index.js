/**
 * Netlify OAuth 服务端
 * 处理授权回调和部署请求
 */

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const axios = require('axios')

const app = express()
app.use(cors())
app.use(express.json())

// Netlify OAuth 配置
const NETLIFY_CLIENT_ID = process.env.NETLIFY_CLIENT_ID
const NETLIFY_CLIENT_SECRET = process.env.NETLIFY_CLIENT_SECRET
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/callback'

// 检查配置
if (!NETLIFY_CLIENT_ID || !NETLIFY_CLIENT_SECRET) {
  console.error('错误: 请设置 NETLIFY_CLIENT_ID 和 NETLIFY_CLIENT_SECRET 环境变量')
  console.error('复制 .env.example 到 .env 并填写您的 Netlify OAuth 应用信息')
  process.exit(1)
}

/**
 * 生成 Netlify OAuth 授权链接
 */
app.get('/auth/netlify', (req, res) => {
  const state = Buffer.from(JSON.stringify({
    repoUrl: req.query.repoUrl,
    timestamp: Date.now()
  })).toString('base64')
  
  const authUrl = `https://app.netlify.com/authorize?` +
    `client_id=${NETLIFY_CLIENT_ID}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `state=${state}`
  
  res.json({ authUrl, state })
})

/**
 * Netlify OAuth 回调
 */
app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query
  
  try {
    // 获取 access token
    const tokenResponse = await axios.post('https://api.netlify.com/oauth/token', {
      grant_type: 'authorization_code',
      code,
      client_id: NETLIFY_CLIENT_ID,
      client_secret: NETLIFY_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI
    })
    
    const accessToken = tokenResponse.data.access_token
    
    // 解析 state 获取 repoUrl
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    
    // 重定向回前端，带上 token
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/deploy/callback?` +
      `token=${accessToken}&` +
      `repoUrl=${encodeURIComponent(stateData.repoUrl)}`
    
    res.redirect(redirectUrl)
  } catch (error) {
    console.error('OAuth 回调失败:', error.response?.data || error.message)
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/deploy/error?message=授权失败`)
  }
})

/**
 * 创建 Netlify 站点并关联 GitHub
 */
app.post('/api/deploy', async (req, res) => {
  const { token, repoUrl, buildCommand = 'npm run build', publishDir = 'dist' } = req.body
  
  try {
    // 从 GitHub URL 提取 owner 和 repo
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!match) {
      return res.status(400).json({ error: '无效的 GitHub 仓库地址' })
    }
    const [, owner, repo] = match
    const cleanRepo = repo.replace(/\.git$/, '')
    
    // 创建站点
    const siteResponse = await axios.post('https://api.netlify.com/api/v1/sites', {
      name: `${cleanRepo}-${Date.now()}`,
      repo: {
        provider: 'github',
        repo_path: `${owner}/${cleanRepo}`,
        repo_branch: 'main',
        cmd: buildCommand,
        dir: publishDir,
        env: {
          NODE_VERSION: '18'
        }
      },
      build_settings: {
        cmd: buildCommand,
        dir: publishDir,
        env: {
          NODE_VERSION: '18'
        }
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    const site = siteResponse.data
    
    res.json({
      success: true,
      siteId: site.id,
      siteName: site.name,
      url: `https://${site.name}.netlify.app`,
      adminUrl: `https://app.netlify.com/sites/${site.name}/overview`
    })
  } catch (error) {
    console.error('部署失败:', error.response?.data || error.message)
    res.status(500).json({
      error: error.response?.data?.message || '部署失败'
    })
  }
})

/**
 * 查询部署状态
 */
app.get('/api/deploy-status', async (req, res) => {
  const { token, siteId } = req.query
  
  try {
    const response = await axios.get(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const latestDeploy = response.data[0]
    
    res.json({
      status: latestDeploy?.state || 'pending',
      deployUrl: latestDeploy?.ssl_url || latestDeploy?.url
    })
  } catch (error) {
    res.status(500).json({ error: '获取部署状态失败' })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
