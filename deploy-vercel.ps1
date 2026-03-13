# Vercel 部署脚本
# 用于将 AI Deploy 项目部署到 Vercel

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI Deploy - Vercel 部署工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 vercel CLI
$vercelPath = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelPath) {
    Write-Host "正在安装 Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
    Write-Host "Vercel CLI 安装完成" -ForegroundColor Green
}

# 检查是否已登录
Write-Host "检查 Vercel 登录状态..." -ForegroundColor Yellow
$loginCheck = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "需要先登录 Vercel 账号" -ForegroundColor Yellow
    Write-Host "正在打开浏览器进行登录..." -ForegroundColor Cyan
    vercel login
}

Write-Host "Vercel 登录状态检查通过" -ForegroundColor Green
Write-Host ""

# 部署项目
Write-Host "开始部署到 Vercel..." -ForegroundColor Cyan
Write-Host ""

# 使用 --prod 部署到生产环境
vercel --prod

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  部署完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
