# 🚀 Guia de Deploy - AppPedidoExpo

## 📋 Pré-requisitos no Servidor

### Software Necessário

- **Node.js** 16+ ([download](https://nodejs.org))
- **Git** (opcional, para facilitar updates)
- **PM2** (recomendado para manter o servidor rodando)

### Portas que Precisam Estar Abertas

- **Porta 3001** (backend da API)
- Configurar no firewall do servidor

---

## 📦 Arquivos para Subir no Servidor

### Estrutura Mínima no Servidor

```
/var/www/apppedido/  (ou C:\apppedido\ no Windows)
│
└── backend/
    ├── server.js
    ├── db.js
    ├── package.json
    └── node_modules/  (será criado com npm install)
```

### Lista de Arquivos

Copie para o servidor apenas a pasta **backend/** completa:

- ✅ `backend/server.js`
- ✅ `backend/db.js`
- ✅ `backend/package.json`

---

## ⚙️ Configuração no Servidor

### 1️⃣ Configurar Banco de Dados (db.js)

**IMPORTANTE**: O arquivo `db.js` já está configurado para o PostgreSQL em cloud.digitalrf.com.br. Não precisa alterar nada se o servidor conseguir acessar esse IP.

Verifique se o servidor tem acesso ao banco:

```bash
# Teste de conectividade
ping cloud.digitalrf.com.br
```

Se precisar alterar, edite `backend/db.js`:

```javascript
const pool = new Pool({
  host: "cloud.digitalrf.com.br",
  port: 5432,
  user: "postgres",
  password: "sua_senha_aqui",
  database: "drfpedido",
});
```

### 2️⃣ Instalar Dependências

No diretório `backend/`:

```bash
cd backend
npm install
```

### 3️⃣ Testar o Servidor

```bash
node server.js
```

Se tudo estiver OK, você verá:

```
🚀 Backend rodando!
📡 URL: http://localhost:3001
🌐 Rede: http://SEU_IP_AQUI:3001
✅ Conectado ao PostgreSQL com sucesso!
```

### 4️⃣ Manter o Servidor Rodando (Produção)

#### Opção A: PM2 (Recomendado)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar o servidor
cd backend
pm2 start server.js --name apppedido-backend

# Configurar para iniciar no boot
pm2 startup
pm2 save

# Comandos úteis
pm2 status          # Ver status
pm2 logs            # Ver logs
pm2 restart all     # Reiniciar
pm2 stop all        # Parar
```

#### Opção B: Windows Service (Windows Server)

Use ferramentas como **NSSM** (Non-Sucking Service Manager) para criar um serviço Windows.

---

## 📱 Configuração no App (Cliente)

### Alterar URL da API

Edite `src/config/api.ts`:

```typescript
// IP EXTERNO DO SEU SERVIDOR
const REMOTE_API_URL = "http://SEU_IP_FIXO:3001/api";

export const getAPIBaseURL = (): string => {
  // Para testes externos, sempre usar IP fixo do servidor
  return REMOTE_API_URL;
};
```

**Exemplo com IP real:**

```typescript
const REMOTE_API_URL = "http://200.150.100.50:3001/api";
```

### Rebuildar o App

Após alterar a URL:

```bash
# Parar o servidor Expo (Ctrl+C)
npm start

# Ou limpar cache
npx expo start -c
```

---

## 🔒 Firewall e Segurança

### Windows Server

```powershell
# Liberar porta 3001
New-NetFirewallRule -DisplayName "AppPedido API" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
```

### Linux (Ubuntu/Debian)

```bash
# UFW
sudo ufw allow 3001/tcp

# iptables
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
```

### Cloud Providers

- **AWS EC2**: Editar Security Group → Adicionar regra Inbound TCP 3001
- **Azure**: Network Security Group → Add inbound port rule 3001
- **Google Cloud**: Firewall rules → Create rule TCP 3001

---

## ✅ Checklist de Deploy

- [ ] Node.js instalado no servidor
- [ ] Pasta `backend/` copiada para o servidor
- [ ] `npm install` executado
- [ ] Porta 3001 liberada no firewall
- [ ] Servidor consegue acessar o PostgreSQL (ping cloud.digitalrf.com.br)
- [ ] `node server.js` rodando sem erros
- [ ] PM2 configurado (opcional, mas recomendado)
- [ ] `src/config/api.ts` alterado com IP fixo do servidor
- [ ] App rebuild com `npm start`
- [ ] Testado criação de pedido pelo app

---

## 🐛 Troubleshooting

### Erro: "ECONNREFUSED"

- ✅ Verificar se o servidor está rodando (`pm2 status`)
- ✅ Testar localmente: `curl http://localhost:3001/api/auth/validate-cnpj`
- ✅ Verificar firewall

### Erro: "Network request failed"

- ✅ Verificar se o IP está correto em `api.ts`
- ✅ Testar acesso externo: `curl http://SEU_IP:3001` de outra máquina
- ✅ Verificar se não há proxy/VPN bloqueando

### Erro: "ENOTFOUND cloud.digitalrf.com.br"

- ✅ Servidor não consegue resolver DNS
- ✅ Testar: `ping cloud.digitalrf.com.br`
- ✅ Adicionar IP fixo no `/etc/hosts` (Linux) ou `C:\Windows\System32\drivers\etc\hosts` (Windows)

### Erro: "password authentication failed"

- ✅ Senha do PostgreSQL incorreta em `db.js`
- ✅ PostgreSQL não permite conexão do IP do servidor (verificar `pg_hba.conf`)

---

## 📊 Monitoramento

### Logs em Tempo Real

```bash
# PM2
pm2 logs apppedido-backend

# Direto (Node)
# Os logs aparecem no terminal onde você executou node server.js
```

### Verificar Conexões

```bash
# Ver quantos clientes estão conectados
netstat -an | grep 3001
```

---

## 🔄 Atualização do Servidor

Quando fizer mudanças no código:

```bash
# 1. Copiar novo server.js para o servidor
# 2. Reiniciar
pm2 restart apppedido-backend

# Ou, se não estiver usando PM2:
# Ctrl+C para parar
# node server.js para iniciar novamente
```

---

## 📞 Informações Importantes

- **Porta do Backend**: 3001
- **Banco de Dados**: cloud.digitalrf.com.br:5432
- **Schema Multi-tenant**: digitalrf (conforme CNPJ validado)
- **Servidor já está configurado para aceitar conexões externas**: `app.listen(PORT, "0.0.0.0")`

---

## 🎯 Exemplo Completo de Deploy

### No Servidor (Linux)

```bash
# 1. Criar diretório
mkdir -p /var/www/apppedido
cd /var/www/apppedido

# 2. Copiar arquivos (use SCP, FTP, ou Git)
# scp -r backend/ usuario@servidor:/var/www/apppedido/

# 3. Instalar dependências
cd backend
npm install

# 4. Instalar PM2
npm install -g pm2

# 5. Iniciar servidor
pm2 start server.js --name apppedido-backend

# 6. Configurar autostart
pm2 startup
pm2 save

# 7. Liberar firewall
sudo ufw allow 3001/tcp
```

### No PC de Desenvolvimento

```bash
# 1. Editar src/config/api.ts
# Mudar REMOTE_API_URL para "http://IP_DO_SERVIDOR:3001/api"

# 2. Rebuildar
npm start

# 3. Testar no dispositivo Android/iOS
```

---

## ✅ Teste Final

Execute este comando de outro computador/celular:

```bash
curl http://SEU_IP_SERVIDOR:3001/api/auth/validate-cnpj \
  -H "Content-Type: application/json" \
  -d '{"cnpj":"00000000000191"}'
```

Se retornar um JSON, está funcionando! 🎉
