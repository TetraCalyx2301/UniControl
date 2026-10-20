Write-Host "=== UniControl 自动化同步与静态校验 ===" -ForegroundColor Cyan

# 【缺陷12修复】使用 $PSScriptRoot 替代硬编码绝对路径，支持在任意机器/CI 环境运行
$root = $PSScriptRoot

# 1. 语法检查
Write-Host "[1/3] 正在校验 JavaScript 脚本语法..." -ForegroundColor Yellow
$scripts = @(
  "$root\main.js",
  "$root\preload.js",
  "$root\src\app.js",
  "$root\src\main\sessionManager.js",
  "$root\src\main\dockManager.js",
  "$root\src\main\appLauncher.js"
)

foreach ($file in $scripts) {
  if (Test-Path $file) {
    $check = node -c $file 2>&1
    if ($LASTEXITCODE -ne 0) {
      Write-Host "❌ 语法错误: $file" -ForegroundColor Red
      Write-Host $check
      exit 1
    }
  }
}
Write-Host "✔ 语法校验通过！" -ForegroundColor Green

# 2. 同步文件至 resources/app/
Write-Host "[2/3] 正在同步源码与原生辅助工具至 resources/app 运行环境..." -ForegroundColor Yellow
if (-not (Test-Path "$root\resources\app")) {
  New-Item -ItemType Directory -Path "$root\resources\app" -Force | Out-Null
}
Copy-Item -Path "$root\main.js" -Destination "$root\resources\app\main.js" -Force
Copy-Item -Path "$root\preload.js" -Destination "$root\resources\app\preload.js" -Force
Copy-Item -Path "$root\package.json" -Destination "$root\resources\app\package.json" -Force
if (Test-Path "$root\OppoDockTool.exe") {
  Copy-Item -Path "$root\OppoDockTool.exe" -Destination "$root\resources\app\OppoDockTool.exe" -Force
}
Copy-Item -Path "$root\src\*" -Destination "$root\resources\app\src\" -Recurse -Force

# 3. 校验 resources/app 副本
Write-Host "[3/3] 正在验证运行副本..." -ForegroundColor Yellow
node -c "$root\resources\app\main.js"
node -c "$root\resources\app\preload.js"
node -c "$root\resources\app\src\app.js"
node -c "$root\resources\app\src\main\sessionManager.js"
node -c "$root\resources\app\src\main\dockManager.js"
node -c "$root\resources\app\src\main\appLauncher.js"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🎉 同步完成！所有代码和资源均已无缝就绪。" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
