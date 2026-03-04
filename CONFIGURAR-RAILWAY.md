# 🚂 Como Configurar o Railway Corretamente

## ❌ Problema Atual

O Railway está executando:
```
> expo start
Starting project at /app
Metro is running in CI mode
```

**Isso está ERRADO!** Deveria executar:
```
> node server.js
✅ Conectado ao PostgreSQL com sucesso!
🚀 Backend rodando!
```

---

## ✅ SOLUÇÃO: Configurar Root Directory

### Passo 1: Acesse o Railway

Abra no navegador:
```
https://railway.app
```

### Passo 2: Localize seu Projeto

1. Você deve ver o projeto: **backeend-pedido** (ou nome similar)
2. Clique no card do projeto

### Passo 3: Selecione o Serviço

1. Você verá uma ou mais caixas (services)
2. Clique na caixa do serviço (geralmente tem o nome do repositório)

### Passo 4: Vá para Settings

1. No topo da tela, clique na aba **"Settings"**
2. Role a página para baixo

### Passo 5: Encontre "Source"

Procure pela seção **"Source"** ou **"Build & Deploy"**

### Passo 6: Configure Root Directory

1. Procure o campo **"Root Directory"**
2. Se estiver vazio ou tiver `/`, altere para:
   ```
   backend
   ```
3. Pressione **Enter** ou clique fora do campo para salvar

### Passo 7: Configure Start Command (Opcional)

Ainda na mesma seção, procure por **"Start Command"** ou **"Custom Start Command"**

Se encontrar, configure como:
```
node server.js
```

### Passo 8: Aguarde o Redeploy

1. O Railway vai redesenhar automaticamente (veja no topo "Deploying...")
2. Aguarde 1-2 minutos
3. Clique em **"Deployments"** para acompanhar

### Passo 9: Verifique os Logs

Nos logs, você DEVE ver:
```
✅ Conectado ao PostgreSQL com sucesso!

🚀 Backend rodando!
📡 Ambiente: production
📡 Porta: 3001
📡 Host: 0.0.0.0
```

**NÃO deve ver:**
```
❌ expo start
❌ Metro is running
❌ Starting project at /app
```

---

## 🧪 Testar Após Configurar

### Teste 1: No Navegador

Abra:
```
https://backeend-pedido-production.up.railway.app/health
```

**Deve retornar:**
```json
{
  "status": "OK",
  "timestamp": "...",
  "uptime": 123.45,
  "environment": "production",
  "database": "PostgreSQL"
}
```

### Teste 2: Script PowerShell

Execute no terminal:
```powershell
.\testar-backend.ps1
```

**Deve mostrar:**
```
✅ SUCESSO: Backend Node.js está rodando!
✅ SUCESSO: Endpoint /api/health funcionando!
```

---

## 🔍 Alternativa: Criar Novo Serviço

Se não conseguir configurar o Root Directory, você pode criar um novo serviço:

### Opção A: Via Railway CLI

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Criar novo projeto
railway init

# Link com o projeto
railway link

# Deploy apenas da pasta backend
cd backend
railway up
```

### Opção B: Criar Novo Projeto no Railway

1. Vá em **"New Project"**
2. Selecione **"Empty Project"**
3. Adicione um **"New Service"**
4. Escolha **"GitHub Repo"**
5. Selecione o repositório: `fernandovieira-ai/backeend-pedido`
6. Configure **Root Directory**: `backend`
7. Adicione as variáveis de ambiente

---

## 📋 Checklist de Configuração

Antes de testar, certifique-se que:

- [ ] Root Directory = `backend`
- [ ] Start Command = `node server.js` (ou deixe vazio)
- [ ] Variáveis de ambiente configuradas:
  - [ ] `NODE_ENV=production`
  - [ ] `DB_HOST=cloud.digitalrf.com.br`
  - [ ] `DB_PORT=5432`
  - [ ] `DB_NAME=drfpedido`
  - [ ] `DB_USER=drfpedido`
  - [ ] `DB_PASSWORD=A@gTY73AH6df`
  - [ ] `CORS_ORIGINS=*`
- [ ] Deploy bem-sucedido (sem erros)
- [ ] Logs mostram "Backend rodando!"

---

## 🆘 Precisa de Ajuda?

Se ainda assim não funcionar:

### 1. Capture os Logs

No Railway:
1. Vá em **"Deployments"**
2. Clique no último deployment
3. Copie TODOS os logs
4. Cole aqui para análise

### 2. Verifique o Build Log

Procure por erros como:
```
❌ Error: Cannot find module 'express'
❌ Error: ENOENT: no such file or directory
❌ npm ERR! missing script: start
```

### 3. Verifique as Variáveis

No Railway:
1. Vá em **"Variables"**
2. Confirme que TODAS as variáveis estão lá
3. Confirme que não tem espaços extras

---

## 📊 Status da Estrutura do Projeto

```
backeend-pedido/              ← Railway NÃO deve usar esta pasta
├── backend/                  ← Railway DEVE usar esta pasta ✅
│   ├── server.js            ← Arquivo principal
│   ├── package.json         ← Dependências
│   ├── .env                 ← Variáveis (não vai pro GitHub)
│   └── ...
├── src/                      ← Frontend (React Native)
├── package.json             ← Frontend package.json ❌
└── app.json                 ← Expo config ❌
```

**IMPORTANTE:** Railway deve apontar para `backend/`, não para a raiz!

---

## ✅ Quando Estiver Correto

Você saberá que está funcionando quando:

1. ✅ `/health` retorna JSON com `"status": "OK"`
2. ✅ Logs mostram "Backend rodando!"
3. ✅ Script de teste passa todos os testes
4. ✅ App mobile consegue fazer login

Depois disso, execute:
```powershell
npx expo start --clear
```

E teste o app! 🚀

---

## 📞 Comandos de Emergência

Se precisar resetar tudo:

### Deletar e Recriar no Railway

1. Delete o serviço atual
2. Crie um novo projeto
3. Configure corretamente desde o início
4. Use este comando para testar localmente antes:

```bash
cd backend
npm install
npm start
```

Se funcionar localmente, vai funcionar no Railway! 🎯
