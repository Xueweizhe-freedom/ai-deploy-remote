/**
 * 仓库地址解析工具
 * 解析 GitHub 仓库 URL，提取用户名和仓库名
 */

/**
 * 解析 GitHub 仓库 URL
 * @param {string} url - GitHub 仓库地址
 * @returns {Object|null} - 包含 username 和 repo 的对象，解析失败返回 null
 */
export function parseRepoUrl(url) {
  if (!url || typeof url !== 'string') {
    return null
  }

  // 去除首尾空格
  url = url.trim()

  // 支持多种 GitHub URL 格式
  const patterns = [
    // https://github.com/username/repo
    /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?$/,
    // https://github.com/username/repo.git
    /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\.git$/,
    // git@github.com:username/repo.git
    /^git@github\.com:([^\/]+)\/([^\/]+)\.git$/,
    // github.com/username/repo
    /^github\.com\/([^\/]+)\/([^\/]+)\/?$/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      const username = match[1]
      let repo = match[2]
      
      // 去除 .git 后缀（如果存在）
      repo = repo.replace(/\.git$/, '')
      
      // 验证用户名和仓库名格式
      if (isValidUsername(username) && isValidRepoName(repo)) {
        return {
          username,
          repo,
          fullName: `${username}/${repo}`,
          pagesUrl: `https://${username}.github.io/${repo}`,
          repoUrl: `https://github.com/${username}/${repo}`
        }
      }
    }
  }

  return null
}

/**
 * 验证 GitHub 用户名格式
 * @param {string} username 
 * @returns {boolean}
 */
function isValidUsername(username) {
  // GitHub 用户名规则：
  // - 只能包含字母数字、连字符(-)
  // - 不能以连字符开头或结尾
  // - 长度 1-39 个字符
  const pattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/
  return pattern.test(username) && username.length <= 39
}

/**
 * 验证仓库名格式
 * @param {string} repoName 
 * @returns {boolean}
 */
function isValidRepoName(repoName) {
  // GitHub 仓库名规则：
  // - 只能包含字母数字、连字符(-)、下划线(_)、点(.)
  // - 长度 1-100 个字符
  const pattern = /^[a-zA-Z0-9._-]+$/
  return pattern.test(repoName) && repoName.length <= 100
}

/**
 * 标准化 GitHub URL
 * @param {string} url 
 * @returns {string|null}
 */
export function normalizeRepoUrl(url) {
  const parsed = parseRepoUrl(url)
  if (!parsed) return null
  return parsed.repoUrl
}

/**
 * 获取 GitHub Pages 预览地址
 * @param {string} url 
 * @returns {string|null}
 */
export function getPagesUrl(url) {
  const parsed = parseRepoUrl(url)
  if (!parsed) return null
  return parsed.pagesUrl
}

/**
 * 检查是否为有效的 GitHub 域名
 * @param {string} url 
 * @returns {boolean}
 */
export function isGitHubDomain(url) {
  if (!url) return false
  try {
    const urlObj = new URL(url)
    return urlObj.hostname === 'github.com' || urlObj.hostname.endsWith('.github.com')
  } catch {
    return false
  }
}
