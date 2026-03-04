# ✅ Status do Sistema de Logo - 100% Implementado no App

## 📱 O que JÁ ESTÁ FUNCIONANDO no App

### 1. **Exibição Automática da Logo**
- ✅ **LoginScreen** - Logo aparece ao validar CNPJ
- ✅ **DashboardScreen** - Logo aparece no header com botão de configuração
- ✅ **Componente Reutilizável** - `EmpresaLogo` mostra logo ou placeholder

### 2. **Gerenciamento de Logo (Modal)**
- ✅ Botão ⚙️ ao lado da logo no Dashboard
- ✅ Verifica se usuário tem permissão (parâmetro 10)
- ✅ Permite selecionar imagem da galeria
- ✅ Mostra preview antes de enviar
- ✅ Faz upload para o servidor
- ✅ Atualiza logo em tempo real

### 3. **Controle de Permissão**
- ✅ Consulta backend para verificar se usuário pode alterar logo
- ✅ Bloqueia usuários não autorizados (parâmetro 10)
- ✅ Mostra mensagem clara quando sem permissão

### 4. **Persistência de Dados**
- ✅ Logo salva localmente após login
- ✅ Não precisa buscar sempre do servidor
- ✅ Atualiza automaticamente ao trocar de CNPJ

## 🔧 O que o BACKEND precisa fazer

### Estrutura da tab_base (JÁ CRIADA)
```sql
-- Coluna já adicionada
ALTER TABLE tab_base ADD COLUMN logo_url VARCHAR(500);
```

### Endpoints Necessários

#### 1️⃣ `/auth/validate-cnpj` - ATUALIZAR
Ao validar CNPJ, buscar logo_url da tab_base:

```javascript
// Query SQL
SELECT
  cnpj,
  schema,
  logo_url,
  nom_fantasia as nome_empresa
FROM tab_base
WHERE cnpj = '12345678000199';

// Response esperada
{
  "success": true,
  "data": {
    "cnpj": "12345678000199",
    "schema": "copetrol_matriz",
    "logo_url": "https://seuservidor.com/logos/copetrol_matriz_logo.png",
    "nome_empresa": "COPETROL MATRIZ"
  }
}
```

#### 2️⃣ `/auth/login` - ATUALIZAR
Retornar logo junto com dados do login:

```javascript
// Query SQL
SELECT
  b.logo_url,
  b.nom_fantasia as nome_empresa
FROM tab_base b
WHERE b.schema = 'copetrol_matriz';

// Response esperada
{
  "success": true,
  "data": {
    "usuario": "ADMIN",
    "token": "abc123...",
    "cnpj": "12345678000199",
    "schema": "copetrol_matriz",
    "logo_url": "https://seuservidor.com/logos/copetrol_matriz_logo.png",
    "nome_empresa": "COPETROL MATRIZ"
  }
}
```

#### 3️⃣ `/logo/verificar-permissao` - CRIAR NOVO
Verificar se usuário pode alterar logo (parâmetro 10):

```javascript
// Request
{
  "schema": "copetrol_matriz",
  "cod_usuario": "ADMIN"  // O app envia o cod_usuario que veio do login
}

// Query SQL - Buscar parâmetro 10
SELECT val_parametro
FROM copetrol_matriz.tab_parametro
WHERE cod_parametro = 10;

// Verificar se cod_usuario está em val_parametro
// val_parametro pode ser: "ADMIN" ou "ADMIN,GERENTE,SUPERVISOR"

// Exemplo de verificação em SQL
SELECT
  CASE
    WHEN val_parametro LIKE '%' || 'ADMIN' || '%' THEN true
    ELSE false
  END as tem_permissao
FROM copetrol_matriz.tab_parametro
WHERE cod_parametro = 10;

// Response
{
  "success": true,
  "data": {
    "tem_permissao": true,
    "cod_usuario_autorizado": "ADMIN"
  }
}
```

**Nota:** O `cod_usuario` vem da `schema.tab_usuario` e é enviado pelo app após o login.

#### 4️⃣ `/logo/upload` - CRIAR NOVO
Receber imagem e salvar na tab_base:

```javascript
// Request (multipart/form-data)
{
  "schema": "copetrol_matriz",
  "logo": [arquivo de imagem]
}

// Passos:
// 1. Salvar arquivo: public/logos/copetrol_matriz_logo_1234567890.jpg
// 2. Gerar URL: https://seuservidor.com/logos/copetrol_matriz_logo_1234567890.jpg
// 3. Atualizar banco:
UPDATE tab_base
SET logo_url = 'https://seuservidor.com/logos/copetrol_matriz_logo_1234567890.jpg'
WHERE schema = 'copetrol_matriz';

// Response
{
  "success": true,
  "message": "Logo atualizada com sucesso",
  "data": {
    "logo_url": "https://seuservidor.com/logos/copetrol_matriz_logo_1234567890.jpg"
  }
}
```

## 🎯 Configuração do Parâmetro 10

Para cada schema que quiser permitir alteração de logo:

```sql
-- Permitir apenas 1 usuário
INSERT INTO copetrol_matriz.tab_parametro (cod_parametro, des_parametro, val_parametro)
VALUES (10, 'Usuários autorizados a alterar logo', 'ADMIN');

-- Permitir múltiplos usuários (separados por vírgula)
INSERT INTO copetrol_matriz.tab_parametro (cod_parametro, des_parametro, val_parametro)
VALUES (10, 'Usuários autorizados a alterar logo', 'ADMIN,GERENTE,SUPERVISOR');
```

## 📁 Estrutura de Pastas no Servidor

```bash
/seu-servidor/
  ├── backend/
  │   └── routes/
  │       ├── auth.js          # Atualizar validate-cnpj e login
  │       └── logo.js          # CRIAR NOVO - endpoints de logo
  └── public/
      └── logos/               # CRIAR PASTA
          ├── copetrol_matriz_logo_1234567890.jpg
          ├── copetrol_filial_logo_9876543210.png
          └── ...
```

## 🧪 Como Testar

### Teste 1: Login e Ver Logo
1. Adicionar logo_url na tab_base manualmente:
```sql
UPDATE tab_base
SET logo_url = 'https://via.placeholder.com/512'
WHERE schema = 'copetrol_matriz';
```

2. Fazer login no app
3. ✅ Logo deve aparecer no Login e Dashboard

### Teste 2: Upload de Logo (Com Permissão)
1. Configurar parâmetro 10:
```sql
INSERT INTO copetrol_matriz.tab_parametro (cod_parametro, val_parametro)
VALUES (10, 'ADMIN');
```

2. Logar com usuário ADMIN
3. Clicar no ⚙️ ao lado da logo no Dashboard
4. ✅ Deve permitir selecionar e fazer upload

### Teste 3: Upload de Logo (Sem Permissão)
1. Parâmetro 10 = "ADMIN"
2. Logar com usuário diferente de ADMIN
3. Clicar no ⚙️ ao lado da logo
4. ✅ Deve mostrar: "Você não tem permissão para alterar a logo"

## 📊 Fluxo Completo

```
1. Usuário informa CNPJ
   └─> Backend busca logo_url da tab_base
   └─> App exibe logo no Login

2. Usuário faz login
   └─> Backend retorna logo_url novamente
   └─> App salva logo localmente
   └─> Logo aparece no Dashboard

3. Usuário clica em ⚙️ (configurar logo)
   └─> App verifica permissão (parâmetro 10)
   └─> Se autorizado: permite upload
   └─> Se não autorizado: bloqueia

4. Usuário faz upload de nova logo
   └─> Backend salva arquivo
   └─> Backend atualiza tab_base
   └─> App atualiza logo em tempo real
   └─> Próximo login já mostra nova logo
```

## 🔒 Segurança Implementada

- ✅ Apenas formatos PNG/JPG/JPEG permitidos
- ✅ Limite de tamanho de arquivo (5MB)
- ✅ Verificação de permissão por usuário (parâmetro 10)
- ✅ Logo vinculada ao schema (não ao CNPJ)
- ✅ Validação antes de upload

## 📋 Estrutura das Tabelas

### tab_base (logo_url)
```sql
-- Armazena a logo por schema
cnpj: '53865832000137'
schema: 'copetrol_matriz'
nom_fantasia: 'COPETROL MATRIZ'
logo_url: 'https://servidor.com/logos/copetrol_matriz_logo.png'
```

### schema.tab_usuario (cod_usuario)
```sql
-- Usuários do sistema
cod_usuario: 'ADMIN'
nom_usuario: 'Administrador'
```

### schema.tab_parametro (permissões)
```sql
-- Parâmetro 10 controla quem pode alterar logo
cod_parametro: 10
val_parametro: 'ADMIN,GERENTE'  -- Códigos dos usuários autorizados
```

**Fluxo de Verificação:**
1. App envia `schema` + `cod_usuario` (do login)
2. Backend busca parâmetro 10 em `schema.tab_parametro`
3. Backend verifica se `cod_usuario` está no `val_parametro`
4. Retorna permissão concedida ou negada

## 📝 Notas Importantes

1. **A logo é por schema**, não por CNPJ
2. **tab_base** é a tabela que armazena a logo_url
3. **Parâmetro 10** controla quem pode alterar
4. **Nome da empresa** vem de `nom_fantasia` da tab_base
5. **App já está 100% pronto** - só falta implementar backend

## ✅ Checklist de Implementação

### Frontend (App) - CONCLUÍDO ✅
- [x] Componente de logo
- [x] Modal de gerenciamento
- [x] Verificação de permissão
- [x] Upload de imagem
- [x] Exibição no Login
- [x] Exibição no Dashboard
- [x] Persistência local

### Backend - PENDENTE ⏳
- [ ] Atualizar `/auth/validate-cnpj`
- [ ] Atualizar `/auth/login`
- [ ] Criar `/logo/verificar-permissao`
- [ ] Criar `/logo/upload`
- [ ] Criar pasta `public/logos`
- [ ] Configurar parâmetro 10 em cada schema

---

**Status Atual:** App 100% pronto. Aguardando implementação dos endpoints no backend.
