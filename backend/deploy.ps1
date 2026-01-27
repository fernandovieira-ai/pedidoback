# ==============================================
# Script de Deploy Automático - AppPedido Backend (Windows)
# ==============================================
# Este script automatiza o deploy do backend no Windows
# Use: .\deploy.ps1
# ==============================================

# Configurar encoding para UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Funções para output colorido
function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning2 {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error2 {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Banner
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  🚀 Deploy AppPedido Backend" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se está no diretório correto
Write-Info "Verificando diretório..."
if (-not (Test-Path "server.js")) {
    Write-Error2 "Arquivo server.js não encontrado!"
    Write-Error2 "Execute este script dentro da pasta backend\"
    exit 1
}
Write-Success "Diretório correto"

# 2. Verificar Node.js
Write-Info "Verificando Node.js..."
try {
    $nodeVersion = node --version
    Write-Success "Node.js instalado: $nodeVersion"
} catch {
    Write-Error2 "Node.js não está instalado!"
    Write-Info "Baixe em: https://nodejs.org/"
    exit 1
}

# 3. Verificar arquivo .env
Write-Info "Verificando arquivo .env..."
if (-not (Test-Path ".env")) {
    Write-Warning2 "Arquivo .env não encontrado!"
    Write-Info "Criando .env a partir do .env.example..."

    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Success "Arquivo .env criado"
        Write-Warning2 "IMPORTANTE: Edite o arquivo .env com as configurações corretas!"
        Write-Info "Execute: notepad .env"
        Read-Host "Pressione ENTER após editar o .env..."
    } else {
        Write-Error2 "Arquivo .env.example não encontrado!"
        exit 1
    }
} else {
    Write-Success "Arquivo .env encontrado"
}

# 4. Instalar/Atualizar dependências
Write-Info "Instalando dependências..."
npm install --production
if ($LASTEXITCODE -eq 0) {
    Write-Success "Dependências instaladas"
} else {
    Write-Error2 "Erro ao instalar dependências"
    exit 1
}

# 5. Verificar se PM2 está instalado
Write-Info "Verificando PM2..."
try {
    $pm2Version = pm2 --version
    Write-Success "PM2 instalado: $pm2Version"
    $pm2Installed = $true
} catch {
    Write-Warning2 "PM2 não está instalado"
    $installPm2 = Read-Host "Deseja instalar PM2? (s/n)"
    if ($installPm2 -eq "s" -or $installPm2 -eq "S") {
        Write-Info "Instalando PM2..."
        Write-Warning2 "Será necessário executar como Administrador"
        npm install -g pm2
        if ($LASTEXITCODE -eq 0) {
            Write-Success "PM2 instalado"
            $pm2Installed = $true
        } else {
            Write-Error2 "Erro ao instalar PM2"
            $pm2Installed = $false
        }
    } else {
        Write-Warning2 "Continuando sem PM2..."
        $pm2Installed = $false
    }
}

# 6. Verificar/Configurar Firewall
Write-Info "Verificando regras de firewall..."
$firewallRule = Get-NetFirewallRule -DisplayName "AppPedido Backend" -ErrorAction SilentlyContinue
if (-not $firewallRule) {
    Write-Warning2 "Regra de firewall não encontrada"
    $createRule = Read-Host "Deseja criar regra de firewall para porta 3001? (s/n)"
    if ($createRule -eq "s" -or $createRule -eq "S") {
        Write-Info "Criando regra de firewall..."
        Write-Warning2 "Será necessário executar como Administrador"
        try {
            New-NetFirewallRule -DisplayName "AppPedido Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
            Write-Success "Regra de firewall criada"
        } catch {
            Write-Warning2 "Não foi possível criar a regra (permissões de administrador necessárias)"
            Write-Info "Crie manualmente: New-NetFirewallRule -DisplayName 'AppPedido Backend' -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow"
        }
    }
} else {
    Write-Success "Regra de firewall já existe"
}

# 7. Perguntar modo de deploy
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Escolha o modo de deploy:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "1) PM2 (Recomendado para produção)"
Write-Host "2) Direto (npm start)"
Write-Host "3) Apenas testar"
Write-Host ""
$deployMode = Read-Host "Escolha (1/2/3)"

switch ($deployMode) {
    "1" {
        if (-not $pm2Installed) {
            Write-Error2 "PM2 não está instalado!"
            exit 1
        }

        Write-Info "Deploy com PM2..."

        # Verificar se já está rodando
        $pm2List = pm2 list 2>&1 | Out-String
        if ($pm2List -match "apppedido-backend") {
            Write-Info "Aplicação já está rodando, reiniciando..."
            pm2 restart apppedido-backend
        } else {
            Write-Info "Iniciando nova instância..."
            pm2 start server.js --name apppedido-backend
        }

        pm2 save
        Write-Success "Deploy com PM2 concluído!"

        Write-Host ""
        Write-Info "Comandos úteis:"
        Write-Host "  pm2 status                  - Ver status"
        Write-Host "  pm2 logs apppedido-backend  - Ver logs"
        Write-Host "  pm2 restart apppedido-backend - Reiniciar"
        Write-Host "  pm2 stop apppedido-backend  - Parar"
    }
    "2" {
        Write-Info "Iniciando servidor diretamente..."
        Write-Warning2 "O servidor vai rodar no terminal atual"
        Write-Warning2 "Use Ctrl+C para parar"
        Write-Host ""
        npm start
    }
    "3" {
        Write-Info "Testando configuração..."
        node -e "require('dotenv').config(); console.log('✓ .env carregado');"
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Teste concluído!"
        } else {
            Write-Error2 "Erro no teste"
        }
    }
    default {
        Write-Error2 "Opção inválida!"
        exit 1
    }
}

# 8. Verificar se está rodando
if ($deployMode -ne "3") {
    Write-Host ""
    Write-Info "Verificando servidor..."
    Start-Sleep -Seconds 2

    # Ler porta do .env
    $envContent = Get-Content ".env" -ErrorAction SilentlyContinue
    $portLine = $envContent | Where-Object { $_ -match "^PORT=" }
    if ($portLine) {
        $port = ($portLine -split "=")[1]
    } else {
        $port = "3001"
    }

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Success "Servidor está respondendo na porta $port"
    } catch {
        Write-Warning2 "Não foi possível verificar o servidor"
        Write-Info "Verifique manualmente: http://localhost:$port"
    }
}

# 9. Mostrar informações finais
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  ✅ Deploy Concluído!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Ler configurações do .env
$envContent = Get-Content ".env" -ErrorAction SilentlyContinue
$portLine = $envContent | Where-Object { $_ -match "^PORT=" }
$ipLine = $envContent | Where-Object { $_ -match "^SERVER_PUBLIC_IP=" }

if ($portLine) { $port = ($portLine -split "=")[1] } else { $port = "3001" }
if ($ipLine) { $serverIP = ($ipLine -split "=")[1] } else { $serverIP = "131.100.231.199" }

Write-Host "📡 URL Local: http://localhost:$port" -ForegroundColor Yellow
Write-Host "🌐 URL Rede: http://${serverIP}:$port" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔍 Teste a API:" -ForegroundColor Cyan
Write-Host "  Invoke-WebRequest -Uri http://${serverIP}:$port/api/auth/validate-cnpj"
Write-Host ""

if ($deployMode -eq "1") {
    Write-Host "📊 Monitorar:" -ForegroundColor Cyan
    Write-Host "  pm2 logs apppedido-backend"
    Write-Host "  pm2 monit"
}

Write-Host ""
Write-Success "Backend deployado com sucesso! 🎉"
Write-Host ""
