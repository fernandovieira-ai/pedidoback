# 🚀 Variáveis de Ambiente para Railway

## Variáveis Obrigatórias

Configure estas variáveis no Railway (aba **Variables**):

```env
# Ambiente
NODE_ENV=production

# Banco de Dados PostgreSQL
DB_HOST=cloud.digitalrf.com.br
DB_PORT=5432
DB_NAME=drfpedido
DB_USER=drfpedido
DB_PASSWORD=A@gTY73AH6df

# CORS (permitir todas origens)
CORS_ORIGINS=*

# Porta (Railway define automaticamente, mas pode definir)
PORT=3001

# Host
HOST=0.0.0.0

# URL pública do servidor (IMPORTANTE para upload de logo)
# Após o deploy, pegue a URL do Railway e coloque aqui
# Exemplo: https://pedidoback-production.up.railway.app
SERVER_PUBLIC_URL=https://SEU-DOMINIO-RAILWAY.up.railway.app
```

## ⚠️ IMPORTANTE

1. **SERVER_PUBLIC_URL**: Após fazer o primeiro deploy:
   - Vá em **Settings** > **Domains** no Railway
   - Clique em **Generate Domain**
   - Copie a URL gerada (exemplo: `https://pedidoback-production.up.railway.app`)
   - Volte em **Variables** e atualize `SERVER_PUBLIC_URL` com essa URL
   - Isso é necessário para o sistema de upload de logo funcionar corretamente

2. **Banco de Dados**: Certifique-se que o servidor PostgreSQL aceita conexões externas dos IPs do Railway

3. **Root Directory**: Se configurar no Railway, defina como `backend` (raiz do projeto já está correta)

## Verificação após Deploy

Teste a API acessando: `https://SEU-DOMINIO/api/health`

## Atualizar Frontend

Depois do deploy, atualize o arquivo `src/config/api.ts`:

```typescript
production: "https://SEU-DOMINIO-RAILWAY.up.railway.app/api",
```

E mude o modo:

```typescript
const MODO_ATUAL: "local" | "network" | "production" = "production";
```
