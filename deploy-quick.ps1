# 快速部署脚本 - 使用临时隧道（无需登录）
# 适合快速测试，每次运行会生成不同的临时域名

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI Deploy - 快速公网部署" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 cloudflared
if (-not (Test-Path ".\cloudflared.exe")) {
    Write-Host "正在下载 cloudflared..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "cloudflared.exe"
    Write-Host "cloudflared 下载完成 ✓" -ForegroundColor Green
}

# 检查构建文件
if (-not (Test-Path ".\dist\index.html")) {
    Write-Host "未找到构建文件，正在构建..." -ForegroundColor Yellow
    npm run build
    if (-not (Test-Path ".\dist\index.html")) {
        Write-Host "构建失败，请检查错误" -ForegroundColor Red
        exit 1
    }
}

Write-Host "构建文件检查通过 ✓" -ForegroundColor Green
Write-Host ""

# 启动静态文件服务器
Write-Host "启动静态文件服务器..." -ForegroundColor Yellow
$server = Start-Process -FilePath "npx" -ArgumentList "serve", "dist", "-l", "8787" -NoNewWindow -PassThru

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  正在创建公网隧道..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "请等待，系统会生成一个公网访问地址..." -ForegroundColor Yellow
Write-Host ""

# 使用 try-finally 确保清理
try {
    # 启动临时隧道
    & .\cloudflared.exe tunnel --url http://localhost:8787
} finally {
    Write-Host ""
    Write-Host "正在关闭服务器..." -ForegroundColor Yellow
    Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
}
