# Script de Teste do Backend Railway
# Execute: .\testar-backend.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTE DO BACKEND NO RAILWAY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$url = "https://backeend-pedido-production-25a7.up.railway.app"

# Teste 1: Health Check
Write-Host "Teste 1: Health Check (/health)" -ForegroundColor Yellow
Write-Host "URL: $url/health" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$url/health" -Method Get -ContentType "application/json" -ErrorAction Stop

    if ($response.status -eq "OK") {
        Write-Host "✅ SUCESSO: Backend Node.js está rodando!" -ForegroundColor Green
        Write-Host "   Status: $($response.status)" -ForegroundColor Green
        Write-Host "   Ambiente: $($response.environment)" -ForegroundColor Green
        Write-Host "   Database: $($response.database)" -ForegroundColor Green
        Write-Host "   Uptime: $($response.uptime) segundos" -ForegroundColor Green
        $backendOk = $true
    } else {
        Write-Host "⚠️  AVISO: Resposta inesperada" -ForegroundColor Yellow
        Write-Host ($response | ConvertTo-Json -Depth 3)
        $backendOk = $false
    }
} catch {
    # Verifica se a resposta contém "exposdk" (indicando que é Expo)
    $errorResponse = $_.Exception.Response
    if ($errorResponse) {
        $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
        $responseBody = $reader.ReadToEnd()

        if ($responseBody -like "*exposdk*" -or $responseBody -like "*launchAsset*") {
            Write-Host "❌ ERRO: Railway está servindo o Expo em vez do backend!" -ForegroundColor Red
            Write-Host ""
            Write-Host "   SOLUÇÃO:" -ForegroundColor Yellow
            Write-Host "   1. Acesse Railway → Settings → Service Settings" -ForegroundColor White
            Write-Host "   2. Configure 'Root Directory' como: backend" -ForegroundColor White
            Write-Host "   3. Aguarde o redeploy automático" -ForegroundColor White
        } else {
            Write-Host "❌ ERRO: Não foi possível conectar ao backend" -ForegroundColor Red
            Write-Host "   Detalhes: $($_.Exception.Message)" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ ERRO: Não foi possível conectar ao backend" -ForegroundColor Red
        Write-Host "   Detalhes: $($_.Exception.Message)" -ForegroundColor Gray
    }
    $backendOk = $false
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Teste 2: API Health Check
Write-Host ""
Write-Host "Teste 2: API Health Check (/api/health)" -ForegroundColor Yellow
Write-Host "URL: $url/api/health" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$url/api/health" -Method Get -ContentType "application/json" -ErrorAction Stop

    if ($response.status -eq "OK") {
        Write-Host "✅ SUCESSO: Endpoint /api/health funcionando!" -ForegroundColor Green
        $apiOk = $true
    } else {
        Write-Host "⚠️  AVISO: Resposta inesperada" -ForegroundColor Yellow
        $apiOk = $false
    }
} catch {
    Write-Host "❌ ERRO: Endpoint /api/health não respondeu" -ForegroundColor Red
    $apiOk = $false
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Teste 3: Validar CNPJ
Write-Host ""
Write-Host "Teste 3: Validar CNPJ (POST /api/auth/validate-cnpj)" -ForegroundColor Yellow
Write-Host "URL: $url/api/auth/validate-cnpj" -ForegroundColor Gray
Write-Host "CNPJ Teste: 53865832000137" -ForegroundColor Gray
Write-Host ""

if ($backendOk) {
    try {
        $body = @{
            cnpj = "53865832000137"
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$url/api/auth/validate-cnpj" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop

        if ($response.success) {
            Write-Host "✅ SUCESSO: Validação de CNPJ funcionando!" -ForegroundColor Green
            Write-Host "   CNPJ: $($response.data.cnpj)" -ForegroundColor Green
            Write-Host "   Schema: $($response.data.schema)" -ForegroundColor Green
            $cnpjOk = $true
        } else {
            Write-Host "⚠️  AVISO: CNPJ não validado" -ForegroundColor Yellow
            Write-Host "   Mensagem: $($response.message)" -ForegroundColor Gray
            $cnpjOk = $false
        }
    } catch {
        Write-Host "❌ ERRO: Falha ao validar CNPJ" -ForegroundColor Red
        Write-Host "   Isso pode significar:" -ForegroundColor Yellow
        Write-Host "   - CNPJ não existe no banco de dados" -ForegroundColor White
        Write-Host "   - Banco de dados inacessível" -ForegroundColor White
        Write-Host "   - Credenciais do banco incorretas" -ForegroundColor White
        $cnpjOk = $false
    }
} else {
    Write-Host "⏭️  PULADO: Backend não está respondendo corretamente" -ForegroundColor Gray
    $cnpjOk = $false
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Resumo
Write-Host "RESUMO DOS TESTES:" -ForegroundColor Cyan
Write-Host ""

if ($backendOk) {
    Write-Host "✅ Backend Node.js: OK" -ForegroundColor Green
} else {
    Write-Host "❌ Backend Node.js: FALHOU" -ForegroundColor Red
}

if ($apiOk) {
    Write-Host "✅ Endpoint /api/health: OK" -ForegroundColor Green
} else {
    Write-Host "❌ Endpoint /api/health: FALHOU" -ForegroundColor Red
}

if ($cnpjOk) {
    Write-Host "✅ Validação de CNPJ: OK" -ForegroundColor Green
} else {
    Write-Host "⚠️  Validação de CNPJ: VERIFICAR" -ForegroundColor Yellow
}

Write-Host ""

# Resultado final
if ($backendOk -and $apiOk) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  🎉 BACKEND FUNCIONANDO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximo passo: Testar o app mobile!" -ForegroundColor Yellow
    Write-Host "Execute: npx expo start --clear" -ForegroundColor White
} elseif (-not $backendOk) {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ⚠️  BACKEND NÃO ESTÁ FUNCIONANDO" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Configure o Root Directory no Railway:" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://railway.app" -ForegroundColor White
    Write-Host "2. Settings → Service Settings" -ForegroundColor White
    Write-Host "3. Root Directory: backend" -ForegroundColor White
    Write-Host "4. Aguarde o redeploy" -ForegroundColor White
} else {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  ⚠️  VERIFIQUE AS CONFIGURAÇÕES" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Para mais informações, veja: TESTE-COMPLETO.md" -ForegroundColor Gray
Write-Host ""
