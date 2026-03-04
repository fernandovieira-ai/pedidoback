# ✅ Checklist - Verificar Deploy Railway

## URL do Backend
🌐 **https://pedidoback-production.up.railway.app**

---

## 🔍 Status Atual
❌ **ERRO 502** - Application failed to respond

Isso significa que o Railway não consegue iniciar a aplicação. Vamos verificar:

---

## 📋 Passo a Passo para Resolver

### 1️⃣ Verificar os Logs no Railway
1. Acesse: https://railway.app
2. Entre no projeto **pedidoback**
3. Clique na aba **Deployments**
4. Clique no último deploy
5. Veja os **Logs** - procure por erros em vermelho

**Erros Comuns:**
- ❌ `Error: connect ECONNREFUSED` → Problema de conexão com banco
- ❌ `Error: getaddrinfo ENOTFOUND` → Problema de DNS/hostname
- ❌ `Cannot find module` → Dependências não instaladas
- ❌ `Error: listen EADDRINUSE` → Porta já em uso

---

### 2️⃣ Verificar Variáveis de Ambiente

No Railway, vá em **Variables** e confirme que TODAS estão configuradas:

```
✅ NODE_ENV=production
✅ DB_HOST=cloud.digitalrf.com.br
✅ DB_PORT=5432
✅ DB_NAME=drfpedido
✅ DB_USER=drfpedido
✅ DB_PASSWORD=A@gTY73AH6df
✅ CORS_ORIGINS=*
✅ PORT=3001
✅ HOST=0.0.0.0
✅ SERVER_PUBLIC_URL=https://pedidoback-production.up.railway.app
```

**⚠️ Após adicionar/alterar variáveis, o Railway faz redeploy automático!**

---

### 3️⃣ Verificar Conexão com Banco de Dados

O banco PostgreSQL **cloud.digitalrf.com.br** precisa:
- ✅ Aceitar conexões externas (porta 5432 aberta)
- ✅ Permitir IPs do Railway (ou permitir todos)
- ✅ Credenciais corretas

**Como testar:**
- Tente conectar no banco usando DBeaver ou pgAdmin de outro local
- Se não conectar, o problema é no firewall/acesso do banco

---

### 4️⃣ Verificar Estrutura do Projeto

No Railway, confirme:
- ✅ **Root Directory**: vazio (ou "/") - o projeto já está na raiz
- ✅ **Start Command**: `node server.js` ou `npm start`
- ✅ **Build Command**: vazio (não precisa)

---

### 5️⃣ Redeploy Manual

Se nada funcionar:
1. No Railway, vá em **Settings**
2. Role até o final
3. Clique em **Redeploy**
4. Aguarde 1-2 minutos
5. Verifique os logs novamente

---

## 🧪 Testes Após Resolver

Quando o backend estiver funcionando, teste:

### Teste 1 - Health Check
```bash
curl https://pedidoback-production.up.railway.app/api/health
```

**Esperado:** `{"status":"ok"}`

### Teste 2 - Validar CNPJ (substitua pelo CNPJ real)
```bash
curl -X POST https://pedidoback-production.up.railway.app/api/auth/validate-cnpj \
  -H "Content-Type: application/json" \
  -d "{\"cnpj\":\"53865832000137\"}"
```

**Esperado:** JSON com dados da empresa

### Teste 3 - Testar no Navegador
Abra: https://pedidoback-production.up.railway.app/api/health

---

## 📱 Atualizar Frontend Depois

Quando o backend estiver OK, atualize `src/config/api.ts`:

```typescript
production: "https://pedidoback-production.up.railway.app/api",
```

E mude o modo:
```typescript
const MODO_ATUAL: "local" | "network" | "production" = "production";
```

---

## 🆘 Ainda com Problema?

Me mostre:
1. **Print dos logs** do Railway (aba Deployments)
2. **Print das variáveis** configuradas (aba Variables)
3. **Mensagem de erro** específica
