# ============================================
# Script para iniciar Expo + Backend para celular
# ============================================

Write-Host "🚀 Iniciando Backend e Expo para rede local..." -ForegroundColor Cyan
Write-Host ""

# Obter IP da rede Wi-Fi
$wifiIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" -ErrorAction SilentlyContinue).IPAddress

if (-not $wifiIP) {
    Write-Host "⚠️  Adaptador Wi-Fi não encontrado. Tentando outra interface..." -ForegroundColor Yellow
    $wifiIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" } | Select-Object -First 1).IPAddress
}

if (-not $wifiIP) {
    Write-Host "❌ Não foi possível detectar o IP da rede local!" -ForegroundColor Red
    Write-Host "Execute 'ipconfig' e configure manualmente o IP em:" -ForegroundColor Yellow
    Write-Host "  - backend\.env (SERVER_PUBLIC_IP)" -ForegroundColor Yellow
    Write-Host "  - src\config\api.ts (network)" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ IP detectado: $wifiIP" -ForegroundColor Green
Write-Host ""

# Atualizar backend/.env
Write-Host "📝 Atualizando backend\.env..." -ForegroundColor Cyan
$envPath = ".\backend\.env"
if (Test-Path $envPath) {
    (Get-Content $envPath) -replace 'SERVER_PUBLIC_IP=.*', "SERVER_PUBLIC_IP=$wifiIP" | Set-Content $envPath
    Write-Host "✅ Backend configurado para $wifiIP" -ForegroundColor Green
}

# Atualizar src/config/api.ts
Write-Host "📝 Atualizando src\config\api.ts..." -ForegroundColor Cyan
$apiPath = ".\src\config\api.ts"
if (Test-Path $apiPath) {
    $content = Get-Content $apiPath -Raw
    $content = $content -replace 'network: "http://[0-9.]+:3001/api"', ('network: "http://' + $wifiIP + ':3001/api"')
    Set-Content $apiPath -Value $content
    Write-Host "✅ API configurada para $wifiIP" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔧 Encerrando processos Node.js anteriores..." -ForegroundColor Cyan
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 1

Write-Host ""
Write-Host "🚀 Iniciando Backend na porta 3001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm start" -WindowStyle Normal

Write-Host "⏳ Aguardando backend inicializar..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "📱 Iniciando Expo (aguarde o QR code)..." -ForegroundColor Cyan
Start-Sleep -Seconds 1

# Iniciar Expo no modo Expo Go
$env:EXPO_USE_HTTPS = "false"
npx expo start --go --clear

Write-Host ""
Write-Host "✅ Tudo pronto!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 INSTRUÇÕES:" -ForegroundColor Yellow
Write-Host "  1. Escaneie o QR code com o app Expo Go no celular" -ForegroundColor White
Write-Host "  2. Certifique-se que o celular está na mesma rede Wi-Fi" -ForegroundColor White
Write-Host ("  3. Backend rodando em: http://" + $wifiIP + ":3001") -ForegroundColor White
Write-Host ""
