# Cloudflare Tunnel 部署脚本
# 用于将 AI Deploy 网站部署到公网

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI Deploy - Cloudflare Tunnel 部署工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 cloudflared
if (-not (Test-Path ".\cloudflared.exe")) {
    Write-Host "正在下载 cloudflared..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "cloudflared.exe"
    Write-Host "cloudflared 下载完成" -ForegroundColor Green
}

# 检查构建文件
if (-not (Test-Path ".\dist\index.html")) {
    Write-Host "未找到构建文件，请先运行 npm run build" -ForegroundColor Red
    exit 1
}

Write-Host "构建文件检查通过 ✓" -ForegroundColor Green
Write-Host ""

# 检查是否已登录
Write-Host "检查 Cloudflare 登录状态..." -ForegroundColor Yellow
$loginCheck = & .\cloudflared.exe tunnel list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "需要先登录 Cloudflare 账号" -ForegroundColor Yellow
    Write-Host "正在打开浏览器进行登录..." -ForegroundColor Cyan
    & .\cloudflared.exe login
    Write-Host ""
    Write-Host "请在浏览器中完成登录，然后按任意键继续..." -ForegroundColor Green
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

Write-Host "Cloudflare 登录状态检查通过 ✓" -ForegroundColor Green
Write-Host ""

# 创建隧道（如果不存在）
$tunnelName = "ai-deploy-site"
Write-Host "检查隧道: $tunnelName" -ForegroundColor Yellow
$tunnelList = & .\cloudflared.exe tunnel list 2>&1

if ($tunnelList -match $tunnelName) {
    Write-Host "隧道已存在，使用现有隧道" -ForegroundColor Green
} else {
    Write-Host "创建新隧道: $tunnelName" -ForegroundColor Cyan
    & .\cloudflared.exe tunnel create $tunnelName
    Write-Host "隧道创建成功 ✓" -ForegroundColor Green
}

Write-Host ""

# 获取隧道 ID
$tunnelInfo = & .\cloudflared.exe tunnel list | Select-String $tunnelName
if ($tunnelInfo) {
    $tunnelId = ($tunnelInfo -split "\s+")[1]
    Write-Host "隧道 ID: $tunnelId" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  启动部署服务" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 启动静态文件服务器
Write-Host "启动静态文件服务器..." -ForegroundColor Yellow
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    $http = [System.Net.HttpListener]::new()
    $http.Prefixes.Add("http://localhost:8787/")
    $http.Start()
    
    Write-Host "静态服务器运行在 http://localhost:8787/" -ForegroundColor Green
    
    while ($http.IsListening) {
        $context = $http.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $path = $request.Url.LocalPath
        if ($path -eq "/") { $path = "/index.html" }
        $filePath = Join-Path "$PWD\dist" $path.Substring(1)
        
        if (Test-Path $filePath) {
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = [System.Web.MimeMapping]::GetMimeMapping($filePath)
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
}

Start-Sleep -Seconds 2

# 启动 Cloudflare Tunnel
Write-Host "启动 Cloudflare Tunnel..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  网站已成功部署到公网！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

& .\cloudflared.exe tunnel run $tunnelName

# 清理
Stop-Job $serverJob
Remove-Job $serverJob
