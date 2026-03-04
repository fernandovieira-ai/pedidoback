# 🚀 Guia Rápido - AppPedido

## 🏠 Usar Backend LOCAL (Para desenvolvimento)

### 1. Iniciar o backend:
```powershell
.\iniciar-backend-local.ps1
```

### 2. Configurar o app:
Abra `src/config/api.ts` e mude a linha 47:
```typescript
const MODO_ATUAL = "network";  // ← LOCAL
```

### 3. Iniciar o app:
```powershell
npx expo start
```

---

## ☁️ Usar Backend RAILWAY (Para produção/testes externos)

### 1. Configurar o app:
Abra `src/config/api.ts` e mude a linha 47:
```typescript
const MODO_ATUAL = "production";  // ← RAILWAY
```

### 2. Iniciar o app:
```powershell
npx expo start --clear
```

---

## 🔄 Como Alternar?

**Só precisa mudar UMA LINHA no arquivo `src/config/api.ts`:**

```typescript
// Para LOCAL (192.168.100.12:3001):
const MODO_ATUAL = "network";

// Para RAILWAY (cloud):
const MODO_ATUAL = "production";
```

Depois reinicie o app com `npx expo start --clear`

---

## 📋 Comandos Úteis

```powershell
# Iniciar backend local
.\iniciar-backend-local.ps1

# Iniciar app
npx expo start

# Iniciar app (limpar cache)
npx expo start --clear

# Testar backend Railway
.\testar-backend.ps1

# Parar processos na porta 3001
Get-NetTCPConnection -LocalPort 3001 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

---

## 🆘 Problemas?

### "Network request failed"

**Se está usando LOCAL:**
- Backend local está rodando? Execute `.\iniciar-backend-local.ps1`

**Se está usando RAILWAY:**
- Internet funcionando?
- Teste: `.\testar-backend.ps1`

### App não mudou de backend

- Reinicie o app: `npx expo start --clear`
- Verifique os logs - deve mostrar qual URL está usando

---

## 📊 Qual backend está usando?

Nos logs do Metro Bundler você verá:

```
🔧 Modo: NETWORK          ← Backend LOCAL
🌐 URL: http://192.168.100.12:3001/api
```

ou

```
🔧 Modo: PRODUCTION       ← Backend RAILWAY
🌐 URL: https://backeend-pedido-production-25a7.up.railway.app/api
```

---

## ✅ Pronto!

Para mais detalhes, veja: [ALTERNAR-BACKEND.md](ALTERNAR-BACKEND.md)
