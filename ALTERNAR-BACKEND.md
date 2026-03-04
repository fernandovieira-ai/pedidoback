# 🔄 Como Alternar Entre Backend Local e Railway

## 📋 Resumo Rápido

### Para usar Backend LOCAL (testes):
```
1. Inicie o backend local: .\iniciar-backend-local.ps1
2. Configure api.ts: MODO_ATUAL = "network"
3. Inicie o app: npx expo start
```

### Para usar Backend RAILWAY (produção):
```
1. Configure api.ts: MODO_ATUAL = "production"
2. Inicie o app: npx expo start
```

---

## 🏠 Modo 1: Backend LOCAL (Desenvolvimento)

### Quando usar?
- ✅ Fazendo alterações no backend
- ✅ Testando novas funcionalidades
- ✅ Debugging
- ✅ Sem necessidade de internet

### Como configurar:

#### Passo 1: Iniciar o backend local

**Opção A - Script automático:**
```powershell
.\iniciar-backend-local.ps1
```

**Opção B - Manual:**
```powershell
cd backend
npm start
```

Deve aparecer:
```
🚀 Backend rodando!
📡 Porta: 3001
🌐 URL Rede: http://192.168.100.12:3001
```

#### Passo 2: Configurar o app

Abra: `src/config/api.ts`

Altere a linha 47:
```typescript
const MODO_ATUAL: "local" | "network" | "production" = "network";
```

#### Passo 3: Iniciar o app

```powershell
npx expo start
```

### ✅ Como testar se está usando o backend local:

1. No terminal do backend, você verá as requisições chegando
2. No app, faça login - deve aparecer logs no terminal do backend
3. Ou verifique os logs do Metro Bundler:
   ```
   🔧 Modo: NETWORK
   🌐 URL: http://192.168.100.12:3001/api
   ```

---

## ☁️ Modo 2: Backend RAILWAY (Produção/Cloud)

### Quando usar?
- ✅ App em produção
- ✅ Testes em dispositivos externos (fora da rede local)
- ✅ Demo para clientes
- ✅ Não quer rodar backend localmente

### Como configurar:

#### Passo 1: Configurar o app

Abra: `src/config/api.ts`

Altere a linha 47:
```typescript
const MODO_ATUAL: "local" | "network" | "production" = "production";
```

#### Passo 2: Iniciar o app

```powershell
npx expo start --clear
```

O `--clear` limpa o cache e garante que vai usar a nova configuração.

### ✅ Como testar se está usando o Railway:

1. Verifique os logs do Metro Bundler:
   ```
   🔧 Modo: PRODUCTION
   🌐 URL: https://backeend-pedido-production-25a7.up.railway.app/api
   ```

2. O backend local pode estar desligado - o app continuará funcionando

---

## 🔄 Alternância Rápida

### Cenário 1: Estava no Railway, quer testar localmente

```powershell
# 1. Iniciar backend local
.\iniciar-backend-local.ps1

# 2. Em outro terminal:
# Editar src/config/api.ts → MODO_ATUAL = "network"

# 3. Reiniciar o app
npx expo start --clear
```

### Cenário 2: Estava local, quer usar Railway

```powershell
# 1. Editar src/config/api.ts → MODO_ATUAL = "production"

# 2. Reiniciar o app
npx expo start --clear

# 3. Pode desligar o backend local (Ctrl+C)
```

---

## 📊 Comparação dos Modos

| Aspecto | Backend Local | Backend Railway |
|---------|---------------|-----------------|
| **Velocidade** | ⚡ Mais rápido | 🌐 Depende da internet |
| **Debugging** | ✅ Fácil (logs visíveis) | ⚠️ Precisa ver logs no Railway |
| **Internet** | ❌ Não necessária | ✅ Necessária |
| **Dispositivos** | 📱 Mesma rede WiFi | 🌍 Qualquer lugar |
| **Alterações** | ✅ Instantâneas | ⏳ Precisa fazer push/deploy |
| **Banco de Dados** | 💾 Mesmo (PostgreSQL) | 💾 Mesmo (PostgreSQL) |

---

## 🛠️ URLs Configuradas

### Backend Local (network):
```
http://192.168.100.12:3001/api
```

### Backend Railway (production):
```
https://backeend-pedido-production-25a7.up.railway.app/api
```

### Banco de Dados (ambos usam o mesmo):
```
Host: cloud.digitalrf.com.br
Database: drfpedido
Schema: digitalrf
```

---

## 🧪 Testes

### Testar Backend Local:
```powershell
curl http://192.168.100.12:3001/health
```

Deve retornar:
```json
{"status":"OK","environment":"production","database":"PostgreSQL"}
```

### Testar Backend Railway:
```powershell
.\testar-backend.ps1
```

Ou manualmente:
```powershell
curl https://backeend-pedido-production-25a7.up.railway.app/health
```

---

## ⚠️ Problemas Comuns

### "Network request failed" ao usar modo local

**Causa:** Backend local não está rodando

**Solução:**
```powershell
cd backend
npm start
```

### "Network request failed" ao usar modo Railway

**Causa:** Internet offline ou Railway fora do ar

**Solução:**
1. Verifique sua conexão com internet
2. Teste: `curl https://backeend-pedido-production-25a7.up.railway.app/health`
3. Se Railway estiver fora, use modo local

### App não atualizou após mudar MODO_ATUAL

**Causa:** Cache do Metro Bundler

**Solução:**
```powershell
# Pare o Metro (Ctrl+C)
npx expo start --clear
```

### Backend local não aceita conexões do celular

**Causa:** Firewall do Windows bloqueando

**Solução:**
1. Abra Firewall do Windows
2. Permitir Node.js na porta 3001
3. Ou execute como administrador: `npm start`

---

## 📝 Workflow Recomendado

### Para Desenvolvimento:

```
1. Iniciar backend local (.\iniciar-backend-local.ps1)
2. Configurar MODO_ATUAL = "network"
3. Fazer alterações no código
4. Testar no app
5. Commitar alterações
```

### Para Deploy:

```
1. Commitar e fazer push para GitHub
   git add .
   git commit -m "Suas alterações"
   git push

2. Railway faz deploy automático (1-2 min)

3. Configurar MODO_ATUAL = "production"

4. Testar no app
```

### Para Demo/Produção:

```
1. Configurar MODO_ATUAL = "production"
2. Reiniciar app com --clear
3. Distribuir para usuários
```

---

## 🎯 Checklist Antes de Alternar

### Antes de usar Backend Local:
- [ ] Backend local rodando? (`.\iniciar-backend-local.ps1`)
- [ ] Celular na mesma rede WiFi?
- [ ] `MODO_ATUAL = "network"`?
- [ ] Metro Bundler reiniciado com `--clear`?

### Antes de usar Backend Railway:
- [ ] `MODO_ATUAL = "production"`?
- [ ] Metro Bundler reiniciado com `--clear`?
- [ ] Internet funcionando?
- [ ] Railway online? (`.\testar-backend.ps1`)

---

## 💡 Dicas

1. **Durante desenvolvimento**: Use backend local para resposta mais rápida
2. **Para testes externos**: Use Railway (não precisa estar na mesma rede)
3. **Antes de deploy**: Teste sempre no Railway primeiro
4. **Debugging**: Backend local facilita muito ver os logs em tempo real
5. **Mantenha os dois funcionando**: Railway como backup quando local der problema

---

## 📞 Comandos Úteis

```powershell
# Iniciar backend local
.\iniciar-backend-local.ps1

# Testar backend local
curl http://192.168.100.12:3001/health

# Testar backend Railway
.\testar-backend.ps1

# Iniciar app (limpar cache)
npx expo start --clear

# Ver qual modo está ativo
# (Aparece nos logs do Metro Bundler ao iniciar)

# Parar todos os processos Node
Get-Process node | Stop-Process
```

---

## ✅ Resumo Visual

```
┌─────────────────────────────────────────────┐
│  DESENVOLVIMENTO (Backend Local)            │
│                                             │
│  1. .\iniciar-backend-local.ps1            │
│  2. MODO_ATUAL = "network"                  │
│  3. npx expo start                          │
│                                             │
│  ✅ Rápido, fácil debug, sem internet      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  PRODUÇÃO (Backend Railway)                 │
│                                             │
│  1. MODO_ATUAL = "production"               │
│  2. npx expo start --clear                  │
│                                             │
│  ✅ Qualquer lugar, sempre online          │
└─────────────────────────────────────────────┘
```

**Lembre-se:** Só precisa mudar **uma linha** em `src/config/api.ts`! 🚀
