# 🔧 Corrigir Erro "No package manager inferred"

## Problema
Railway não está encontrando o `package.json` do backend.

---

## ✅ Solução Rápida

### No Railway, vá em **Settings**:

1. **Root Directory**
   - Se o backend está na pasta `backend/`: configure como `backend`
   - Se o backend está na raiz: deixe vazio

2. **Install Command** (opcional, mas recomendado)
   ```
   npm ci
   ```

3. **Start Command**
   ```
   node server.js
   ```

4. **Clique em "Redeploy"** no topo da página

---

## 🔍 Verificar Estrutura do Repositório

O repositório atual tem o backend na pasta **`backend/`**:
```
pedidoback/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── ...
├── src/
├── app.json
└── ...
```

### ⚠️ Configuração Correta:
- **Root Directory**: `backend`
- Isso fará o Railway procurar o `package.json` dentro de `backend/`

---

## 🔄 Alternativa: Mover Backend para Raiz

Se preferir manter o backend na raiz do projeto:

**No computador:**
```bash
# Na pasta do projeto
mv backend/* .
mv backend/.gitignore .gitignore-backend
mv backend/.env .env
```

Então:
- **Root Directory** no Railway: (vazio)
- Commit e push das mudanças

⚠️ **Não recomendado** - melhor usar Root Directory

---

## 📝 Checklist Final

Railway > Settings:

- [ ] **Root Directory**: `backend`
- [ ] **Install Command**: `npm ci` (ou deixar vazio)
- [ ] **Start Command**: `node server.js`
- [ ] **Environment Variables**: todas configuradas (ver RAILWAY-VARIAVEIS.md)
- [ ] Clicar em **Redeploy**

---

## 🧪 Testar Após Deploy

Aguarde 1-2 minutos e teste:

```bash
curl https://pedidoback-production.up.railway.app/api/health
```

Deve retornar: `{"status":"ok"}`

---

## 📊 Ver Logs

Durante o deploy, veja os logs:
- Railway > Deployments > último deploy > View Logs

Procure por:
- ✅ "Installing dependencies..."
- ✅ "Starting application..."
- ✅ "Servidor rodando na porta..."
- ❌ Erros em vermelho
