# 🚀 Deploy do Backend no Servidor 131.100.231.199

Este guia explica como fazer o deploy do backend no servidor remoto.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Preparação do Servidor](#preparação-do-servidor)
3. [Deploy Manual](#deploy-manual)
4. [Deploy com PM2](#deploy-com-pm2)
5. [Verificação](#verificação)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

### No Servidor Remoto (131.100.231.199):

- Sistema Operacional: Linux (Ubuntu/Debian recomendado) ou Windows Server
- Node.js 16+ instalado
- npm instalado
- Acesso SSH ou RDP
- Porta 3001 liberada no firewall

### No Computador Local:

- Acesso ao servidor via SSH/RDP
- Cliente FTP/SFTP (FileZilla, WinSCP) ou Git

---

## 🖥️ Preparação do Servidor

### 1. Conectar ao Servidor

**Linux (SSH):**
```bash
ssh usuario@131.100.231.199
```

**Windows (RDP):**
- Usar Remote Desktop Connection
- Host: 131.100.231.199

### 2. Instalar Node.js (se não estiver instalado)

**Linux:**
```bash
# Instalar Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

**Windows:**
- Baixar instalador: https://nodejs.org/
- Executar o instalador
- Verificar no PowerShell: `node --version`

### 3. Criar Diretório do Projeto

**Linux:**
```bash
sudo mkdir -p /var/www/apppedido-backend
sudo chown -R $USER:$USER /var/www/apppedido-backend
cd /var/www/apppedido-backend
```

**Windows:**
```powershell
mkdir C:\apppedido-backend
cd C:\apppedido-backend
```

---

## 📦 Deploy Manual

### Opção 1: Via Git (Recomendado)

**1. Clonar repositório no servidor:**
```bash
cd /var/www/apppedido-backend  # Linux
# ou
cd C:\apppedido-backend  # Windows

git clone [URL_DO_SEU_REPOSITORIO] .
cd backend
```

**2. Instalar dependências:**
```bash
npm install --production
```

**3. Criar arquivo .env:**
```bash
# Copiar exemplo
cp .env.example .env

# Editar arquivo .env
nano .env  # Linux
# ou
notepad .env  # Windows
```

**Conteúdo do .env:**
```env
# Servidor
PORT=3001
NODE_ENV=production
HOST=0.0.0.0

# Banco de dados
DB_HOST=cloud.digitalrf.com.br
DB_PORT=5432
DB_NAME=drfpedido
DB_USER=drfpedido
DB_PASSWORD=A@gTY73AH6df

# CORS (ajustar conforme necessário)
CORS_ORIGINS=*

# IP público
SERVER_PUBLIC_IP=131.100.231.199
```

**4. Testar o servidor:**
```bash
npm start
```

### Opção 2: Via FTP/SFTP

**1. Conectar ao servidor via FileZilla/WinSCP:**
- Host: 131.100.231.199
- Porta: 22 (SFTP) ou 21 (FTP)
- Usuário: [seu_usuario]
- Senha: [sua_senha]

**2. Enviar arquivos:**
- Enviar toda a pasta `backend` para o servidor
- Local no servidor: `/var/www/apppedido-backend/` (Linux) ou `C:\apppedido-backend\` (Windows)

**3. No servidor, instalar dependências:**
```bash
cd /var/www/apppedido-backend
npm install --production
```

**4. Criar arquivo .env** (conforme descrito acima)

**5. Testar:**
```bash
npm start
```

---

## 🔄 Deploy com PM2 (Recomendado para Produção)

PM2 é um gerenciador de processos que mantém o servidor rodando mesmo após reinicialização.

### 1. Instalar PM2 Globalmente

**Linux:**
```bash
sudo npm install -g pm2
```

**Windows (como Administrador):**
```powershell
npm install -g pm2
pm2 install pm2-windows-service
pm2-service-install
```

### 2. Iniciar o Servidor com PM2

```bash
cd /var/www/apppedido-backend  # ou C:\apppedido-backend no Windows

# Iniciar aplicação
pm2 start server.js --name "apppedido-backend"

# Salvar configuração
pm2 save

# Configurar para iniciar automaticamente
pm2 startup
```

### 3. Comandos Úteis do PM2

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs apppedido-backend

# Reiniciar
pm2 restart apppedido-backend

# Parar
pm2 stop apppedido-backend

# Deletar
pm2 delete apppedido-backend

# Monitorar recursos
pm2 monit
```

### 4. Criar Arquivo Ecosystem (Opcional)

Criar arquivo `ecosystem.config.js` na pasta do backend:

```javascript
module.exports = {
  apps: [{
    name: 'apppedido-backend',
    script: './server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

Iniciar com ecosystem:
```bash
pm2 start ecosystem.config.js
```

---

## 🔥 Configurar Firewall

### Linux (UFW):
```bash
# Permitir porta 3001
sudo ufw allow 3001/tcp

# Verificar regras
sudo ufw status
```

### Windows Firewall:
```powershell
# Como Administrador
New-NetFirewallRule -DisplayName "AppPedido Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

---

## ✅ Verificação

### 1. Testar API Localmente no Servidor

```bash
curl http://localhost:3001/api/auth/validate-cnpj
```

### 2. Testar API Externamente

```bash
# Do seu computador local
curl http://131.100.231.199:3001/api/auth/validate-cnpj
```

### 3. Testar no Navegador

Abrir: http://131.100.231.199:3001

Você deve ver uma resposta JSON ou mensagem do servidor.

### 4. Verificar Logs

**PM2:**
```bash
pm2 logs apppedido-backend --lines 100
```

**Direto:**
- Os logs aparecem no console onde você executou `npm start`

---

## 🛠️ Troubleshooting

### Problema: Porta 3001 em uso

**Verificar processo:**
```bash
# Linux
sudo lsof -i :3001
sudo netstat -tulpn | grep :3001

# Windows
netstat -ano | findstr :3001
```

**Matar processo:**
```bash
# Linux
sudo kill -9 [PID]

# Windows
taskkill /PID [PID] /F
```

### Problema: Erro de conexão com banco de dados

1. Verificar se o arquivo .env está correto
2. Testar conexão com o banco:
```bash
# Linux
telnet cloud.digitalrf.com.br 5432

# Windows
Test-NetConnection -ComputerName cloud.digitalrf.com.br -Port 5432
```

### Problema: Não consegue acessar externamente

1. Verificar se o firewall está liberado
2. Verificar se o servidor está escutando em 0.0.0.0:
```bash
# Linux
sudo netstat -tulpn | grep :3001

# Windows
netstat -ano | findstr :3001
```
3. Verificar configuração de rede/roteador
4. Verificar se HOST=0.0.0.0 no arquivo .env

### Problema: CORS errors no app

Editar o arquivo .env e ajustar CORS_ORIGINS:
```env
# Permitir todas as origens (desenvolvimento)
CORS_ORIGINS=*

# Ou específicas (produção)
CORS_ORIGINS=http://localhost:8081,http://192.168.100.12:8081
```

---

## 🔄 Atualizar o Backend

### Com Git:
```bash
cd /var/www/apppedido-backend

# Baixar atualizações
git pull origin main

# Reinstalar dependências (se necessário)
npm install --production

# Reiniciar servidor
pm2 restart apppedido-backend
# ou
npm start
```

### Com FTP:
1. Enviar arquivos atualizados via FTP
2. Reiniciar servidor conforme acima

---

## 📊 Monitoramento

### Ver status do servidor:
```bash
pm2 status
pm2 monit
```

### Ver logs em tempo real:
```bash
pm2 logs apppedido-backend --lines 50
```

### Ver uso de recursos:
```bash
# Linux
htop
# ou
top

# Windows
Gerenciador de Tarefas (Task Manager)
```

---

## 🔐 Segurança

### Recomendações:

1. **Usar HTTPS**: Configurar certificado SSL (Let's Encrypt)
2. **Firewall**: Manter apenas portas necessárias abertas
3. **Senhas**: Usar senhas fortes no .env
4. **Backup**: Fazer backup regular do banco de dados
5. **Logs**: Monitorar logs regularmente
6. **Atualizações**: Manter Node.js e dependências atualizados

---

## 📞 Suporte

Para problemas ou dúvidas:
- Verificar logs: `pm2 logs apppedido-backend`
- Consultar documentação: README.md
- Issues: [criar issue no repositório]

---

**Data:** 14/01/2026
**Versão do Backend:** 1.0.0
**Servidor:** 131.100.231.199:3001
