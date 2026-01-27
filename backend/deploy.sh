#!/bin/bash

# ==============================================
# Script de Deploy Automático - AppPedido Backend
# ==============================================
# Este script automatiza o deploy do backend
# Use: ./deploy.sh
# ==============================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

# Banner
echo ""
echo "==========================================="
echo "  🚀 Deploy AppPedido Backend"
echo "==========================================="
echo ""

# 1. Verificar se está no diretório correto
print_info "Verificando diretório..."
if [ ! -f "server.js" ]; then
    print_error "Arquivo server.js não encontrado!"
    print_error "Execute este script dentro da pasta backend/"
    exit 1
fi
print_success "Diretório correto"

# 2. Verificar Node.js
print_info "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js não está instalado!"
    exit 1
fi
NODE_VERSION=$(node --version)
print_success "Node.js instalado: $NODE_VERSION"

# 3. Verificar arquivo .env
print_info "Verificando arquivo .env..."
if [ ! -f ".env" ]; then
    print_warning "Arquivo .env não encontrado!"
    print_info "Criando .env a partir do .env.example..."

    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Arquivo .env criado"
        print_warning "IMPORTANTE: Edite o arquivo .env com as configurações corretas!"
        print_info "Execute: nano .env"
        read -p "Pressione ENTER após editar o .env..."
    else
        print_error "Arquivo .env.example não encontrado!"
        exit 1
    fi
else
    print_success "Arquivo .env encontrado"
fi

# 4. Instalar/Atualizar dependências
print_info "Instalando dependências..."
npm install --production
print_success "Dependências instaladas"

# 5. Testar conexão com banco
print_info "Testando conexão com o banco de dados..."
print_warning "(Se houver erro, verifique as credenciais no .env)"

# 6. Verificar se PM2 está instalado
print_info "Verificando PM2..."
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 não está instalado"
    read -p "Deseja instalar PM2? (s/n): " install_pm2
    if [ "$install_pm2" = "s" ] || [ "$install_pm2" = "S" ]; then
        print_info "Instalando PM2..."
        sudo npm install -g pm2
        print_success "PM2 instalado"
    else
        print_warning "Continuando sem PM2..."
    fi
else
    PM2_VERSION=$(pm2 --version)
    print_success "PM2 instalado: $PM2_VERSION"
fi

# 7. Perguntar modo de deploy
echo ""
echo "==========================================="
echo "  Escolha o modo de deploy:"
echo "==========================================="
echo "1) PM2 (Recomendado para produção)"
echo "2) Direto (npm start)"
echo "3) Apenas testar"
echo ""
read -p "Escolha (1/2/3): " deploy_mode

case $deploy_mode in
    1)
        print_info "Deploy com PM2..."

        # Verificar se já está rodando
        if pm2 list | grep -q "apppedido-backend"; then
            print_info "Aplicação já está rodando, reiniciando..."
            pm2 restart apppedido-backend
        else
            print_info "Iniciando nova instância..."
            pm2 start server.js --name apppedido-backend
        fi

        pm2 save
        print_success "Deploy com PM2 concluído!"

        echo ""
        print_info "Comandos úteis:"
        echo "  pm2 status              - Ver status"
        echo "  pm2 logs apppedido-backend - Ver logs"
        echo "  pm2 restart apppedido-backend - Reiniciar"
        echo "  pm2 stop apppedido-backend - Parar"
        ;;
    2)
        print_info "Iniciando servidor diretamente..."
        print_warning "O servidor vai rodar no terminal atual"
        print_warning "Use Ctrl+C para parar"
        echo ""
        npm start
        ;;
    3)
        print_info "Testando configuração..."
        node -e "require('dotenv').config(); console.log('✓ .env carregado'); const pool = require('./db'); pool.query('SELECT NOW()', (err, res) => { if (err) { console.error('✗ Erro no banco:', err.message); process.exit(1); } else { console.log('✓ Banco conectado:', res.rows[0].now); process.exit(0); } });"
        print_success "Teste concluído!"
        ;;
    *)
        print_error "Opção inválida!"
        exit 1
        ;;
esac

# 8. Verificar se está rodando
echo ""
print_info "Verificando servidor..."
sleep 2

PORT=$(grep "^PORT=" .env | cut -d'=' -f2 || echo "3001")
if curl -s http://localhost:$PORT > /dev/null; then
    print_success "Servidor está respondendo na porta $PORT"
else
    print_warning "Não foi possível verificar o servidor"
    print_info "Verifique manualmente: curl http://localhost:$PORT"
fi

# 9. Mostrar informações finais
echo ""
echo "==========================================="
echo "  ✅ Deploy Concluído!"
echo "==========================================="
echo ""

SERVER_IP=$(grep "^SERVER_PUBLIC_IP=" .env | cut -d'=' -f2 || echo "131.100.231.199")
echo "📡 URL Local: http://localhost:$PORT"
echo "🌐 URL Rede: http://$SERVER_IP:$PORT"
echo ""
echo "🔍 Teste a API:"
echo "  curl http://$SERVER_IP:$PORT/api/auth/validate-cnpj"
echo ""

if [ "$deploy_mode" = "1" ]; then
    echo "📊 Monitorar:"
    echo "  pm2 logs apppedido-backend"
    echo "  pm2 monit"
fi

echo ""
print_success "Backend deployado com sucesso! 🎉"
echo ""
