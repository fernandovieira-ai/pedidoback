# Script para iniciar o backend local
# Execute: .\iniciar-backend-local.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INICIANDO BACKEND LOCAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está na pasta correta
if (-not (Test-Path "backend\server.js")) {
    Write-Host "❌ ERRO: Não foi possível encontrar backend\server.js" -ForegroundColor Red
    Write-Host ""
    Write-Host "Execute este script na pasta raiz do projeto:" -ForegroundColor Yellow
    Write-Host "cd c:\Linx\cliente\digitalrf\projeto\apppedido\AppPedidoExpo" -ForegroundColor White
    Write-Host ".\iniciar-backend-local.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Verificar se a porta 3001 está em uso
Write-Host "Verificando se a porta 3001 está disponível..." -ForegroundColor Yellow

$portInUse = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Host ""
    Write-Host "⚠️  A porta 3001 já está em uso!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Deseja encerrar o processo e reiniciar o backend? (S/N)" -ForegroundColor Yellow
    $response = Read-Host

    if ($response -eq "S" -or $response -eq "s") {
        Write-Host ""
        Write-Host "Encerrando processo na porta 3001..." -ForegroundColor Yellow
        Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue |
            ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Seconds 2
        Write-Host "✅ Processo encerrado!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Operação cancelada." -ForegroundColor Red
        Write-Host ""
        Write-Host "O backend já está rodando na porta 3001." -ForegroundColor Yellow
        Write-Host "Configure o app para usar modo 'network' e inicie:" -ForegroundColor White
        Write-Host "  1. Edite src/config/api.ts" -ForegroundColor White
        Write-Host "  2. MODO_ATUAL = 'network'" -ForegroundColor White
        Write-Host "  3. npx expo start --clear" -ForegroundColor White
        Write-Host ""
        exit 0
    }
}

# Entrar na pasta backend
Write-Host ""
Write-Host "Entrando na pasta backend..." -ForegroundColor Yellow
Set-Location backend

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "⚠️  Dependências não instaladas. Instalando..." -ForegroundColor Yellow
    Write-Host ""
    npm install

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ ERRO ao instalar dependências!" -ForegroundColor Red
        Write-Host ""
        Set-Location ..
        exit 1
    }

    Write-Host ""
    Write-Host "✅ Dependências instaladas com sucesso!" -ForegroundColor Green
}

# Verificar se .env existe
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "⚠️  AVISO: Arquivo .env não encontrado!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "O backend precisa do arquivo .env com as configurações." -ForegroundColor White
    Write-Host "Verifique se o arquivo .env existe em backend/.env" -ForegroundColor White
    Write-Host ""
    Write-Host "Deseja continuar mesmo assim? (S/N)" -ForegroundColor Yellow
    $response = Read-Host

    if ($response -ne "S" -and $response -ne "s") {
        Write-Host ""
        Write-Host "❌ Operação cancelada." -ForegroundColor Red
        Write-Host ""
        Set-Location ..
        exit 0
    }
}

# Iniciar o backend
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  INICIANDO BACKEND..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📡 URL Local: http://localhost:3001" -ForegroundColor Cyan
Write-Host "🌐 URL Rede: http://192.168.100.12:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para parar o backend, pressione Ctrl+C" -ForegroundColor Gray
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Iniciar o servidor
npm start

# Se o servidor parar, voltar para a pasta raiz
Set-Location ..
