# Script para Iniciar Backend e App automaticamente
# Execute este arquivo: .\iniciar-tudo.ps1

Write-Host ""
Write-Host "🚀 INICIANDO APPPEDIDO - BACKEND + APP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Matar processos node existentes (evitar conflito de portas)
Write-Host "🧹 Limpando processos anteriores..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Obter diretório do script
$SCRIPT_DIR = $PSScriptRoot

# Terminal 1: Backend
Write-Host "🖥️ Iniciando Backend em novo terminal..." -ForegroundColor Green
Start-Process powershell -ArgumentList `
    "-NoExit", `
    "-Command", `
    "cd '$SCRIPT_DIR\backend'; Write-Host ''; Write-Host '🚀 BACKEND - API DO APPPEDIDO' -ForegroundColor Green; Write-Host '==============================' -ForegroundColor Green; Write-Host ''; node server.js"

# Aguardar backend iniciar
Write-Host "⏳ Aguardando backend iniciar (5 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Terminal 2: App Expo
Write-Host "📱 Iniciando App Expo em novo terminal..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList `
    "-NoExit", `
    "-Command", `
    "cd '$SCRIPT_DIR'; Write-Host ''; Write-Host '📱 APP EXPO - APPPEDIDO' -ForegroundColor Cyan; Write-Host '========================' -ForegroundColor Cyan; Write-Host ''; Write-Host 'Aguarde o QR Code aparecer...' -ForegroundColor Yellow; Write-Host ''; npm start"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ SERVIDORES INICIADOS COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Informações:" -ForegroundColor Yellow
Write-Host "   🖥️ Backend API: http://localhost:3001" -ForegroundColor White
Write-Host "   📱 App Expo: Aguarde QR Code no 2º terminal" -ForegroundColor White
Write-Host ""
Write-Host "📋 Próximos Passos:" -ForegroundColor Yellow
Write-Host "   1. Aguarde o QR Code aparecer no terminal do App" -ForegroundColor White
Write-Host "   2. Pressione 'a' para abrir no Android Emulator" -ForegroundColor White
Write-Host "   3. OU escaneie o QR Code com Expo Go no celular" -ForegroundColor White
Write-Host ""
Write-Host "⚠️ IMPORTANTE:" -ForegroundColor Red
Write-Host "   - NÃO FECHE as 2 janelas que abriram!" -ForegroundColor Yellow
Write-Host "   - Para parar: Ctrl+C em cada terminal" -ForegroundColor Yellow
Write-Host ""
Write-Host "📖 Dúvidas? Leia: INICIAR.md" -ForegroundColor Cyan
Write-Host ""
