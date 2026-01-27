# 🚀 AppPedido Backend

Backend Node.js/Express para o aplicativo de pedidos AppPedido.

## 📋 Descrição

API REST que fornece endpoints para:
- Autenticação de usuários
- Gestão de pedidos
- Consulta de clientes
- Consulta de produtos/itens
- Consulta de empresas
- Condições de pagamento

## 🛠️ Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **PostgreSQL** - Banco de dados
- **pg** - Cliente PostgreSQL para Node.js
- **cors** - Middleware CORS
- **dotenv** - Gerenciamento de variáveis de ambiente

## 📦 Estrutura de Arquivos

```
backend/
├── server.js           # Servidor principal com todas as rotas
├── db.js              # Configuração do banco de dados
├── package.json       # Dependências do projeto
├── .env.example       # Exemplo de variáveis de ambiente
├── .env              # Variáveis de ambiente (NÃO COMMITAR)
├── .gitignore        # Arquivos ignorados pelo Git
├── deploy.sh         # Script de deploy para Linux
├── deploy.ps1        # Script de deploy para Windows
└── README.md         # Esta documentação
```

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 16 ou superior
- npm
- Acesso ao banco de dados PostgreSQL

### Instalação Local

1. **Navegar até a pasta backend:**
```bash
cd backend
```

2. **Instalar dependências:**
```bash
npm install
```

3. **Configurar variáveis de ambiente:**
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar o arquivo .env
nano .env  # Linux/Mac
notepad .env  # Windows
```

4. **Iniciar o servidor:**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

O servidor estará disponível em: `http://localhost:3001`

## ⚙️ Configuração

### Variáveis de Ambiente (.env)

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
DB_PASSWORD=sua_senha_aqui

# CORS
CORS_ORIGINS=*

# IP público
SERVER_PUBLIC_IP=131.100.231.199
```

### Configuração de CORS

Por padrão, todas as origens são permitidas (`*`). Para produção, especifique as origens:

```env
CORS_ORIGINS=http://localhost:8081,http://192.168.100.12:8081,http://131.100.231.199:8081
```

## 📡 Endpoints da API

### Autenticação

#### Validar CNPJ
```http
POST /api/auth/validate-cnpj
Content-Type: application/json

{
  "cnpj": "12345678000199"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "cnpj": "12345678000199",
  "schema": "empresa01",
  "usuario": "admin",
  "senha": "123456"
}
```

### Clientes

#### Pesquisar Clientes
```http
POST /api/clientes/pesquisar
Content-Type: application/json

{
  "schema": "empresa01",
  "termo": "João",
  "limit": 100,
  "offset": 0
}
```

### Empresas

#### Listar Empresas
```http
POST /api/empresas/listar
Content-Type: application/json

{
  "schema": "empresa01"
}
```

### Itens/Produtos

#### Pesquisar Itens
```http
POST /api/itens/pesquisar
Content-Type: application/json

{
  "schema": "empresa01",
  "cod_empresa": 1,
  "termo": "produto",
  "limit": 50,
  "offset": 0
}
```

### Condições de Pagamento

#### Listar Condições
```http
GET /api/condicoes-pagamento?schema=empresa01&termo=
```

### Pedidos

#### Listar Pedidos
```http
POST /api/pedidos/listar
Content-Type: application/json

{
  "schema": "empresa01",
  "cod_empresa": 1,
  "cod_cliente": 123,
  "data_inicio": "01/01/2024",
  "data_fim": "31/12/2024"
}
```

#### Criar Pedido
```http
POST /api/pedidos/criar
Content-Type: application/json

{
  "schema": "empresa01",
  "cod_empresa": 1,
  "usuario": "admin",
  "cliente": { "cod_pessoa": 123 },
  "dataEntrega": "31/12/2024",
  "itens": [...],
  "subtotal": 1000.00,
  "desconto": 0,
  "acrescimo": 0,
  "frete": 0,
  "total": 1000.00,
  "observacao": "",
  "condicaoPagamento": { "cod_condicao_pagamento": 1 },
  "parcelas": [...]
}
```

#### Detalhes do Pedido
```http
POST /api/pedidos/detalhes
Content-Type: application/json

{
  "schema": "empresa01",
  "seq_pedido": 1
}
```

#### Atualizar Pedido
```http
POST /api/pedidos/atualizar
Content-Type: application/json

{
  "seq_pedido": 1,
  "schema": "empresa01",
  ... (mesmos campos do criar)
}
```

#### Excluir Pedido
```http
POST /api/pedidos/excluir
Content-Type: application/json

{
  "schema": "empresa01",
  "seq_pedido": 1
}
```

## 🖥️ Deploy em Produção

### Servidor: 131.100.231.199

#### Opção 1: Script Automático (Recomendado)

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows:**
```powershell
.\deploy.ps1
```

#### Opção 2: Manual com PM2

1. **Conectar ao servidor:**
```bash
ssh usuario@131.100.231.199
```

2. **Navegar até o diretório:**
```bash
cd /var/www/apppedido-backend
```

3. **Atualizar código (se usando Git):**
```bash
git pull origin main
```

4. **Instalar dependências:**
```bash
npm install --production
```

5. **Configurar .env:**
```bash
nano .env
```

6. **Iniciar com PM2:**
```bash
pm2 start server.js --name apppedido-backend
pm2 save
pm2 startup
```

### Comandos PM2 Úteis

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs apppedido-backend

# Logs em tempo real
pm2 logs apppedido-backend --lines 100 -f

# Reiniciar
pm2 restart apppedido-backend

# Parar
pm2 stop apppedido-backend

# Deletar
pm2 delete apppedido-backend

# Monitorar recursos
pm2 monit
```

## 🔥 Firewall

### Linux (UFW)
```bash
sudo ufw allow 3001/tcp
sudo ufw status
```

### Windows
```powershell
New-NetFirewallRule -DisplayName "AppPedido Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

## 🧪 Testando a API

### Com curl
```bash
# Validar CNPJ
curl -X POST http://131.100.231.199:3001/api/auth/validate-cnpj \
  -H "Content-Type: application/json" \
  -d '{"cnpj":"12345678000199"}'

# Verificar se está online
curl http://131.100.231.199:3001
```

### Com PowerShell
```powershell
# Validar CNPJ
Invoke-WebRequest -Uri http://131.100.231.199:3001/api/auth/validate-cnpj `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"cnpj":"12345678000199"}'
```

### Com navegador
```
http://131.100.231.199:3001
```

## 📊 Monitoramento

### Logs do PM2
```bash
# Ver logs
pm2 logs apppedido-backend

# Logs com filtro
pm2 logs apppedido-backend --err
pm2 logs apppedido-backend --out

# Limpar logs
pm2 flush
```

### Status do servidor
```bash
# PM2
pm2 status
pm2 monit

# Sistema
htop  # Linux
top   # Linux/Mac
```

## 🐛 Troubleshooting

### Porta 3001 em uso
```bash
# Verificar processo
sudo lsof -i :3001  # Linux/Mac
netstat -ano | findstr :3001  # Windows

# Matar processo
sudo kill -9 [PID]  # Linux/Mac
taskkill /PID [PID] /F  # Windows
```

### Erro de conexão com banco
1. Verificar credenciais no .env
2. Testar conexão:
```bash
telnet cloud.digitalrf.com.br 5432
```

### CORS errors
Editar .env e ajustar `CORS_ORIGINS`

### Não consegue acessar externamente
1. Verificar firewall
2. Verificar se está escutando em 0.0.0.0
3. Verificar configuração de rede

## 🔐 Segurança

### Recomendações:

- ✅ Usar HTTPS em produção
- ✅ Configurar CORS apropriadamente
- ✅ Usar senhas fortes no .env
- ✅ Nunca commitar o arquivo .env
- ✅ Manter Node.js atualizado
- ✅ Fazer backup regular do banco
- ✅ Monitorar logs regularmente
- ✅ Limitar acesso SSH ao servidor

## 🔄 Atualizações

### Atualizar backend em produção:

1. **Fazer backup:**
```bash
pm2 save
cp .env .env.backup
```

2. **Atualizar código:**
```bash
git pull origin main
```

3. **Reinstalar dependências:**
```bash
npm install --production
```

4. **Reiniciar:**
```bash
pm2 restart apppedido-backend
```

5. **Verificar logs:**
```bash
pm2 logs apppedido-backend --lines 50
```

## 📞 Suporte

Para problemas ou dúvidas:
- Verificar logs: `pm2 logs apppedido-backend`
- Consultar documentação: [DEPLOY-SERVIDOR.md](../DEPLOY-SERVIDOR.md)
- Abrir issue no repositório

## 📄 Licença

Propriedade de DigitalRF

---

**Versão:** 1.0.0
**Última atualização:** 14/01/2026
**Servidor Produção:** 131.100.231.199:3001
