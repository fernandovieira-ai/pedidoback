# 🚀 Deploy Rápido - 5 Passos

## 📋 Resumo Executivo

### No Servidor (Windows/Linux)

1. Copie a pasta `backend/` para o servidor
2. Execute o script de deploy
3. Anote o IP do servidor

### No App (Desenvolvimento)

4. Configure o IP no arquivo `src/config/api.ts`
5. Rebuild o app

---

## 🖥️ PASSO 1: No Servidor

### Windows Server

```powershell
# 1. Copiar pasta backend para C:\apppedido\
# 2. Executar PowerShell como Administrador
# 3. Rodar o script:

.\deploy-server.ps1
```

### Linux Server

```bash
# 1. Copiar pasta backend para o servidor
scp -r backend/ usuario@servidor:/tmp/

# 2. Conectar no servidor via SSH
ssh usuario@servidor

# 3. Mover para diretório correto
sudo mv /tmp/backend /var/www/apppedido/backend

# 4. Executar script de deploy
chmod +x deploy-server.sh
./deploy-server.sh
```

---

## 📱 PASSO 2: Configurar o App

### Editar `src/config/api.ts`

```typescript
// 1. SUBSTITUA pelo IP do seu servidor:
const REMOTE_API_URL = "http://200.150.100.50:3001/api";
//                            ^^^^^^^^^^^^^^
//                            SEU IP AQUI

// 2. ATIVE o modo remoto:
const USE_REMOTE_SERVER = true;
//                         ^^^^
```

### Rebuild do App

```bash
# Parar servidor Expo (Ctrl+C se estiver rodando)
npm start
```

---

## ✅ PASSO 3: Testar

### No Navegador

```
http://SEU_IP_SERVIDOR:3001/api/auth/validate-cnpj
```

### No Terminal

```bash
curl http://SEU_IP:3001/api/auth/validate-cnpj \
  -H "Content-Type: application/json" \
  -d '{"cnpj":"00000000000191"}'
```

### No App

1. Abra o app no celular
2. Tente fazer login
3. Se conectar, está funcionando! 🎉

---

## 🔧 Troubleshooting Rápido

### ❌ Não conecta no servidor

```bash
# 1. Verificar se servidor está rodando
pm2 status

# 2. Reiniciar se necessário
pm2 restart apppedido-backend

# 3. Ver logs
pm2 logs
```

### ❌ Firewall bloqueando

**Windows:**

```powershell
New-NetFirewallRule -DisplayName "AppPedido API" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
```

**Linux:**

```bash
sudo ufw allow 3001/tcp
```

### ❌ App não conecta

Verifique em `src/config/api.ts`:

- ✅ IP está correto?
- ✅ `USE_REMOTE_SERVER = true`?
- ✅ App foi rebuilded (`npm start`)?

---

## 📞 Arquivos Importantes

- **Backend**: `backend/server.js`, `backend/db.js`, `backend/package.json`
- **Config do App**: `src/config/api.ts`
- **Scripts de Deploy**: `deploy-server.sh` (Linux), `deploy-server.ps1` (Windows)
- **Documentação Completa**: `DEPLOY.md`

---

## 🎯 Checklist Rápido

- [ ] Pasta `backend/` copiada para o servidor
- [ ] Script de deploy executado sem erros
- [ ] PM2 mostrando servidor rodando (`pm2 status`)
- [ ] Porta 3001 liberada no firewall
- [ ] IP do servidor anotado
- [ ] `src/config/api.ts` configurado com IP correto
- [ ] `USE_REMOTE_SERVER = true`
- [ ] App rebuilded com `npm start`
- [ ] Testado login no app

---

## ⚡ Comandos Úteis

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs apppedido-backend

# Reiniciar servidor
pm2 restart apppedido-backend

# Parar servidor
pm2 stop apppedido-backend

# Iniciar servidor
pm2 start apppedido-backend
```

---

**Dúvidas?** Consulte a documentação completa em [DEPLOY.md](DEPLOY.md)
