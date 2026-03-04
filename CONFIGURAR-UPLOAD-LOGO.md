# Configuração do Sistema de Upload de Logo

## ✅ O que já foi implementado no App

1. **Componente de gerenciamento de logo** - Modal para visualizar, selecionar e fazer upload
2. **Verificação de permissão** - Sistema que verifica se o usuário pode alterar a logo
3. **Upload de imagem** - Seleção de imagem da galeria e envio para o servidor
4. **Exibição dinâmica** - Logo aparece no Login e Dashboard automaticamente

## 🔧 O que precisa ser implementado no Backend

### 1. Adicionar Coluna logo_url na tab_base

A coluna `logo_url` já foi adicionada na tabela `tab_base`, pois é nela que o sistema confere o CNPJ:

```sql
-- Coluna já criada na tab_base
ALTER TABLE tab_base ADD COLUMN logo_url VARCHAR(500);
```

**Importante:** A `tab_base` é onde fica armazenado o CNPJ e o schema. Quando o usuário valida o CNPJ no login, o backend busca nessa tabela e retorna a logo_url correspondente.

### 2. Criar Pasta para Armazenar Logos

```bash
# No servidor, criar pasta para logos
mkdir -p /caminho/do/servidor/public/logos
chmod 755 /caminho/do/servidor/public/logos
```

### 3. Implementar Endpoints no Backend

#### Endpoint 1: Verificar Permissão
**POST** `/logo/verificar-permissao`

```javascript
// Request
{
  "schema": "copetrol_matriz",
  "cod_usuario": "ADMIN"  // Código do usuário que vem da tab_usuario
}

// Response
{
  "success": true,
  "data": {
    "tem_permissao": true,
    "cod_usuario_autorizado": "ADMIN"
  }
}
```

**Lógica:**
1. Buscar o parâmetro 10 na `tab_parametro` do schema
2. Verificar se o `cod_usuario` está no `val_parametro`
3. Retornar se o usuário tem permissão

```sql
-- Query para buscar parâmetro 10
SELECT val_parametro
FROM copetrol_matriz.tab_parametro
WHERE cod_parametro = 10;

-- val_parametro pode conter:
-- Um usuário: "ADMIN"
-- Múltiplos usuários: "ADMIN,GERENTE,SUPERVISOR"

-- Exemplo de verificação completa
SELECT
  CASE
    WHEN val_parametro LIKE '%' || 'ADMIN' || '%' THEN true
    ELSE false
  END as tem_permissao
FROM copetrol_matriz.tab_parametro
WHERE cod_parametro = 10;
```

**Importante:** O `cod_usuario` enviado pelo app vem do login e está armazenado em `schema.tab_usuario`.

#### Endpoint 2: Upload da Logo
**POST** `/logo/upload`

```javascript
// Request (multipart/form-data)
{
  "schema": "schema_empresa",
  "logo": [arquivo de imagem]
}

// Response
{
  "success": true,
  "message": "Logo atualizada com sucesso",
  "data": {
    "logo_url": "https://seuservidor.com/logos/schema_empresa_logo.png"
  }
}
```

**Lógica:**
1. Receber o arquivo de imagem
2. Validar formato (PNG, JPG, JPEG)
3. Validar tamanho (max 5MB)
4. Salvar com nome único: `${schema}_logo_${timestamp}.ext`
5. Atualizar no banco de dados a URL da logo
6. Retornar a URL completa da logo

**Exemplo de código Node.js com Multer:**

```javascript
const multer = require('multer');
const path = require('path');

// Configurar storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/logos/');
  },
  filename: (req, file, cb) => {
    const schema = req.body.schema;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${schema}_logo_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens PNG e JPEG são permitidas!'));
    }
  }
});

// Endpoint
app.post('/logo/upload', upload.single('logo'), async (req, res) => {
  try {
    const { schema } = req.body;
    const logoUrl = `${process.env.BASE_URL}/logos/${req.file.filename}`;

    // Salvar no banco - Atualizar na tab_base
    await pool.query(
      `UPDATE tab_base SET logo_url = $1 WHERE schema = $2`,
      [logoUrl, schema]
    );

    res.json({
      success: true,
      message: 'Logo atualizada com sucesso',
      data: { logo_url: logoUrl }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer upload da logo'
    });
  }
});
```

#### Endpoint 3: Obter Logo Atual (Opcional)
**POST** `/logo/obter`

```javascript
// Request
{
  "schema": "schema_empresa"
}

// Response
{
  "success": true,
  "logo_url": "https://seuservidor.com/logos/schema_empresa_logo.png"
}
```

**Query SQL:**
```sql
SELECT logo_url
FROM tab_base
WHERE schema = 'schema_empresa';
```

### 4. Atualizar Endpoints Existentes

#### Atualizar `/auth/validate-cnpj`
Retornar a logo junto com os dados do CNPJ:

```javascript
{
  "success": true,
  "data": {
    "cnpj": "12345678000199",
    "schema": "schema_empresa",
    "logo_url": "https://seuservidor.com/logos/schema_empresa_logo.png",
    "nome_empresa": "Empresa Exemplo"
  }
}
```

#### Atualizar `/auth/login`
Retornar a logo junto com os dados do login:

```javascript
{
  "success": true,
  "data": {
    "usuario": "ADMIN",
    "token": "abc123...",
    "cnpj": "12345678000199",
    "schema": "schema_empresa",
    "logo_url": "https://seuservidor.com/logos/schema_empresa_logo.png",
    "nome_empresa": "Empresa Exemplo"
  }
}
```

### 5. Configurar Parâmetro de Permissão

O parâmetro 10 define quais usuários (baseado no `cod_usuario` da `tab_usuario`) podem alterar a logo:

```sql
-- Exemplo para permitir apenas o usuário ADMIN
INSERT INTO copetrol_matriz.tab_parametro (cod_parametro, des_parametro, val_parametro)
VALUES (10, 'Usuários autorizados a alterar logo', 'ADMIN');

-- Exemplo para permitir múltiplos usuários (separados por vírgula)
INSERT INTO copetrol_matriz.tab_parametro (cod_parametro, des_parametro, val_parametro)
VALUES (10, 'Usuários autorizados a alterar logo', 'ADMIN,GERENTE,SUPERVISOR');

-- Verificar usuários cadastrados
SELECT cod_usuario, nom_usuario
FROM copetrol_matriz.tab_usuario
WHERE ativo = true;
```

**Importante:** O `cod_usuario` no parâmetro 10 deve corresponder ao `cod_usuario` da `schema.tab_usuario`.

## 🎯 Fluxo Completo

1. **Usuário clica no botão ⚙️** no Dashboard
2. **App verifica permissão** → `/logo/verificar-permissao`
3. **Se não tem permissão** → Mostra mensagem de bloqueio
4. **Se tem permissão** → Mostra opção de upload
5. **Usuário seleciona imagem** → Galeria de fotos
6. **Usuário confirma** → Faz upload → `/logo/upload`
7. **Backend salva logo** → Retorna URL
8. **App atualiza logo** → Aparece em todas as telas

## 📝 Testando

### Teste 1: Usuário sem permissão
```bash
# Parâmetro 10 = "ADMIN"
# Usuário logado = "VENDEDOR"
# Resultado esperado: "Você não tem permissão"
```

### Teste 2: Usuário com permissão
```bash
# Parâmetro 10 = "ADMIN,VENDEDOR"
# Usuário logado = "VENDEDOR"
# Resultado esperado: Permite fazer upload
```

### Teste 3: Upload de logo
```bash
# 1. Selecionar imagem PNG/JPG
# 2. Confirmar upload
# 3. Ver logo aparecer no Dashboard e Login
```

## 🔐 Segurança

1. **Validar formato de arquivo** - Apenas PNG, JPG, JPEG
2. **Limitar tamanho** - Máximo 5MB
3. **Verificar permissão** - Sempre checar parâmetro 10
4. **Sanitizar nome do arquivo** - Evitar path traversal
5. **Usar HTTPS** - Para URLs de logo

## 📌 Observações

- A logo é vinculada ao **schema** (não ao CNPJ)
- Cada schema tem sua própria logo
- A logo é exibida automaticamente após upload
- Não é necessário fazer logout/login para ver a nova logo

## 📊 Estrutura das Tabelas Envolvidas

### 1. tab_base (Armazena logo_url)
```sql
-- Estrutura simplificada
CREATE TABLE tab_base (
  cnpj VARCHAR(14),
  schema VARCHAR(100),
  nom_fantasia VARCHAR(200),
  logo_url VARCHAR(500)  -- NOVA COLUNA
);

-- Exemplo de dados
-- cnpj: '53865832000137'
-- schema: 'copetrol_matriz'
-- nom_fantasia: 'COPETROL MATRIZ'
-- logo_url: 'https://seuservidor.com/logos/copetrol_matriz_logo.png'
```

### 2. schema.tab_usuario (Usuários do sistema)
```sql
-- Estrutura simplificada
CREATE TABLE copetrol_matriz.tab_usuario (
  cod_usuario VARCHAR(50) PRIMARY KEY,
  nom_usuario VARCHAR(200),
  senha VARCHAR(255),
  ativo BOOLEAN
);

-- Exemplo de dados
-- cod_usuario: 'ADMIN'
-- nom_usuario: 'Administrador'
```

### 3. schema.tab_parametro (Controle de permissões)
```sql
-- Estrutura simplificada
CREATE TABLE copetrol_matriz.tab_parametro (
  cod_parametro INTEGER,
  des_parametro VARCHAR(200),
  val_parametro TEXT
);

-- Exemplo para parâmetro 10
-- cod_parametro: 10
-- des_parametro: 'Usuários autorizados a alterar logo'
-- val_parametro: 'ADMIN,GERENTE'
```

### Relacionamento

```
tab_base (logo_url)
    ↓ (via schema)
schema.tab_usuario (cod_usuario)
    ↓ (verificação)
schema.tab_parametro (parâmetro 10 contém cod_usuario?)
    ↓
Permissão concedida ou negada
```
