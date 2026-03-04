# 🧪 Guia Completo de Testes - AppPedido

## ⚠️ IMPORTANTE: Configure o Railway primeiro!

Antes de testar, certifique-se que configurou o **Root Directory** no Railway:

1. Acesse seu projeto no Railway
2. Vá em **Settings** → **Service Settings**
3. Configure **Root Directory**: `backend`
4. Salve e aguarde o redeploy automático

---

## 1️⃣ Testar o Backend no Railway (Via Navegador)

### ✅ Teste 1: Health Check

Abra no navegador:
```
https://backeend-pedido-production.up.railway.app/health
```

**Resposta esperada:**
```json
{
  "status": "OK",
  "timestamp": "2026-01-27T14:40:00.000Z",
  "uptime": 123.45,
  "environment": "production",
  "database": "PostgreSQL"
}
```

**❌ Se você ver um JSON com "exposdk" e "launchAsset":**
- O Railway está servindo o Expo em vez do backend
- Você precisa configurar **Root Directory** como `backend`

---

### ✅ Teste 2: Health Check da API

Abra no navegador:
```
https://backeend-pedido-production.up.railway.app/api/health
```

**Resposta esperada:** Mesmo JSON do teste anterior.

---

## 2️⃣ Testar o Backend via PowerShell/CMD

Abra o PowerShell e execute:

```powershell
# Teste 1: Health Check
curl https://backeend-pedido-production.up.railway.app/health

# Teste 2: Validar CNPJ (deve retornar erro por falta de dados)
curl -X POST https://backeend-pedido-production.up.railway.app/api/auth/validate-cnpj -H "Content-Type: application/json" -d '{"cnpj":"53865832000137"}'
```

**Resultado esperado do teste de CNPJ:**
```json
{
  "success": true,
  "message": "CNPJ validado com sucesso",
  "data": {
    "cnpj": "53865832000137",
    "schema": "schema_name"
  }
}
```

---

## 3️⃣ Verificar Logs do Railway

No Railway:

1. Clique no seu serviço
2. Vá em **Deployments**
3. Clique no último deployment
4. Veja os logs

**Logs esperados quando o backend Node.js está rodando:**
```
✅ Conectado ao PostgreSQL com sucesso!

🚀 Backend rodando!
📡 Ambiente: production
📡 Porta: 3001
📡 Host: 0.0.0.0
🌐 URL Local: http://localhost:3001
🌐 URL Rede: http://backeend-pedido-production.up.railway.app:3001

💾 Usando PostgreSQL
📊 Database: drfpedido
```

**❌ Logs indicando problema:**
```
npm run build
expo start
```
Isso significa que está rodando o Expo em vez do backend.

---

## 4️⃣ Testar o App Mobile

### Passo 1: Iniciar o Metro Bundler

No PowerShell, dentro da pasta do projeto:

```powershell
npx expo start --clear
```

### Passo 2: Verificar a configuração da API

O arquivo já está configurado para produção:
- Modo: `production`
- URL: `https://backeend-pedido-production.up.railway.app/api`

### Passo 3: Abrir o App

**No iOS:**
```powershell
npx expo start --ios
```

**No Android:**
```powershell
npx expo start --android
```

**No Expo Go (celular físico):**
1. Abra o app Expo Go
2. Escaneie o QR Code

### Passo 4: Testar Login

1. **Digite um CNPJ válido:**
   ```
   53.865.832/0001-37
   ```

2. **Clique em "Validar CNPJ"**

   **✅ Sucesso esperado:**
   - CNPJ validado
   - Avança para tela de login

   **❌ Erro de rede:**
   - Verifique se o backend Railway está rodando
   - Verifique se a URL está correta
   - Veja os logs do Metro Bundler no terminal

3. **Digite usuário e senha:**
   - Use credenciais válidas do seu sistema

4. **Clique em "Entrar"**

   **✅ Sucesso esperado:**
   - Login realizado com sucesso
   - Navega para Dashboard

---

## 5️⃣ Testar Funcionalidades Principais

### ✅ Teste: Criar Novo Pedido

1. No Dashboard, clique em **"Novo Pedido"**
2. Selecione uma empresa
3. Selecione um cliente
4. Selecione condição de pagamento
5. Adicione pelo menos 1 item
6. Clique em **"Salvar Pedido"**

**Resultado esperado:**
- Pedido criado com sucesso
- Volta para Dashboard
- Pedido aparece na lista

### ✅ Teste: Listar Pedidos

1. No Dashboard, clique em **"Listar Pedidos"**
2. Deve aparecer a lista de pedidos

**Resultado esperado:**
- Lista de pedidos carregada
- Mostra pedidos sincronizados e pendentes

### ✅ Teste: Validação de Margem (Parâmetro 7)

Se o parâmetro 7 = 'N':

1. Crie um pedido
2. Adicione um item
3. Altere o preço para abaixo da margem desejada
4. **Deve mostrar aviso amarelo:** "⚠️ Margem abaixo do desejado"
5. **Deve permitir salvar mesmo assim**

Se o parâmetro 7 = 'S':

1. Altere preço abaixo da margem
2. **Deve bloquear:** "Margem Abaixo da Desejada"
3. **Não permite salvar**

---

## 6️⃣ Checklist Completo

### Backend Railway

- [ ] Root Directory configurado como `backend`
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy bem-sucedido
- [ ] Logs mostram "Backend rodando!"
- [ ] `/health` retorna JSON correto
- [ ] `/api/health` retorna JSON correto

### Banco de Dados

- [ ] PostgreSQL acessível de fora
- [ ] Firewall liberado para Railway
- [ ] Credenciais corretas nas variáveis

### Frontend Mobile

- [ ] `api.ts` com URL correta do Railway
- [ ] Modo configurado como `production`
- [ ] Metro bundler rodando
- [ ] App abre sem erros

### Funcionalidades

- [ ] Validação de CNPJ funciona
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Criar pedido funciona
- [ ] Listar pedidos funciona
- [ ] Editar preço funciona
- [ ] Validação de margem funciona
- [ ] Sincronização funciona

---

## 🆘 Troubleshooting

### Erro: "Network request failed"

**Causas:**
- Backend Railway não está rodando
- URL incorreta em `api.ts`
- Firewall bloqueando

**Soluções:**
1. Verifique se `/health` responde no navegador
2. Verifique a URL em `src/config/api.ts`
3. Veja os logs do Railway

### Erro: "CNPJ não encontrado"

**Causas:**
- CNPJ não existe no banco
- Banco de dados inacessível

**Soluções:**
1. Verifique se o PostgreSQL está acessível
2. Teste conexão com o banco
3. Verifique as credenciais

### Erro: "Erro ao conectar ao PostgreSQL"

**Causas:**
- Firewall bloqueando Railway
- Credenciais incorretas
- Banco offline

**Soluções:**
1. Verifique se `cloud.digitalrf.com.br` aceita conexões externas
2. Verifique as variáveis de ambiente no Railway
3. Teste conexão direta ao banco

### App não conecta ao backend

**Causas:**
- Modo errado em `api.ts`
- URL incorreta
- Backend não respondendo

**Soluções:**
1. Verifique `MODO_ATUAL` em `api.ts`
2. Teste a URL no navegador
3. Reinicie o Metro bundler: `npx expo start --clear`

---

## 📊 Status Atual

### Backend Railway
- URL: `https://backeend-pedido-production.up.railway.app`
- Status: ⚠️ **Aguardando configuração Root Directory**

### Frontend
- Configurado para: `production`
- URL: `https://backeend-pedido-production.up.railway.app/api`
- Status: ✅ **Pronto**

### Banco de Dados
- Host: `cloud.digitalrf.com.br`
- Database: `drfpedido`
- Status: ❓ **Verificar acessibilidade externa**

---

## 📞 Comandos Úteis

```powershell
# Testar backend Railway
curl https://backeend-pedido-production.up.railway.app/health

# Iniciar app com cache limpo
npx expo start --clear

# Ver logs do Metro Bundler
# (já aparecem automaticamente)

# Reinstalar dependências
npm install

# Limpar cache do Expo
npx expo start --clear
rm -rf node_modules
npm install
```

---

## ✅ Conclusão

Se todos os testes passarem, seu sistema está funcionando corretamente! 🎉

**Próximos passos:**
1. Configure o Root Directory no Railway
2. Aguarde o redeploy
3. Teste o endpoint `/health`
4. Teste o app mobile
5. Comece a usar! 🚀
