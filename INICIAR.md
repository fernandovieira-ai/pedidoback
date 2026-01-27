# 🚀 Como Iniciar o App - Guia Rápido

## 📌 Você precisa de 2 terminais abertos:

### Terminal 1: Backend (API)

### Terminal 2: App (Expo)

---

## 🖥️ Terminal 1 - BACKEND

```powershell
# Navegar até a pasta backend
cd C:\Linx\cliente\digitalrf\projeto\apppedido\AppPedidoExpo\backend

# Iniciar o servidor
node server.js
```

**Você verá:**

```
🚀 Backend rodando!
📡 URL: http://localhost:3001
🌐 Rede: http://192.168.100.12:3001
✅ Conectado ao PostgreSQL com sucesso!
```

⚠️ **IMPORTANTE**: Deixe este terminal aberto!

---

## 📱 Terminal 2 - APP (Expo)

**Abra um NOVO terminal** (PowerShell ou CMD):

```powershell
# Navegar até a pasta do projeto
cd C:\Linx\cliente\digitalrf\projeto\apppedido\AppPedidoExpo

# Iniciar o Expo
npm start
```

**Você verá um QR Code:**

```
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ ▄▄▄▄▄ █▀▄█▀     █ ▄▄▄▄▄ █
█ █   █ █▄   ▄██▀ █ █   █ █
█ █▄▄▄█ █ ▀█▀█ ▀ ██ █▄▄▄█ █
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄

› Metro waiting on exp://192.168.100.12:8081
› Press a │ open Android
```

⚠️ **IMPORTANTE**: Deixe este terminal também aberto!

---

## 🎮 Comandos no Terminal do Expo

Após o QR Code aparecer, você pode:

### Opção 1: Android (mais comum)

```
Pressione: a
```

Isso abrirá o app no emulador Android ou dispositivo conectado

### Opção 2: Escanear QR Code

- Instale **Expo Go** no celular Android
- Abra o app Expo Go
- Escaneie o QR Code
- App abrirá no celular

### Opção 3: Web (testes rápidos)

```
Pressione: w
```

---

## 🔄 Recarregar o App

Se fizer mudanças no código:

**No terminal do Expo, pressione:**

```
r = Reload app (recarregar)
```

Ou no celular/emulador:

- Android: Shake o celular + "Reload"
- Emulador: Ctrl+M (Windows) + "Reload"

---

## 🛑 Parar os Servidores

Quando quiser parar:

**Terminal 1 (Backend):**

```
Ctrl + C
```

**Terminal 2 (Expo):**

```
Ctrl + C
```

---

## ⚡ Script Rápido (PowerShell)

Salve este script como `iniciar-tudo.ps1`:

```powershell
# Inicia Backend e App em terminais separados

# Terminal 1: Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host '🚀 BACKEND INICIANDO...' -ForegroundColor Green; node server.js"

# Aguardar backend iniciar
Start-Sleep -Seconds 3

# Terminal 2: App Expo
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '📱 APP EXPO INICIANDO...' -ForegroundColor Cyan; npm start"

Write-Host ""
Write-Host "✅ Servidores iniciados!" -ForegroundColor Green
Write-Host ""
Write-Host "🖥️ Backend: http://localhost:3001" -ForegroundColor Yellow
Write-Host "📱 App: Aguarde o QR Code aparecer" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️ Não feche as janelas que abriram!" -ForegroundColor Red
```

**Para usar:**

```powershell
.\iniciar-tudo.ps1
```

---

## 📋 Checklist

- [ ] Terminal 1 aberto com Backend rodando (porta 3001)
- [ ] Terminal 2 aberto com Expo rodando (porta 8081)
- [ ] QR Code apareceu no Terminal 2
- [ ] Expo Go instalado no celular (se for usar físico)
- [ ] Celular e PC na mesma rede WiFi
- [ ] Pressionar `a` para abrir no Android

---

## 🐛 Problemas Comuns

### ❌ "Port 3001 já está em uso"

**Backend já está rodando!** Feche o terminal antigo ou:

```powershell
Stop-Process -Name "node" -Force
```

### ❌ "Port 8081 já está em uso"

**Expo já está rodando!** Feche o terminal antigo ou escolha outra porta:

```
Use port 8083 instead? (y/n) → Digite: y
```

### ❌ "Cannot connect to Metro"

1. Verifique se ambos terminais estão rodando
2. Verifique se PC e celular estão na mesma rede WiFi
3. Recarregue: pressione `r` no terminal do Expo

### ❌ "Network request failed" no app

1. Backend está rodando? Veja Terminal 1
2. IP correto em `src/config/api.ts`?
3. Celular na mesma rede WiFi?

---

## 🎯 Ordem Correta

```
1️⃣ Iniciar BACKEND primeiro
   ↓
2️⃣ Aguardar "✅ Conectado ao PostgreSQL"
   ↓
3️⃣ Iniciar APP (Expo)
   ↓
4️⃣ Aguardar QR Code
   ↓
5️⃣ Pressionar 'a' ou escanear QR
   ↓
6️⃣ ✅ App abre no celular/emulador!
```

---

**Dica:** Mantenha os 2 terminais sempre visíveis lado a lado para ver os logs em tempo real! 👀
