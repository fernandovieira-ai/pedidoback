# 🚀 Deploy Rápido no Railway

## Passo a Passo Simplificado

### 1️⃣ Criar conta no Railway
- Acesse: https://railway.app
- Faça login com GitHub

### 2️⃣ Criar novo projeto
1. Clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Escolha o repositório
4. Se o backend estiver em subpasta, configure **Root Directory** como `backend`

### 3️⃣ Configurar Variáveis de Ambiente

Vá em **Variables** e adicione:

```env
NODE_ENV=production
DB_HOST=cloud.digitalrf.com.br
DB_PORT=5432
DB_NAME=drfpedido
DB_USER=drfpedido
DB_PASSWORD=A@gTY73AH6df
CORS_ORIGINS=*
```

### 4️⃣ Deploy Automático

O Railway vai fazer o deploy automaticamente! Aguarde 1-2 minutos.

### 5️⃣ Pegar a URL do seu backend

1. Vá em **Settings** > **Domains**
2. Clique em **Generate Domain**
3. Copie a URL (ex: `https://seu-app.up.railway.app`)

### 6️⃣ Atualizar o Frontend

No arquivo `src/config/api.ts`:

```typescript
const API_URLS = {
  production: "https://seu-app.up.railway.app/api",
  network: "http://192.168.100.12:3001/api",
};

const MODO_ATUAL: "production" | "network" = "production";
```

## ✅ Pronto!

Seu backend está no ar! 🎉

## 🧪 Testar

Acesse: `https://seu-app.up.railway.app/api/health`

## 📊 Ver Logs

No Railway, clique em **View Logs** para ver os logs em tempo real.

## 🔄 Redeploy

Basta fazer push no GitHub que o Railway redeploya automaticamente!

## ⚠️ Importante

Se você receber erro de conexão com o banco:
- Verifique se o servidor PostgreSQL `cloud.digitalrf.com.br` aceita conexões externas
- Verifique o firewall para permitir IPs do Railway

## 💰 Custo

- **Free**: $5 de crédito grátis por mês
- Suficiente para desenvolvimento e testes!
