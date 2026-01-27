# Script de Deploy Rápido - AppPedidoExpo Backend (Windows)
# Execute no PowerShell como Administrador

Write-Host "🚀 Iniciando deploy do AppPedidoExpo Backend..." -ForegroundColor Cyan

# Configurações
$APP_DIR = "C:\apppedido"
$BACKEND_DIR = "$APP_DIR\backend"
$APP_NAME = "apppedido-backend"
$PORT = 3001

# Verificar se Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado! Baixe em: https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Verificar se npm está instalado
try {
    $npmVersion = npm --version
    Write-Host "✅ npm $npmVersion encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ npm não encontrado!" -ForegroundColor Red
    exit 1
}

# Criar diretório se não existir
if (-not (Test-Path $APP_DIR)) {
    Write-Host "📁 Criando diretório $APP_DIR..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $APP_DIR -Force | Out-Null
}

# Verificar se a pasta backend existe
if (-not (Test-Path $BACKEND_DIR)) {
    Write-Host "❌ Pasta backend\ não encontrada em $APP_DIR" -ForegroundColor Red
    Write-Host "   Copie a pasta backend\ para $APP_DIR primeiro!" -ForegroundColor Yellow
    Write-Host "   Exemplo: Copy-Item -Recurse .\backend $APP_DIR\" -ForegroundColor Yellow
    exit 1
}

# Entrar na pasta backend
Set-Location $BACKEND_DIR

Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependências instaladas" -ForegroundColor Green

# Instalar PM2 se não estiver instalado
try {
    pm2 --version | Out-Null
    Write-Host "✅ PM2 já está instalado" -ForegroundColor Green
} catch {
    Write-Host "📦 Instalando PM2..." -ForegroundColor Yellow
    npm install -g pm2
    npm install -g pm2-windows-startup
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar PM2!" -ForegroundColor Red
        exit 1
    }
    
    # Configurar PM2 para iniciar no boot (Windows)
    pm2-startup install
    
    Write-Host "✅ PM2 instalado" -ForegroundColor Green
}

# Parar instância anterior do PM2 se existir
$pm2List = pm2 list
if ($pm2List -match $APP_NAME) {
    Write-Host "🔄 Parando instância anterior..." -ForegroundColor Yellow
    pm2 stop $APP_NAME
    pm2 delete $APP_NAME
}

# Iniciar com PM2
Write-Host "🚀 Iniciando servidor com PM2..." -ForegroundColor Cyan
pm2 start server.js --name $APP_NAME

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao iniciar com PM2!" -ForegroundColor Red
    exit 1
}

# Salvar configuração do PM2
pm2 save

# Verificar/Criar regra de firewall
Write-Host "🔥 Verificando firewall..." -ForegroundColor Yellow
$firewallRule = Get-NetFirewallRule -DisplayName "AppPedido API" -ErrorAction SilentlyContinue

if (-not $firewallRule) {
    Write-Host "🔓 Criando regra de firewall para porta $PORT..." -ForegroundColor Yellow
    New-NetFirewallRule -DisplayName "AppPedido API" `
                        -Direction Inbound `
                        -Protocol TCP `
                        -LocalPort $PORT `
                        -Action Allow | Out-Null
    Write-Host "✅ Porta $PORT liberada no firewall" -ForegroundColor Green
} else {
    Write-Host "✅ Regra de firewall já existe" -ForegroundColor Green
}

# Obter IP da máquina
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } | Select-Object -First 1).IPAddress

# Exibir status
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOY CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Status do servidor:" -ForegroundColor Yellow
pm2 status

Write-Host ""
Write-Host "📡 URLs de acesso:" -ForegroundColor Yellow
Write-Host "   Local:  http://localhost:$PORT" -ForegroundColor White
Write-Host "   Rede:   http://${ip}:$PORT" -ForegroundColor White

Write-Host ""
Write-Host "📝 Comandos úteis:" -ForegroundColor Yellow
Write-Host "   pm2 logs $APP_NAME      # Ver logs em tempo real" -ForegroundColor White
Write-Host "   pm2 restart $APP_NAME   # Reiniciar servidor" -ForegroundColor White
Write-Host "   pm2 stop $APP_NAME      # Parar servidor" -ForegroundColor White
Write-Host "   pm2 status              # Ver status" -ForegroundColor White

Write-Host ""
Write-Host "🧪 Teste a API:" -ForegroundColor Yellow
Write-Host "   Invoke-WebRequest -Uri 'http://localhost:$PORT/api/auth/validate-cnpj' ``" -ForegroundColor White
Write-Host "     -Method POST ``" -ForegroundColor White
Write-Host "     -ContentType 'application/json' ``" -ForegroundColor White
Write-Host "     -Body '{\"cnpj\":\"00000000000191\"}'" -ForegroundColor White

Write-Host ""
Write-Host "⚠️ LEMBRE-SE:" -ForegroundColor Red
Write-Host "   1. Configure o IP ($ip) em src/config/api.ts" -ForegroundColor Yellow
Write-Host "      const REMOTE_API_URL = 'http://${ip}:$PORT/api';" -ForegroundColor White
Write-Host "   2. Altere USE_REMOTE_SERVER = true" -ForegroundColor Yellow
Write-Host "   3. Rebuild o app com: npm start" -ForegroundColor Yellow
