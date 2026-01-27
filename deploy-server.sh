#!/bin/bash

# Script de Deploy Rápido - AppPedidoExpo Backend
# Execute no servidor Linux

echo "🚀 Iniciando deploy do AppPedidoExpo Backend..."

# Configurações
APP_DIR="/var/www/apppedido"
BACKEND_DIR="$APP_DIR/backend"
APP_NAME="apppedido-backend"
PORT=3001

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado! Instale com:"
    echo "   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "   sudo apt-get install -y nodejs"
    exit 1
fi

echo "✅ Node.js $(node -v) encontrado"

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado!"
    exit 1
fi

echo "✅ npm $(npm -v) encontrado"

# Criar diretório se não existir
if [ ! -d "$APP_DIR" ]; then
    echo "📁 Criando diretório $APP_DIR..."
    sudo mkdir -p "$APP_DIR"
    sudo chown $USER:$USER "$APP_DIR"
fi

# Entrar no diretório
cd "$APP_DIR" || exit

# Verificar se a pasta backend existe
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Pasta backend/ não encontrada em $APP_DIR"
    echo "   Copie a pasta backend/ para $APP_DIR primeiro!"
    echo "   Exemplo: scp -r backend/ usuario@servidor:$APP_DIR/"
    exit 1
fi

# Entrar na pasta backend
cd "$BACKEND_DIR" || exit

echo "📦 Instalando dependências..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências!"
    exit 1
fi

echo "✅ Dependências instaladas"

# Testar se o servidor inicia
echo "🧪 Testando servidor..."
timeout 5 node server.js &> /tmp/server-test.log &
SERVER_PID=$!
sleep 3

if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Servidor inicia corretamente"
    kill $SERVER_PID
else
    echo "❌ Erro ao iniciar servidor! Logs:"
    cat /tmp/server-test.log
    exit 1
fi

# Instalar PM2 se não estiver instalado
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    sudo npm install -g pm2
    
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao instalar PM2!"
        exit 1
    fi
    
    echo "✅ PM2 instalado"
fi

# Parar instância anterior do PM2 se existir
if pm2 list | grep -q "$APP_NAME"; then
    echo "🔄 Parando instância anterior..."
    pm2 stop "$APP_NAME"
    pm2 delete "$APP_NAME"
fi

# Iniciar com PM2
echo "🚀 Iniciando servidor com PM2..."
pm2 start server.js --name "$APP_NAME"

if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar com PM2!"
    exit 1
fi

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar no boot (apenas primeira vez)
if ! systemctl is-enabled pm2-$USER &> /dev/null; then
    echo "⚙️ Configurando PM2 para iniciar no boot..."
    pm2 startup | grep "sudo" | bash
    pm2 save
fi

# Verificar firewall
echo "🔥 Verificando firewall..."
if command -v ufw &> /dev/null; then
    if ! sudo ufw status | grep -q "$PORT"; then
        echo "🔓 Liberando porta $PORT no firewall..."
        sudo ufw allow $PORT/tcp
        echo "✅ Porta $PORT liberada"
    else
        echo "✅ Porta $PORT já está liberada"
    fi
fi

# Exibir status
echo ""
echo "============================================"
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "============================================"
echo ""
echo "📊 Status do servidor:"
pm2 status

echo ""
echo "📡 URLs de acesso:"
echo "   Local:  http://localhost:$PORT"
echo "   Rede:   http://$(hostname -I | awk '{print $1}'):$PORT"

echo ""
echo "📝 Comandos úteis:"
echo "   pm2 logs $APP_NAME      # Ver logs em tempo real"
echo "   pm2 restart $APP_NAME   # Reiniciar servidor"
echo "   pm2 stop $APP_NAME      # Parar servidor"
echo "   pm2 status              # Ver status"

echo ""
echo "🧪 Teste a API:"
echo "   curl http://localhost:$PORT/api/auth/validate-cnpj \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"cnpj\":\"00000000000191\"}'"

echo ""
echo "⚠️ LEMBRE-SE:"
echo "   1. Configure o IP do servidor em src/config/api.ts"
echo "   2. Altere USE_REMOTE_SERVER = true"
echo "   3. Rebuild o app com: npm start"
