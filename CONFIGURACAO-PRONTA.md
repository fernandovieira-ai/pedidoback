# ✅ Configuração Completa - AppPedido

Seu projeto está configurado para trabalhar com **dois backends**:
- 🏠 **Backend Local** (desenvolvimento/testes rápidos)
- ☁️ **Backend Railway** (produção/acesso remoto)

---

## 📊 Configuração Atual

### Backend Local (Network Mode)
```
URL: http://192.168.100.12:3001/api
Porta: 3001
Host: 0.0.0.0
Banco: cloud.digitalrf.com.br (PostgreSQL)
Schema: digitalrf
Status: ⏸️ Parado (iniciar quando precisar)
```

### Backend Railway (Production Mode)
```
URL: https://backeend-pedido-production-25a7.up.railway.app/api
Porta: 8080 (Railway gerencia automaticamente)
Banco: cloud.digitalrf.com.br (PostgreSQL)
Schema: digitalrf
Status: ✅ ONLINE e funcionando
```

### Banco de Dados (Compartilhado)
```
Host: cloud.digitalrf.com.br
Database: drfpedido
Schema: digitalrf
Status: ✅ Acessível de ambos os backends
```

---

## 🎯 Como Usar?

### Cenário 1: Desenvolvimento Rápido (Backend Local)

**Use quando:**
- Fazendo alterações no código backend
- Testando novas features
- Debugging
- Desenvolvimento offline

**Passos:**

1. **Iniciar backend local:**
   ```powershell
   .\iniciar-backend-local.ps1
   ```

2. **Configurar app para usar backend local:**
   - Abra `src/config/api.ts`
   - Linha 47: `const MODO_ATUAL = "network";`

3. **Iniciar app:**
   ```powershell
   npx expo start
   ```

**Pronto!** O app vai se conectar ao backend local (192.168.100.12:3001)

---

### Cenário 2: Produção ou Testes Externos (Backend Railway)

**Use quando:**
- App em produção
- Testando em dispositivos fora da rede local
- Demonstrações para clientes
- Não quer rodar backend localmente

**Passos:**

1. **Configurar app para usar Railway:**
   - Abra `src/config/api.ts`
   - Linha 47: `const MODO_ATUAL = "production";`

2. **Iniciar app:**
   ```powershell
   npx expo start --clear
   ```

**Pronto!** O app vai se conectar ao Railway (cloud)

> **Nota:** Backend local pode estar desligado - não é necessário!

---

## 🔄 Alternância Rápida

Para alternar entre backends, **só precisa mudar UMA linha**:

**Arquivo:** `src/config/api.ts` (linha 47)

```typescript
// Backend LOCAL (192.168.100.12):
const MODO_ATUAL = "network";

// Backend RAILWAY (cloud):
const MODO_ATUAL = "production";
```

Depois:
```powershell
npx expo start --clear
```

---

## 📝 Scripts Disponíveis

### Iniciar Backend Local
```powershell
.\iniciar-backend-local.ps1
```
- Verifica se a porta 3001 está livre
- Instala dependências se necessário
- Inicia o backend Node.js

### Testar Backend Railway
```powershell
.\testar-backend.ps1
```
- Testa endpoint `/health`
- Testa endpoint `/api/health`
- Testa validação de CNPJ
- Mostra status completo

### Iniciar App (Frontend)
```powershell
npx expo start          # Normal
npx expo start --clear  # Limpar cache (recomendado após trocar backend)
```

---

## 🧪 Como Testar Cada Backend

### Testar Backend Local

**1. No PowerShell:**
```powershell
curl http://192.168.100.12:3001/health
```

**Resposta esperada:**
```json
{
  "status": "OK",
  "environment": "production",
  "database": "PostgreSQL"
}
```

**2. No navegador:**
```
http://192.168.100.12:3001/health
```

**3. Logs do terminal:**
Você verá as requisições chegando no terminal onde rodou `.\iniciar-backend-local.ps1`

---

### Testar Backend Railway

**1. Script automático:**
```powershell
.\testar-backend.ps1
```

**2. No PowerShell:**
```powershell
curl https://backeend-pedido-production-25a7.up.railway.app/health
```

**3. No navegador:**
```
https://backeend-pedido-production-25a7.up.railway.app/health
```

**Resposta esperada:**
```json
{
  "status": "OK",
  "timestamp": "2026-01-27T15:12:10.277Z",
  "uptime": 357.401361578,
  "environment": "production",
  "database": "PostgreSQL"
}
```

---

## 🔍 Como Saber Qual Backend Está Usando?

### Método 1: Logs do Metro Bundler

Ao iniciar o app (`npx expo start`), você verá:

**Se estiver usando LOCAL:**
```
🔧 Modo: NETWORK
🌐 URL: http://192.168.100.12:3001/api
```

**Se estiver usando RAILWAY:**
```
🔧 Modo: PRODUCTION
🌐 URL: https://backeend-pedido-production-25a7.up.railway.app/api
```

### Método 2: Arquivo api.ts

Verifique a linha 47 de `src/config/api.ts`:
- `"network"` = Backend Local
- `"production"` = Backend Railway

---

## 🆘 Troubleshooting

### Erro: "Network request failed"

**Se MODO_ATUAL = "network":**
1. Backend local está rodando?
   ```powershell
   .\iniciar-backend-local.ps1
   ```
2. Celular está na mesma rede WiFi?
3. IP está correto? (192.168.100.12)

**Se MODO_ATUAL = "production":**
1. Internet funcionando?
2. Railway está online?
   ```powershell
   .\testar-backend.ps1
   ```

---

### Backend local não inicia

**Erro: "Porta 3001 já está em uso"**

```powershell
# Liberar a porta 3001:
Get-NetTCPConnection -LocalPort 3001 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Tentar iniciar novamente:
.\iniciar-backend-local.ps1
```

---

### App não mudou de backend após alterar MODO_ATUAL

**Solução: Limpar cache do Metro Bundler**

```powershell
# Parar o Metro (Ctrl+C)
npx expo start --clear
```

---

### "Cannot find module 'express'" no backend local

**Solução: Instalar dependências**

```powershell
cd backend
npm install
npm start
```

---

## 📋 Workflow Recomendado

### Durante Desenvolvimento:

```
1. Iniciar backend local
   .\iniciar-backend-local.ps1

2. Configurar app para local
   src/config/api.ts → MODO_ATUAL = "network"

3. Desenvolver e testar
   npx expo start

4. Ver logs em tempo real
   (Terminal do backend mostra todas as requisições)

5. Fazer alterações no backend
   (Reinicie o backend se mudar arquivos .js)
```

### Para Deploy:

```
1. Testar localmente primeiro
   (Certifique-se que tudo funciona local)

2. Commitar alterações
   git add .
   git commit -m "Descrição das alterações"
   git push

3. Railway redesenha automaticamente
   (Aguarde 1-2 minutos)

4. Testar no Railway
   .\testar-backend.ps1

5. Configurar app para Railway
   src/config/api.ts → MODO_ATUAL = "production"

6. Testar no app
   npx expo start --clear
```

---

## 💡 Dicas Pro

1. **Mantenha dois terminais abertos:**
   - Terminal 1: Backend local
   - Terminal 2: Metro Bundler (app)

2. **Use backend local para desenvolvimento:**
   - Mais rápido
   - Logs em tempo real
   - Sem dependência de internet

3. **Use Railway para testes finais:**
   - Ambiente de produção real
   - Testar antes de liberar para usuários

4. **Commit frequente:**
   - Railway faz deploy automático
   - Sempre tenha uma versão funcionando no Railway

5. **Cache do Metro:**
   - Use `--clear` sempre que mudar o backend
   - Evita problemas de cache

---

## 📁 Arquivos Importantes

```
AppPedidoExpo/
├── src/config/api.ts                  ← Configurar backend aqui (linha 47)
├── backend/.env                        ← Configurações do backend local
├── iniciar-backend-local.ps1          ← Script para iniciar backend
├── testar-backend.ps1                 ← Script para testar Railway
├── GUIA-RAPIDO.md                     ← Guia rápido de uso
├── ALTERNAR-BACKEND.md                ← Guia detalhado de alternância
└── CONFIGURACAO-PRONTA.md             ← Este arquivo
```

---

## ✅ Checklist de Configuração

- [x] Backend Railway configurado e online
- [x] Backend local configurado (.env)
- [x] Frontend configurado (api.ts)
- [x] Scripts de teste criados
- [x] Scripts de inicialização criados
- [x] Documentação completa
- [x] Banco de dados acessível de ambos

**Status:** 🎉 **TUDO PRONTO PARA USO!**

---

## 🚀 Começar Agora

### Para desenvolvimento local:
```powershell
.\iniciar-backend-local.ps1
# Editar src/config/api.ts → MODO_ATUAL = "network"
npx expo start
```

### Para usar Railway:
```powershell
# Editar src/config/api.ts → MODO_ATUAL = "production"
npx expo start --clear
```

**É só isso!** 🎯

---

## 📚 Documentação Adicional

- **[GUIA-RAPIDO.md](GUIA-RAPIDO.md)** - Comandos rápidos
- **[ALTERNAR-BACKEND.md](ALTERNAR-BACKEND.md)** - Guia completo de alternância
- **[TESTE-COMPLETO.md](TESTE-COMPLETO.md)** - Como testar tudo
- **[CONFIGURAR-RAILWAY.md](CONFIGURAR-RAILWAY.md)** - Setup do Railway
- **[backend/README-RAILWAY.md](backend/README-RAILWAY.md)** - Deploy no Railway

---

**Dúvidas?** Consulte os guias acima ou execute os scripts de teste! 🔧
