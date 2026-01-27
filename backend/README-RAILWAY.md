# Deploy do Backend no Railway

Este guia mostra como fazer deploy do backend Node.js no Railway.

## Pré-requisitos

- Conta no Railway (https://railway.app)
- Código do backend commitado em um repositório Git (GitHub, GitLab, etc.)

## Passo a Passo

### 1. Criar Novo Projeto no Railway

1. Acesse https://railway.app
2. Faça login com sua conta
3. Clique em **"New Project"**
4. Selecione **"Deploy from GitHub repo"** (ou GitLab/Bitbucket)
5. Selecione o repositório do seu projeto

### 2. Configurar o Serviço

1. O Railway vai detectar automaticamente que é um projeto Node.js
2. Configure o **Root Directory** como `/backend` (se o backend estiver em uma subpasta)
3. O Railway vai usar o comando `npm start` automaticamente

### 3. Configurar Variáveis de Ambiente

No Railway, vá em **Variables** e adicione as seguintes variáveis:

```bash
NODE_ENV=production
HOST=0.0.0.0
PORT=3001

# Banco de Dados PostgreSQL
DB_HOST=cloud.digitalrf.com.br
DB_PORT=5432
DB_NAME=drfpedido
DB_USER=drfpedido
DB_PASSWORD=A@gTY73AH6df

# CORS
CORS_ORIGINS=*

# Servidor
SERVER_PUBLIC_IP=seu-app.railway.app
```

**IMPORTANTE**: O Railway define automaticamente a variável `PORT`, mas você pode sobrescrever se necessário.

### 4. Deploy Automático

1. O Railway vai fazer o deploy automaticamente após você adicionar as variáveis
2. Aguarde o build e deploy serem concluídos (cerca de 1-2 minutos)
3. O Railway vai fornecer uma URL pública (ex: `https://seu-app.up.railway.app`)

### 5. Testar o Backend

Após o deploy, teste o backend acessando:

```bash
https://seu-app.up.railway.app/api/health
```

Você deve receber uma resposta indicando que o servidor está funcionando.

### 6. Configurar Domínio Personalizado (Opcional)

1. No Railway, vá em **Settings** > **Domains**
2. Clique em **Generate Domain** para gerar um domínio Railway gratuito
3. Ou adicione seu próprio domínio customizado

### 7. Atualizar o Frontend

Após obter a URL do Railway, atualize o arquivo `src/config/api.ts` do frontend:

```typescript
const API_URLS = {
  production: "https://seu-app.up.railway.app/api",
  // ...
}
```

## Logs e Monitoramento

- Acesse os logs em tempo real no Railway clicando em **View Logs**
- Monitore o uso de recursos em **Metrics**

## Redeploy

O Railway faz redeploy automático quando você faz push para o branch configurado (geralmente `main` ou `master`).

Para forçar um redeploy manual:
1. Vá em **Deployments**
2. Clique nos três pontos no último deploy
3. Selecione **Redeploy**

## Troubleshooting

### Erro de Conexão com o Banco de Dados

Verifique se:
- As variáveis `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD` estão corretas
- O servidor PostgreSQL (`cloud.digitalrf.com.br`) permite conexões externas
- O firewall do servidor PostgreSQL está configurado para permitir o IP do Railway

### Erro de CORS

Se você receber erros de CORS no frontend:
- Verifique se `CORS_ORIGINS` está configurado como `*` ou inclui o domínio do seu app Expo

### App não inicia

Verifique:
- Se o comando `npm start` está configurado em `package.json`
- Os logs do Railway para ver erros específicos
- Se todas as dependências foram instaladas corretamente

## Configuração de Produção

### Segurança

Para produção, considere:

1. **CORS mais restritivo**: Em vez de `CORS_ORIGINS=*`, especifique os domínios permitidos:
   ```
   CORS_ORIGINS=https://seu-app.com,https://expo.dev
   ```

2. **Rate Limiting**: Adicione rate limiting para prevenir abuso da API

3. **HTTPS**: O Railway fornece HTTPS automaticamente

## Custo

O Railway oferece:
- **Plano Free**: $5 de crédito gratuito por mês
- **Plano Hobby**: $5/mês (sem limite de créditos)

Para este backend simples, o plano gratuito geralmente é suficiente para desenvolvimento e testes.

## Suporte

- Documentação oficial: https://docs.railway.app
- Discord da Railway: https://discord.gg/railway
- GitHub Issues do projeto
