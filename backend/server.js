require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const app = express();

// Configurações do servidor
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";
const NODE_ENV = process.env.NODE_ENV || "development";

// Configuração CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);

    // Em desenvolvimento, permitir todas as origens
    if (NODE_ENV === "development") {
      return callback(null, true);
    }

    // Em produção, permitir apenas origens específicas
    const allowedOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
      : ["*"];

    if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Não permitido pelo CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Servir arquivos estáticos da pasta logos
const path = require("path");
const fs = require("fs");
const logosDir = path.join(__dirname, "public", "logos");
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}
app.use("/logos", express.static(path.join(__dirname, "public", "logos")));

// ===============================================
// ROTAS DE AUTENTICAÇÃO
// ===============================================
// ROTAS DE AUTENTICAÇÃO
// ===============================================

// POST /api/auth/validate-cnpj
app.post("/api/auth/validate-cnpj", async (req, res) => {
  try {
    const { cnpj } = req.body;

    if (!cnpj) {
      return res.status(400).json({
        success: false,
        message: "CNPJ não informado",
      });
    }

    // Remove formatação do CNPJ
    const cnpjNumeros = cnpj.replace(/\D/g, "");

    // Busca o CNPJ na tabela tab_base
    const query = `
      SELECT num_cnpj, nom_empresa, nom_schema as schema, logo_url
      FROM tab_base
      WHERE num_cnpj = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [cnpjNumeros]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "CNPJ não encontrado",
      });
    }

    const empresa = result.rows[0];

    res.json({
      success: true,
      message: "CNPJ validado com sucesso",
      data: {
        cnpj: empresa.num_cnpj,
        schema: empresa.schema,
        logo_url: empresa.logo_url,
        nome_empresa: empresa.nom_empresa,
      },
    });
  } catch (error) {
    console.error("Erro ao validar CNPJ:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao validar CNPJ",
    });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { cnpj, schema, usuario, senha } = req.body;

    if (!cnpj || !schema || !usuario || !senha) {
      return res.status(400).json({
        success: false,
        message: "Dados incompletos",
      });
    }

    // Criptografa a senha em MD5 (MAIÚSCULO)
    const crypto = require("crypto");
    const senhaMD5 = crypto
      .createHash("md5")
      .update(senha)
      .digest("hex")
      .toUpperCase();

    console.log("=== DEBUG LOGIN ===");
    console.log("Usuário:", usuario);
    console.log("Senha original:", senha);
    console.log("Senha MD5:", senhaMD5);
    console.log("Schema:", schema);

    // Busca o usuário no schema específico da tab_usuario
    const query = `
      SELECT cod_usuario, nom_operador, ind_ativo, des_senha
      FROM ${schema}.tab_usuario
      WHERE nom_operador = $1 AND ind_ativo = 'S'
      LIMIT 1
    `;

    const result = await pool.query(query, [usuario]);

    console.log("Resultado query:", result.rows);

    if (result.rows.length === 0) {
      console.log("Usuário não encontrado ou inativo");
      return res.status(401).json({
        success: false,
        message: "Usuário não encontrado ou inativo",
      });
    }

    const user = result.rows[0];
    console.log("Senha no banco:", user.des_senha);
    console.log("Senhas conferem?", user.des_senha === senhaMD5);

    // Verifica a senha
    if (user.des_senha !== senhaMD5) {
      console.log("Senha inválida");
      return res.status(401).json({
        success: false,
        message: "Senha inválida",
      });
    }

    console.log("Login bem-sucesso!");

    // Executa a procedure sp_cadastro_app para registrar o acesso
    try {
      console.log(`Executando sp_cadastro_app para o schema: ${schema}`);
      const procedureQuery = `SELECT ${schema}.sp_cadastro_app($1)`;
      await pool.query(procedureQuery, [schema]);
      console.log(`✅ Procedure sp_cadastro_app executada com sucesso`);
    } catch (procError) {
      // Log do erro, mas não interrompe o login
      console.error(
        `⚠️ Erro ao executar sp_cadastro_app (não crítico):`,
        procError.message,
      );
    }

    // Busca logo_url e nome_empresa da tab_base
    const logoQuery = `
      SELECT logo_url, nom_empresa
      FROM tab_base
      WHERE nom_schema = $1
      LIMIT 1
    `;
    const logoResult = await pool.query(logoQuery, [schema]);
    const logoData =
      logoResult.rows.length > 0 ? logoResult.rows[0] : { logo_url: null, nom_empresa: null };

    // Gera um token simples (em produção, use JWT)
    const token = Buffer.from(`${schema}:${usuario}:${Date.now()}`).toString(
      "base64",
    );

    res.json({
      success: true,
      message: "Login realizado com sucesso",
      data: {
        usuario: user.nom_operador,
        cod_usuario: user.cod_usuario,
        cnpj: cnpj,
        schema: schema,
        token: token,
        logo_url: logoData.logo_url,
        nome_empresa: logoData.nom_empresa,
      },
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao fazer login",
    });
  }
});

// ===============================================
// ROTAS DE CLIENTES
// ===============================================

// POST /api/clientes/pesquisar
app.post("/api/clientes/pesquisar", async (req, res) => {
  try {
    const { schema, termo, usuario, limit = 100, offset = 0 } = req.body;

    if (!schema) {
      return res.status(400).json({
        success: false,
        message: "Schema não informado",
      });
    }

    // 1. Busca o parâmetro cod_parametro = 1 (filtro por vendedor)
    const parametroQuery = `
      SELECT val_parametro 
      FROM ${schema}.tab_parametro 
      WHERE cod_parametro = 1
      LIMIT 1
    `;
    const parametroResult = await pool.query(parametroQuery);
    const filtrarPorVendedor =
      parametroResult.rows.length > 0 &&
      parametroResult.rows[0].val_parametro === "S";

    let codVendedor = null;

    // 2. Se filtro ativo e usuário informado, busca cod_vendedor do usuário
    if (filtrarPorVendedor && usuario) {
      const usuarioQuery = `
        SELECT cod_vendedor 
        FROM ${schema}.tab_usuario 
        WHERE nom_operador = $1 AND ind_ativo = 'S'
        LIMIT 1
      `;
      const usuarioResult = await pool.query(usuarioQuery, [usuario]);

      if (usuarioResult.rows.length > 0) {
        codVendedor = usuarioResult.rows[0].cod_vendedor;
      }
    }

    // 3. Busca clientes no schema específico da tab_pessoa
    let query = `
      SELECT 
        cod_pessoa,
        nom_pessoa,
        num_cnpj_cpf as num_cnpj,
        logradouro as des_endereco,
        cidade as nom_cidade
      FROM ${schema}.tab_pessoa
      WHERE ind_cliente = 'S'
    `;

    const params = [];
    let paramIndex = 1;

    // Filtro por vendedor (se ativo e cod_vendedor encontrado)
    if (filtrarPorVendedor && codVendedor) {
      query += ` AND cod_vendedor = $${paramIndex}`;
      params.push(codVendedor);
      paramIndex++;
    }

    // Se houver termo de pesquisa, adiciona filtro
    if (termo && termo.trim()) {
      const termoLimpo = termo.trim();
      const isNumerico = /^\d+$/.test(termoLimpo);

      if (isNumerico) {
        // Termo numérico: prioriza busca exata por código, depois CNPJ
        query += ` AND (
          cod_pessoa = $${paramIndex} OR
          num_cnpj_cpf LIKE $${paramIndex + 1}
        )`;
        params.push(parseInt(termoLimpo)); // cod_pessoa exato (número)
        params.push(`%${termoLimpo}%`); // CNPJ com LIKE
        paramIndex += 2;
      } else {
        // Termo alfanumérico: busca por nome
        query += ` AND nom_pessoa ILIKE $${paramIndex}`;
        params.push(`%${termoLimpo}%`);
        paramIndex++;
      }
    }

    // Ordenação: se termo for numérico e houver match exato, vem primeiro
    if (termo && /^\d+$/.test(termo.trim())) {
      query += ` ORDER BY CASE WHEN cod_pessoa = $${paramIndex} THEN 0 ELSE 1 END, nom_pessoa`;
      params.push(parseInt(termo.trim()));
      paramIndex++;
    } else {
      query += ` ORDER BY nom_pessoa`;
    }

    query += ` LIMIT ${limit} OFFSET ${offset}`;

    console.log("=== PESQUISAR CLIENTES ===");
    console.log("Schema:", schema);
    console.log("Termo de pesquisa:", termo || "Não informado");
    console.log(
      "Tipo:",
      termo && /^\d+$/.test(termo.trim())
        ? "NUMÉRICO (prioriza código)"
        : "TEXTO (busca nome)",
    );
    console.log("Filtrar por vendedor?", filtrarPorVendedor);
    console.log("Código do vendedor:", codVendedor || "N/A");
    console.log("Query:", query);
    console.log("Params:", params);

    const result = await pool.query(query, params);

    console.log(`✅ Clientes encontrados: ${result.rows.length}`);
    if (result.rows.length > 0) {
      console.log(
        "Primeiros 3 clientes:",
        JSON.stringify(result.rows.slice(0, 3), null, 2),
      );
    }

    // Query para contar total de registros
    let countQuery = `
      SELECT COUNT(*) as total
      FROM ${schema}.tab_pessoa
      WHERE ind_cliente = 'S'
    `;

    let countParams = [];
    let countParamIndex = 1;

    // Aplicar mesmo filtro de vendedor na contagem
    if (filtrarPorVendedor && codVendedor) {
      countQuery += ` AND cod_vendedor = $${countParamIndex}`;
      countParams.push(codVendedor);
      countParamIndex++;
    }

    if (termo && termo.trim()) {
      const termoLimpo = termo.trim();
      const isNumerico = /^\d+$/.test(termoLimpo);

      if (isNumerico) {
        // Termo numérico: prioriza código exato, depois CNPJ
        countQuery += ` AND (
          cod_pessoa = $${countParamIndex} OR
          num_cnpj_cpf LIKE $${countParamIndex + 1}
        )`;
        countParams.push(parseInt(termoLimpo));
        countParams.push(`%${termoLimpo}%`);
      } else {
        // Termo alfanumérico: busca por nome
        countQuery += ` AND nom_pessoa ILIKE $${countParamIndex}`;
        countParams.push(`%${termoLimpo}%`);
      }
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      message:
        result.rows.length > 0
          ? "Clientes encontrados"
          : "Nenhum cliente encontrado",
      data: result.rows,
      pagination: {
        total: total,
        limit: limit,
        offset: offset,
        hasMore: offset + result.rows.length < total,
      },
    });
  } catch (error) {
    console.error("Erro ao pesquisar clientes:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao pesquisar clientes",
    });
  }
});

// POST /api/clientes/enderecos
app.post("/api/clientes/enderecos", async (req, res) => {
  try {
    const { schema, cod_pessoa } = req.body;

    if (!schema) {
      return res.status(400).json({
        success: false,
        message: "Schema não informado",
      });
    }

    if (!cod_pessoa) {
      return res.status(400).json({
        success: false,
        message: "Código da pessoa não informado",
      });
    }

    // Busca endereços do cliente
    const query = `
      SELECT 
        seq_endereco,
        cod_pessoa,
        des_logradouro,
        des_complemento,
        nom_cidade,
        nom_bairro,
        num_cep,
        num_caixa_postal
      FROM ${schema}.tab_pessoa_endereco
      WHERE cod_pessoa = $1
      ORDER BY seq_endereco
    `;

    const result = await pool.query(query, [cod_pessoa]);

    console.log(
      `✅ Endereços encontrados para cliente ${cod_pessoa}: ${result.rows.length}`,
    );

    res.json({
      success: true,
      message:
        result.rows.length > 0
          ? `${result.rows.length} endereço(s) encontrado(s)`
          : "Nenhum endereço encontrado",
      data: result.rows,
    });
  } catch (error) {
    console.error("Erro ao buscar endereços do cliente:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar endereços do cliente",
    });
  }
});

// ===============================================
// ROTAS DE EMPRESAS
// ===============================================

// POST /api/empresas/listar
app.post("/api/empresas/listar", async (req, res) => {
  try {
    const { schema } = req.body;

    if (!schema) {
      return res.status(400).json({
        success: false,
        message: "Schema não informado",
      });
    }

    // Busca empresas no schema específico
    const query = `
      SELECT 
        cod_empresa,
        nom_razao_social,
        nom_fantasia,
        num_cnpj_cpf,
        cod_base
      FROM ${schema}.tab_empresa_schema
      ORDER BY nom_fantasia
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      message:
        result.rows.length > 0
          ? "Empresas encontradas"
          : "Nenhuma empresa encontrada",
      data: result.rows,
    });
  } catch (error) {
    console.error("Erro ao listar empresas:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao listar empresas",
    });
  }
});

// ===============================================
// ROTAS DE ITENS/PRODUTOS
// ===============================================

// POST /api/itens/pesquisar
app.post("/api/itens/pesquisar", async (req, res) => {
  try {
    const { schema, cod_empresa, termo, limit = 50, offset = 0 } = req.body;

    if (!schema) {
      return res.status(400).json({
        success: false,
        message: "Schema não informado",
      });
    }

    if (!cod_empresa) {
      return res.status(400).json({
        success: false,
        message: "Código da empresa não informado",
      });
    }

    // Busca itens com preço e custos
    let query = `
      SELECT 
        i.cod_item,
        i.des_item,
        i.cod_barra,
        i.cod_referencia,
        i.des_unidade,
        i.num_fator_conversao,
        COALESCE(cp.val_preco_venda, 0) as val_preco_venda,
        COALESCE(cp.val_custo_medio, 0) as val_custo_medio,
        COALESCE(cp.val_custo_unitario, 0) as val_custo_unitario,
        COALESCE(cp.per_margem_desejada, 0) as per_margem_desejada
      FROM ${schema}.tab_item i
      LEFT JOIN ${schema}.tab_custo_preco cp 
        ON i.cod_item = cp.cod_item 
        AND cp.cod_empresa = $1
    `;

    const params = [cod_empresa];

    // Se houver termo de pesquisa, adiciona filtro
    if (termo && termo.trim()) {
      query += ` WHERE (
        i.des_item ILIKE $2 OR
        i.cod_barra LIKE $2 OR
        i.cod_referencia LIKE $2 OR
        CAST(i.cod_item AS TEXT) LIKE $2
      )`;
      params.push(`%${termo}%`);
    }

    query += ` ORDER BY i.des_item LIMIT ${limit} OFFSET ${offset}`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message:
        result.rows.length > 0 ? "Itens encontrados" : "Nenhum item encontrado",
      data: result.rows,
    });
  } catch (error) {
    console.error("Erro ao pesquisar itens:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao pesquisar itens",
    });
  }
});

// POST /api/itens/detalhes-multiplos - Busca detalhes de múltiplos itens de uma vez
app.post("/api/itens/detalhes-multiplos", async (req, res) => {
  try {
    const { schema, cod_empresa, cod_itens } = req.body;

    if (!schema) {
      return res.status(400).json({
        success: false,
        message: "Schema não informado",
      });
    }

    if (!cod_empresa) {
      return res.status(400).json({
        success: false,
        message: "Código da empresa não informado",
      });
    }

    if (!cod_itens || !Array.isArray(cod_itens) || cod_itens.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Códigos de itens não informados",
      });
    }

    // Busca detalhes de múltiplos itens com preço, custos e margem desejada
    const query = `
      SELECT
        i.cod_item,
        COALESCE(cp.val_preco_venda, 0) as val_preco_venda,
        COALESCE(cp.val_custo_medio, 0) as val_custo_medio,
        COALESCE(cp.val_custo_unitario, 0) as val_custo_unitario,
        COALESCE(cp.per_margem_desejada, 0) as per_margem_desejada
      FROM ${schema}.tab_item i
      LEFT JOIN ${schema}.tab_custo_preco cp
        ON i.cod_item = cp.cod_item
        AND cp.cod_empresa = $1
      WHERE i.cod_item = ANY($2::int[])
    `;

    const result = await pool.query(query, [cod_empresa, cod_itens]);

    // Cria um mapa de cod_item -> detalhes para fácil acesso
    const detalhesMap = {};
    result.rows.forEach((row) => {
      detalhesMap[row.cod_item] = {
        val_preco_venda: parseFloat(row.val_preco_venda) || 0,
        val_custo_medio: parseFloat(row.val_custo_medio) || 0,
        val_custo_unitario: parseFloat(row.val_custo_unitario) || 0,
        per_margem_desejada: parseFloat(row.per_margem_desejada) || 0,
      };
    });

    res.json({
      success: true,
      message: "Detalhes dos itens encontrados",
      data: detalhesMap,
    });
  } catch (error) {
    console.error("Erro ao buscar detalhes dos itens:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar detalhes dos itens",
    });
  }
});

// ===============================================
// ROTAS DE PARÂMETROS
// ===============================================

// GET /api/parametros/preco
app.get("/api/parametros/preco", async (req, res) => {
  try {
    const { schema } = req.query;

    if (!schema) {
      return res.status(400).json({
        success: false,
        message: "Schema não informado",
      });
    }

    // Busca parâmetros 3 (permite alterar preço), 4 (tipo de custo) e 7 (bloquear margem baixa)
    const query = `
      SELECT cod_parametro, val_parametro
      FROM ${schema}.tab_parametro
      WHERE cod_parametro IN (3, 4, 7)
    `;

    const result = await pool.query(query);

    const parametros = {
      permite_alterar_preco: "N",
      tipo_custo: "M", // Default: Médio
      bloquear_margem_baixa: "S", // Default: Bloquear (comportamento padrão)
    };

    result.rows.forEach((row) => {
      if (row.cod_parametro === 3) {
        parametros.permite_alterar_preco = row.val_parametro || "N";
      } else if (row.cod_parametro === 4) {
        parametros.tipo_custo = row.val_parametro || "M";
      } else if (row.cod_parametro === 7) {
        parametros.bloquear_margem_baixa = row.val_parametro || "S";
      }
    });

    res.json({
      success: true,
      message: "Parâmetros encontrados",
      data: parametros,
    });
  } catch (error) {
    console.error("Erro ao buscar parâmetros de preço:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar parâmetros de preço",
      error: error.message,
    });
  }
});

// GET /api/parametros/itens-iniciais
app.get("/api/parametros/itens-iniciais", async (req, res) => {
  try {
    const { schema } = req.query;

    if (!schema) {
      return res.status(400).json({
        success: false,
        message: "Schema não informado",
      });
    }

    // Busca parâmetro 8 (quantidade de itens iniciais)
    const query = `
      SELECT val_parametro
      FROM ${schema}.tab_parametro
      WHERE cod_parametro = 8
    `;

    const result = await pool.query(query);

    let quantidadeItens = null;
    if (result.rows.length > 0 && result.rows[0].val_parametro) {
      quantidadeItens = parseInt(result.rows[0].val_parametro, 10);
    }

    res.json({
      success: true,
      message: quantidadeItens
        ? `Parâmetro encontrado: ${quantidadeItens} itens`
        : "Parâmetro não configurado",
      data: {
        quantidade_itens_iniciais: quantidadeItens,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar parâmetro de itens iniciais:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar parâmetro de itens iniciais",
      error: error.message,
    });
  }
});

// ===============================================
// ROTAS DE TIPOS DE COBRANÇA
// ===============================================

// GET /api/tipos-cobranca/listar
app.get("/api/tipos-cobranca/listar", async (req, res) => {
  try {
    const { schema } = req.query;

    if (!schema) {
      return res.status(400).json({
        success: false,
        message: "Schema não informado",
      });
    }

    const query = `
      SELECT cod_tipo_cobranca, des_tipo_cobranca
      FROM ${schema}.tab_tipo_cobranca
      ORDER BY des_tipo_cobranca
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      message:
        result.rows.length > 0
          ? "Tipos de cobrança encontrados"
          : "Nenhum tipo de cobrança encontrado",
      data: result.rows,
    });
  } catch (error) {
    console.error("Erro ao listar tipos de cobrança:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao listar tipos de cobrança",
      error: error.message,
    });
  }
});

// GET /api/parametros/tipo-cobranca-padrao
app.get("/api/parametros/tipo-cobranca-padrao", async (req, res) => {
  try {
    const { schema } = req.query;

    if (!schema) {
      return res.status(400).json({
        success: false,
        message: "Schema não informado",
      });
    }

    // Busca parâmetro 9 (tipo de cobrança padrão)
    const query = `
      SELECT val_parametro
      FROM ${schema}.tab_parametro
      WHERE cod_parametro = 9
    `;

    const result = await pool.query(query);

    let codTipoCobranca = null;
    if (result.rows.length > 0 && result.rows[0].val_parametro) {
      codTipoCobranca = parseInt(result.rows[0].val_parametro, 10);
    }

    res.json({
      success: true,
      message: codTipoCobranca
        ? `Tipo de cobrança padrão: ${codTipoCobranca}`
        : "Tipo de cobrança padrão não configurado",
      data: {
        cod_tipo_cobranca_padrao: codTipoCobranca,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar tipo de cobrança padrão:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar tipo de cobrança padrão",
      error: error.message,
    });
  }
});

// ===============================================
// ROTAS DE CONDIÇÕES DE PAGAMENTO
// ===============================================

// GET /api/condicoes-pagamento
app.get("/api/condicoes-pagamento", async (req, res) => {
  try {
    const { schema, termo } = req.query;

    if (!schema) {
      return res.status(400).json({
        success: false,
        message: "Schema não informado",
      });
    }

    // Busca condições de pagamento no schema específico
    let query = `
      SELECT
        cod_condicao_pagamento,
        des_condicao_pagamento,
        ind_tipo_condicao
      FROM ${schema}.tab_condicao_pagamento
    `;

    const params = [];

    // Se houver termo de pesquisa, adiciona filtro
    if (termo && termo.trim()) {
      query += ` WHERE (
        des_condicao_pagamento ILIKE $1 OR
        CAST(cod_condicao_pagamento AS TEXT) LIKE $1
      )`;
      params.push(`%${termo}%`);
    }

    query += ` ORDER BY des_condicao_pagamento`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message:
        result.rows.length > 0
          ? `${result.rows.length} condição(ões) encontrada(s)`
          : "Nenhuma condição de pagamento encontrada",
      data: result.rows,
    });
  } catch (error) {
    console.error("Erro ao buscar condições de pagamento:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar condições de pagamento",
      error: error.message,
    });
  }
});

// POST /api/condicoes-pagamento/calcular-parcelas
// Endpoint para calcular parcelas de uma condição automática (preview)
app.post("/api/condicoes-pagamento/calcular-parcelas", async (req, res) => {
  try {
    const { schema, cod_condicao_pagamento, valor_total, data_referencia } =
      req.body;

    if (!schema || !cod_condicao_pagamento || !valor_total) {
      return res.status(400).json({
        success: false,
        message: "Schema, condição de pagamento e valor total são obrigatórios",
      });
    }

    // Verifica se a condição é automática
    const tipoCondicaoQuery = `
      SELECT ind_tipo_condicao
      FROM ${schema}.tab_condicao_pagamento
      WHERE cod_condicao_pagamento = $1
    `;
    const tipoCondicaoResult = await pool.query(tipoCondicaoQuery, [
      cod_condicao_pagamento,
    ]);

    if (tipoCondicaoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Condição de pagamento não encontrada",
      });
    }

    const isAutomatica = tipoCondicaoResult.rows[0].ind_tipo_condicao === "A";

    if (!isAutomatica) {
      return res.status(400).json({
        success: false,
        message: "Esta condição de pagamento não é automática",
      });
    }

    // Busca os fluxos da condição de pagamento
    const fluxosQuery = `
      SELECT
        seq_fluxo,
        per_val_total,
        qtd_parcelas,
        qtd_dias_intervalo,
        qtd_dias_carencia,
        cod_tipo_referencia
      FROM ${schema}.tab_fluxo_condicao_pagamento
      WHERE cod_condicao_pagamento = $1
      ORDER BY seq_fluxo
    `;
    const fluxosResult = await pool.query(fluxosQuery, [
      cod_condicao_pagamento,
    ]);

    if (fluxosResult.rows.length === 0) {
      return res.json({
        success: true,
        message: "Condição automática sem fluxos configurados",
        data: [],
      });
    }

    // Converte data de referência DD/MM/YYYY para Date
    const converterData = (dataStr) => {
      if (!dataStr) return new Date();
      const [dia, mes, ano] = dataStr.split("/");
      return new Date(ano, mes - 1, dia);
    };

    const dataRef = data_referencia
      ? converterData(data_referencia)
      : new Date();
    const parcelas = [];
    let numParcela = 1;

    // Calcula parcelas para cada fluxo
    for (const fluxo of fluxosResult.rows) {
      const valorFluxo = (valor_total * fluxo.per_val_total) / 100;
      const valorParcela = valorFluxo / fluxo.qtd_parcelas;

      for (let i = 0; i < fluxo.qtd_parcelas; i++) {
        // Calcula data de vencimento
        const diasAdicionar =
          fluxo.qtd_dias_carencia + i * fluxo.qtd_dias_intervalo;
        const dataVencimento = new Date(dataRef);
        dataVencimento.setDate(dataVencimento.getDate() + diasAdicionar);

        const day = String(dataVencimento.getDate()).padStart(2, "0");
        const month = String(dataVencimento.getMonth() + 1).padStart(2, "0");
        const year = dataVencimento.getFullYear();

        parcelas.push({
          numero: numParcela,
          dataVencimento: `${day}/${month}/${year}`,
          valor: valorParcela,
        });

        numParcela++;
      }
    }

    res.json({
      success: true,
      message: `${parcelas.length} parcela(s) calculada(s)`,
      data: parcelas,
    });
  } catch (error) {
    console.error("Erro ao calcular parcelas:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao calcular parcelas",
      error: error.message,
    });
  }
});

// GET /api/condicoes-pagamento/ultima-do-cliente
// Busca a última condição de pagamento usada pelo cliente (se parâmetro 5 = 'S')
app.get("/api/condicoes-pagamento/ultima-do-cliente", async (req, res) => {
  try {
    const { schema, cod_cliente } = req.query;

    if (!schema) {
      return res.status(400).json({
        success: false,
        message: "Schema não informado",
      });
    }

    if (!cod_cliente) {
      return res.status(400).json({
        success: false,
        message: "Código do cliente não informado",
      });
    }

    // 1. Verifica o parâmetro 5 (repetir condição de pagamento)
    const parametroQuery = `
      SELECT val_parametro
      FROM ${schema}.tab_parametro
      WHERE cod_parametro = 5
    `;
    const parametroResult = await pool.query(parametroQuery);

    // Se parâmetro não existe ou não é 'S', retorna sem condição
    if (
      parametroResult.rows.length === 0 ||
      parametroResult.rows[0].val_parametro !== "S"
    ) {
      return res.json({
        success: true,
        message: "Parâmetro de repetir condição de pagamento está desativado",
        data: null,
      });
    }

    // 2. Busca a última nota fiscal do cliente com condição de pagamento
    const notaFiscalQuery = `
      SELECT
        nf.cod_condicao_pagamento,
        cp.des_condicao_pagamento,
        cp.ind_tipo_condicao
      FROM ${schema}.tab_nota_fiscal nf
      INNER JOIN ${schema}.tab_condicao_pagamento cp
        ON nf.cod_condicao_pagamento = cp.cod_condicao_pagamento
      WHERE nf.cod_cliente = $1
        AND nf.cod_condicao_pagamento IS NOT NULL
      ORDER BY nf.dta_emissao DESC
      LIMIT 1
    `;
    const notaFiscalResult = await pool.query(notaFiscalQuery, [
      parseInt(cod_cliente),
    ]);

    if (notaFiscalResult.rows.length === 0) {
      return res.json({
        success: true,
        message: "Cliente não possui vendas anteriores",
        data: null,
      });
    }

    const condicao = notaFiscalResult.rows[0];

    res.json({
      success: true,
      message: "Condição de pagamento encontrada",
      data: {
        cod_condicao_pagamento: condicao.cod_condicao_pagamento,
        des_condicao_pagamento: condicao.des_condicao_pagamento,
        ind_tipo_condicao: condicao.ind_tipo_condicao,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar última condição de pagamento:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar última condição de pagamento do cliente",
    });
  }
});

// ===============================================
// ROTAS DE PEDIDOS
// ===============================================

// POST /api/pedidos/listar
app.post("/api/pedidos/listar", async (req, res) => {
  try {
    const {
      schema,
      cod_empresa,
      cod_cliente,
      data_inicio,
      data_fim,
      usuario,
      apenas_pendentes,
    } = req.body;

    if (!schema || !cod_empresa) {
      return res.status(400).json({
        success: false,
        message: "Schema e código da empresa são obrigatórios",
      });
    }

    // Função auxiliar para converter data DD/MM/YYYY para YYYY-MM-DD
    const converterData = (dataStr) => {
      if (!dataStr) return null;
      const [dia, mes, ano] = dataStr.split("/");
      return `${ano}-${mes}-${dia}`;
    };

    // 1. Busca o parâmetro cod_parametro = 1 (filtro por vendedor)
    const parametroQuery = `
      SELECT val_parametro 
      FROM ${schema}.tab_parametro 
      WHERE cod_parametro = 1
      LIMIT 1
    `;
    const parametroResult = await pool.query(parametroQuery);
    const filtrarPorVendedor =
      parametroResult.rows.length > 0 &&
      parametroResult.rows[0].val_parametro === "S";

    let codVendedor = null;

    // 2. Se filtro ativo e usuário informado, busca cod_vendedor do usuário
    if (filtrarPorVendedor && usuario) {
      const usuarioQuery = `
        SELECT cod_vendedor 
        FROM ${schema}.tab_usuario 
        WHERE nom_operador = $1 AND ind_ativo = 'S'
        LIMIT 1
      `;
      const usuarioResult = await pool.query(usuarioQuery, [usuario]);

      if (usuarioResult.rows.length > 0) {
        codVendedor = usuarioResult.rows[0].cod_vendedor;
      }
    }

    // Monta a query base
    let query = `
      SELECT
        p.seq_pedido,
        p.cod_cliente,
        pe.nom_pessoa as cliente,
        TO_CHAR(p.dat_pedido, 'DD/MM/YYYY') as dat_pedido,
        TO_CHAR(p.dat_entrega, 'DD/MM/YYYY') as dat_entrega,
        p.val_total,
        COUNT(i.num_item) as qtd_itens,
        cp.des_condicao_pagamento as condicao_pagamento,
        COALESCE(p.ind_sincronizado, 'N') as ind_sincronizado
      FROM ${schema}.tab_pedido_app p
      LEFT JOIN ${schema}.tab_pessoa pe ON p.cod_cliente = pe.cod_pessoa
      LEFT JOIN ${schema}.tab_item_pedido_app i ON p.seq_pedido = i.seq_pedido
      LEFT JOIN ${schema}.tab_condicao_pagamento cp ON p.cod_condicao_pagamento = cp.cod_condicao_pagamento
      WHERE p.cod_empresa = $1
    `;

    const params = [cod_empresa];
    let paramIndex = 2;

    // Filtro por vendedor (se ativo e cod_vendedor encontrado)
    if (filtrarPorVendedor && codVendedor) {
      query += ` AND p.cod_vendedor = $${paramIndex}`;
      params.push(codVendedor);
      paramIndex++;
    }

    // Filtro por cliente
    if (cod_cliente) {
      query += ` AND p.cod_cliente = $${paramIndex}`;
      params.push(cod_cliente);
      paramIndex++;
    }

    // Filtro por data início
    if (data_inicio) {
      query += ` AND p.dat_pedido >= $${paramIndex}`;
      params.push(converterData(data_inicio));
      paramIndex++;
    }

    // Filtro por data fim
    if (data_fim) {
      query += ` AND p.dat_pedido <= $${paramIndex}`;
      params.push(converterData(data_fim));
      paramIndex++;
    }

    // Filtro por pedidos pendentes (não sincronizados)
    if (apenas_pendentes === true) {
      query += ` AND COALESCE(p.ind_sincronizado, 'N') = 'N'`;
    }

    query += `
      GROUP BY
        p.seq_pedido,
        p.cod_cliente,
        pe.nom_pessoa,
        p.dat_pedido,
        p.dat_entrega,
        p.val_total,
        cp.des_condicao_pagamento,
        p.ind_sincronizado
      ORDER BY p.seq_pedido DESC
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: `${result.rows.length} pedido(s) encontrado(s)`,
      data: result.rows,
    });
  } catch (error) {
    console.error("Erro ao listar pedidos:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao listar pedidos",
      error: error.message,
    });
  }
});

// POST /api/pedidos/criar
app.post("/api/pedidos/criar", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      schema,
      cod_empresa,
      usuario,
      cliente,
      seq_endereco,
      cod_tipo_cobranca,
      dataEntrega,
      itens,
      subtotal,
      desconto,
      acrescimo,
      frete,
      total,
      observacao,
      condicaoPagamento,
      parcelas,
    } = req.body;

    // Validações básicas
    if (
      !schema ||
      !cod_empresa ||
      !usuario ||
      !cliente ||
      !itens ||
      itens.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Dados incompletos para criar o pedido",
      });
    }

    console.log("=== CRIAR PEDIDO ===");
    console.log("Schema:", schema);
    console.log("Empresa:", cod_empresa);
    console.log("Cliente:", cliente.cod_pessoa);
    console.log("Data Entrega:", dataEntrega);
    console.log("Qtd Itens:", itens.length);
    console.log("Qtd Parcelas:", parcelas?.length || 0);

    // Função auxiliar para converter data DD/MM/YYYY para YYYY-MM-DD
    const converterData = (dataStr) => {
      if (!dataStr) return null;
      const [dia, mes, ano] = dataStr.split("/");
      return `${ano}-${mes}-${dia}`;
    };

    // Inicia transação
    await client.query("BEGIN");

    // 1. Busca o cod_vendedor do usuário
    const usuarioQuery = `
      SELECT cod_vendedor 
      FROM ${schema}.tab_usuario 
      WHERE nom_operador = $1 AND ind_ativo = 'S'
      LIMIT 1
    `;
    const usuarioResult = await client.query(usuarioQuery, [usuario]);
    const cod_vendedor =
      usuarioResult.rows.length > 0 ? usuarioResult.rows[0].cod_vendedor : null;

    // 2. Gera o próximo seq_pedido
    const seqQuery = `
      SELECT COALESCE(MAX(seq_pedido), 0) + 1 as next_seq
      FROM ${schema}.tab_pedido_app
    `;
    const seqResult = await client.query(seqQuery);
    const seq_pedido = seqResult.rows[0].next_seq;

    // 2. Insere o pedido principal
    const insertPedidoQuery = `
      INSERT INTO ${schema}.tab_pedido_app (
        seq_pedido,
        cod_empresa,
        cod_cliente,
        cod_vendedor,
        seq_endereco,
        cod_tipo_cobranca,
        dat_pedido,
        dat_entrega,
        val_subtotal,
        val_desconto,
        val_acrescimo,
        val_frete,
        val_total,
        des_observacao,
        cod_condicao_pagamento,
        nom_usuario,
        ind_sincronizado
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'N')
    `;

    await client.query(insertPedidoQuery, [
      seq_pedido,
      cod_empresa,
      cliente.cod_pessoa,
      cod_vendedor,
      seq_endereco || null,
      cod_tipo_cobranca || null,
      converterData(dataEntrega),
      subtotal,
      desconto,
      acrescimo,
      frete,
      total,
      observacao || "",
      condicaoPagamento?.cod_condicao_pagamento || null,
      usuario,
    ]);

    // 3. Insere os itens do pedido
    for (let i = 0; i < itens.length; i++) {
      const item = itens[i];
      const insertItemQuery = `
        INSERT INTO ${schema}.tab_item_pedido_app (
          seq_pedido,
          num_item,
          cod_item,
          des_item,
          qtd_item,
          val_unitario,
          val_total,
          des_unidade
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      await client.query(insertItemQuery, [
        seq_pedido,
        i + 1, // num_item começa em 1
        item.cod_item,
        item.des_item,
        item.quantidade,
        item.val_preco_venda,
        item.val_total,
        item.des_unidade || "",
      ]);
    }

    // 4. Insere as parcelas de pagamento
    if (condicaoPagamento?.cod_condicao_pagamento) {
      // Verifica se a condição de pagamento é automática (ind_tipo_condicao = 'A')
      const tipoCondicaoQuery = `
        SELECT ind_tipo_condicao
        FROM ${schema}.tab_condicao_pagamento
        WHERE cod_condicao_pagamento = $1
      `;
      const tipoCondicaoResult = await client.query(tipoCondicaoQuery, [
        condicaoPagamento.cod_condicao_pagamento,
      ]);

      const isAutomatica =
        tipoCondicaoResult.rows.length > 0 &&
        tipoCondicaoResult.rows[0].ind_tipo_condicao === "A";

      if (isAutomatica) {
        console.log(
          "Calculando parcelas automaticamente (ind_tipo_condicao = A)...",
        );

        // Busca os fluxos da condição de pagamento
        const fluxosQuery = `
          SELECT 
            seq_fluxo,
            per_val_total,
            qtd_parcelas,
            qtd_dias_intervalo,
            qtd_dias_carencia,
            cod_tipo_referencia
          FROM ${schema}.tab_fluxo_condicao_pagamento
          WHERE cod_condicao_pagamento = $1
          ORDER BY seq_fluxo
        `;
        const fluxosResult = await client.query(fluxosQuery, [
          condicaoPagamento.cod_condicao_pagamento,
        ]);

        if (fluxosResult.rows.length > 0) {
          // Data de referência para cálculo (data atual / data do pedido)
          const dataReferencia = new Date();
          let numParcela = 1;

          for (const fluxo of fluxosResult.rows) {
            const valorFluxo = (total * fluxo.per_val_total) / 100;
            const valorParcela = valorFluxo / fluxo.qtd_parcelas;

            for (let i = 0; i < fluxo.qtd_parcelas; i++) {
              // Calcula data de vencimento
              const diasAdicionar =
                fluxo.qtd_dias_carencia + i * fluxo.qtd_dias_intervalo;
              const dataVencimento = new Date(dataReferencia);
              dataVencimento.setDate(dataVencimento.getDate() + diasAdicionar);

              const insertParcelaQuery = `
                INSERT INTO ${schema}.tab_pagamento_pedido_app (
                  seq_pedido,
                  num_parcela,
                  dat_vencimento,
                  val_parcela
                ) VALUES ($1, $2, $3, $4)
              `;

              const dataVencimentoFormatada = dataVencimento
                .toISOString()
                .split("T")[0];

              console.log(
                `💾 Salvando Parcela ${numParcela}:`,
                `Data: ${dataVencimentoFormatada}`,
                `Valor: R$ ${valorParcela.toFixed(2)}`,
              );

              await client.query(insertParcelaQuery, [
                seq_pedido,
                numParcela,
                dataVencimentoFormatada,
                valorParcela,
              ]);

              numParcela++;
            }
          }
        } else {
          console.log(
            "Condição de pagamento automática sem fluxos configurados",
          );
        }
      } else {
        // Modo manual: usa as parcelas enviadas pelo frontend
        console.log("Usando parcelas manuais (ind_tipo_condicao <> A)");
        if (parcelas && parcelas.length > 0) {
          for (const parcela of parcelas) {
            const dataVenc = parcela.dataVencimento || parcela.datavencimento;

            if (!dataVenc) {
              throw new Error(
                `Parcela ${parcela.numero} sem data de vencimento`,
              );
            }

            const insertParcelaQuery = `
              INSERT INTO ${schema}.tab_pagamento_pedido_app (
                seq_pedido,
                num_parcela,
                dat_vencimento,
                val_parcela
              ) VALUES ($1, $2, $3, $4)
            `;

            await client.query(insertParcelaQuery, [
              seq_pedido,
              parcela.numero,
              converterData(dataVenc),
              parcela.valor,
            ]);
          }
        }
      }
    } else if (parcelas && parcelas.length > 0) {
      // Sem condição de pagamento: usa parcelas manuais
      console.log("Salvando parcelas manuais (sem condição de pagamento)");
      for (const parcela of parcelas) {
        const dataVenc = parcela.dataVencimento || parcela.datavencimento;

        if (!dataVenc) {
          throw new Error(`Parcela ${parcela.numero} sem data de vencimento`);
        }

        const insertParcelaQuery = `
          INSERT INTO ${schema}.tab_pagamento_pedido_app (
            seq_pedido,
            num_parcela,
            dat_vencimento,
            val_parcela
          ) VALUES ($1, $2, $3, $4)
        `;

        await client.query(insertParcelaQuery, [
          seq_pedido,
          parcela.numero,
          converterData(dataVenc),
          parcela.valor,
        ]);
      }
    }

    // Commit da transação
    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Pedido criado com sucesso",
      data: {
        seq_pedido: seq_pedido,
      },
    });
  } catch (error) {
    // Rollback em caso de erro
    await client.query("ROLLBACK");
    console.error("Erro ao criar pedido:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar pedido",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// POST /api/pedidos/detalhes
app.post("/api/pedidos/detalhes", async (req, res) => {
  try {
    const { schema, seq_pedido } = req.body;

    if (!schema || !seq_pedido) {
      return res.status(400).json({
        success: false,
        message: "Schema e sequencial do pedido são obrigatórios",
      });
    }

    // Buscar dados do pedido
    const pedidoQuery = `
      SELECT
        p.seq_pedido,
        p.cod_cliente,
        pe.nom_pessoa as cliente,
        pe.num_cnpj_cpf as num_cnpj,
        TO_CHAR(p.dat_pedido, 'DD/MM/YYYY') as dat_pedido,
        TO_CHAR(p.dat_entrega, 'DD/MM/YYYY') as dat_entrega,
        COALESCE(p.des_observacao, '') as des_observacao,
        p.val_subtotal,
        p.val_desconto,
        p.val_acrescimo,
        p.val_frete,
        p.val_total,
        p.cod_condicao_pagamento,
        cp.des_condicao_pagamento,
        cp.ind_tipo_condicao,
        p.seq_endereco,
        p.cod_tipo_cobranca,
        COALESCE(p.ind_sincronizado, 'N') as ind_sincronizado
      FROM ${schema}.tab_pedido_app p
      LEFT JOIN ${schema}.tab_pessoa pe ON p.cod_cliente = pe.cod_pessoa
      LEFT JOIN ${schema}.tab_condicao_pagamento cp ON p.cod_condicao_pagamento = cp.cod_condicao_pagamento
      WHERE p.seq_pedido = $1
    `;

    const pedidoResult = await pool.query(pedidoQuery, [seq_pedido]);

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pedido não encontrado",
      });
    }

    const pedido = pedidoResult.rows[0];

    // Buscar itens do pedido com informações de custo
    const itensQuery = `
      SELECT
        i.cod_item,
        i.des_item,
        i.qtd_item as quantidade,
        i.val_unitario,
        i.val_total,
        i.des_unidade,
        COALESCE(cp.val_custo_medio, 0) as val_custo_medio,
        COALESCE(cp.val_custo_unitario, 0) as val_custo_unitario,
        COALESCE(cp.per_margem_desejada, 0) as per_margem_desejada
      FROM ${schema}.tab_item_pedido_app i
      LEFT JOIN ${schema}.tab_item item ON i.cod_item = item.cod_item
      LEFT JOIN ${schema}.tab_custo_preco cp 
        ON i.cod_item = cp.cod_item 
        AND cp.cod_empresa = (SELECT cod_empresa FROM ${schema}.tab_pedido_app WHERE seq_pedido = $1)
      WHERE i.seq_pedido = $1
      ORDER BY i.num_item
    `;

    const itensResult = await pool.query(itensQuery, [seq_pedido]);

    // Buscar parcelas do pedido
    const parcelasQuery = `
      SELECT
        num_parcela as numero,
        dat_vencimento,
        TO_CHAR(dat_vencimento, 'DD/MM/YYYY') as "dataVencimento",
        val_parcela as valor
      FROM ${schema}.tab_pagamento_pedido_app
      WHERE seq_pedido = $1
      ORDER BY num_parcela
    `;

    console.log(
      `🔍 Buscando parcelas - Schema: ${schema}, Pedido: ${seq_pedido}`,
    );
    const parcelasResult = await pool.query(parcelasQuery, [seq_pedido]);

    // Log para debug
    console.log(
      `📋 Parcelas encontradas (${parcelasResult.rows.length}):`,
      JSON.stringify(parcelasResult.rows, null, 2),
    );

    // Montar resposta
    const pedidoDetalhado = {
      ...pedido,
      itens: itensResult.rows,
      parcelas: parcelasResult.rows,
    };

    res.json({
      success: true,
      message: "Pedido encontrado",
      data: pedidoDetalhado,
    });
  } catch (error) {
    console.error("Erro ao obter detalhes do pedido:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao obter detalhes do pedido",
      error: error.message,
    });
  }
});

// POST /api/pedidos/excluir
app.post("/api/pedidos/excluir", async (req, res) => {
  const client = await pool.connect();

  try {
    const { schema, seq_pedido } = req.body;

    if (!schema || !seq_pedido) {
      return res.status(400).json({
        success: false,
        message: "Schema e sequencial do pedido são obrigatórios",
      });
    }

    await client.query("BEGIN");

    // Verificar se pedido existe
    const checkQuery = `
      SELECT seq_pedido FROM ${schema}.tab_pedido_app WHERE seq_pedido = $1
    `;
    const checkResult = await client.query(checkQuery, [seq_pedido]);

    if (checkResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Pedido não encontrado",
      });
    }

    // Excluir pagamentos do pedido
    const deletePagamentosQuery = `
      DELETE FROM ${schema}.tab_pagamento_pedido_app WHERE seq_pedido = $1
    `;
    await client.query(deletePagamentosQuery, [seq_pedido]);

    // Excluir itens do pedido
    const deleteItensQuery = `
      DELETE FROM ${schema}.tab_item_pedido_app WHERE seq_pedido = $1
    `;
    await client.query(deleteItensQuery, [seq_pedido]);

    // Excluir pedido
    const deletePedidoQuery = `
      DELETE FROM ${schema}.tab_pedido_app WHERE seq_pedido = $1
    `;
    await client.query(deletePedidoQuery, [seq_pedido]);

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Pedido excluído com sucesso",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao excluir pedido:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao excluir pedido",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// POST /api/pedidos/atualizar
app.post("/api/pedidos/atualizar", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      seq_pedido,
      schema,
      cod_empresa,
      usuario,
      cliente,
      seq_endereco,
      cod_tipo_cobranca,
      dataEntrega,
      itens,
      subtotal,
      desconto,
      acrescimo,
      frete,
      total,
      observacao,
      condicaoPagamento,
      parcelas,
    } = req.body;

    // Validações
    if (
      !seq_pedido ||
      !schema ||
      !cod_empresa ||
      !cliente ||
      !dataEntrega ||
      !itens ||
      itens.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Dados incompletos para atualizar o pedido",
      });
    }

    await client.query("BEGIN");

    // Função auxiliar para converter data DD/MM/YYYY para YYYY-MM-DD
    const converterData = (dataStr) => {
      if (!dataStr) return null;
      const [dia, mes, ano] = dataStr.split("/");
      return `${ano}-${mes}-${dia}`;
    };

    // Busca o cod_vendedor do usuário
    const usuarioQuery = `
      SELECT cod_vendedor 
      FROM ${schema}.tab_usuario 
      WHERE nom_operador = $1 AND ind_ativo = 'S'
      LIMIT 1
    `;
    const usuarioResult = await client.query(usuarioQuery, [usuario]);
    const cod_vendedor =
      usuarioResult.rows.length > 0 ? usuarioResult.rows[0].cod_vendedor : null;

    // Verificar se pedido existe
    const checkQuery = `
      SELECT seq_pedido FROM ${schema}.tab_pedido_app WHERE seq_pedido = $1
    `;
    const checkResult = await client.query(checkQuery, [seq_pedido]);

    if (checkResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Pedido não encontrado",
      });
    }

    // 1. Atualiza o pedido
    const updatePedidoQuery = `
      UPDATE ${schema}.tab_pedido_app SET
        cod_cliente = $1,
        cod_vendedor = $2,
        seq_endereco = $3,
        cod_tipo_cobranca = $4,
        dat_entrega = $5,
        val_subtotal = $6,
        val_desconto = $7,
        val_acrescimo = $8,
        val_frete = $9,
        val_total = $10,
        des_observacao = $11,
        cod_condicao_pagamento = $12,
        usuario_alteracao = $13,
        dat_alteracao = CURRENT_TIMESTAMP,
        ind_sincronizado = 'N'
      WHERE seq_pedido = $14
    `;

    await client.query(updatePedidoQuery, [
      cliente.cod_pessoa,
      cod_vendedor,
      seq_endereco || null,
      cod_tipo_cobranca || null,
      converterData(dataEntrega),
      subtotal,
      desconto,
      acrescimo,
      frete,
      total,
      observacao || "",
      condicaoPagamento?.cod_condicao_pagamento || null,
      usuario,
      seq_pedido,
    ]);

    // 2. Exclui itens antigos
    const deleteItensQuery = `
      DELETE FROM ${schema}.tab_item_pedido_app WHERE seq_pedido = $1
    `;
    await client.query(deleteItensQuery, [seq_pedido]);

    // 3. Insere os novos itens
    for (let i = 0; i < itens.length; i++) {
      const item = itens[i];
      const insertItemQuery = `
        INSERT INTO ${schema}.tab_item_pedido_app (
          seq_pedido,
          num_item,
          cod_item,
          des_item,
          qtd_item,
          val_unitario,
          val_total,
          des_unidade
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      await client.query(insertItemQuery, [
        seq_pedido,
        i + 1,
        item.cod_item,
        item.des_item,
        item.quantidade,
        item.val_preco_venda,
        item.val_total,
        item.des_unidade || "",
      ]);
    }

    // 4. Exclui parcelas antigas
    const deleteParcelasQuery = `
      DELETE FROM ${schema}.tab_pagamento_pedido_app WHERE seq_pedido = $1
    `;
    await client.query(deleteParcelasQuery, [seq_pedido]);

    // 5. Insere as novas parcelas
    if (condicaoPagamento?.cod_condicao_pagamento) {
      // Verifica se a condição de pagamento é automática (ind_tipo_condicao = 'A')
      const tipoCondicaoQuery = `
        SELECT ind_tipo_condicao
        FROM ${schema}.tab_condicao_pagamento
        WHERE cod_condicao_pagamento = $1
      `;
      const tipoCondicaoResult = await client.query(tipoCondicaoQuery, [
        condicaoPagamento.cod_condicao_pagamento,
      ]);

      const isAutomatica =
        tipoCondicaoResult.rows.length > 0 &&
        tipoCondicaoResult.rows[0].ind_tipo_condicao === "A";

      if (isAutomatica) {
        console.log(
          "Calculando parcelas automaticamente (ind_tipo_condicao = A)...",
        );

        // Busca os fluxos da condição de pagamento
        const fluxosQuery = `
          SELECT 
            seq_fluxo,
            per_val_total,
            qtd_parcelas,
            qtd_dias_intervalo,
            qtd_dias_carencia,
            cod_tipo_referencia
          FROM ${schema}.tab_fluxo_condicao_pagamento
          WHERE cod_condicao_pagamento = $1
          ORDER BY seq_fluxo
        `;
        const fluxosResult = await client.query(fluxosQuery, [
          condicaoPagamento.cod_condicao_pagamento,
        ]);

        if (fluxosResult.rows.length > 0) {
          // Data de referência para cálculo (data atual / data do pedido)
          const dataReferencia = new Date();
          let numParcela = 1;

          for (const fluxo of fluxosResult.rows) {
            const valorFluxo = (total * fluxo.per_val_total) / 100;
            const valorParcela = valorFluxo / fluxo.qtd_parcelas;

            for (let i = 0; i < fluxo.qtd_parcelas; i++) {
              // Calcula data de vencimento
              const diasAdicionar =
                fluxo.qtd_dias_carencia + i * fluxo.qtd_dias_intervalo;
              const dataVencimento = new Date(dataReferencia);
              dataVencimento.setDate(dataVencimento.getDate() + diasAdicionar);

              const insertParcelaQuery = `
                INSERT INTO ${schema}.tab_pagamento_pedido_app (
                  seq_pedido,
                  num_parcela,
                  dat_vencimento,
                  val_parcela
                ) VALUES ($1, $2, $3, $4)
              `;

              const dataVencimentoFormatada = dataVencimento
                .toISOString()
                .split("T")[0];

              console.log(
                `💾 Salvando Parcela ${numParcela}:`,
                `Data: ${dataVencimentoFormatada}`,
                `Valor: R$ ${valorParcela.toFixed(2)}`,
              );

              await client.query(insertParcelaQuery, [
                seq_pedido,
                numParcela,
                dataVencimentoFormatada,
                valorParcela,
              ]);

              numParcela++;
            }
          }
        } else {
          console.log(
            "Condição de pagamento automática sem fluxos configurados",
          );
        }
      } else {
        // Modo manual: usa as parcelas enviadas pelo frontend
        console.log("Usando parcelas manuais (ind_tipo_condicao <> A)");
        if (parcelas && parcelas.length > 0) {
          for (const parcela of parcelas) {
            const dataVenc = parcela.dataVencimento || parcela.datavencimento;

            if (!dataVenc) {
              throw new Error(
                `Parcela ${parcela.numero} sem data de vencimento`,
              );
            }

            const insertParcelaQuery = `
              INSERT INTO ${schema}.tab_pagamento_pedido_app (
                seq_pedido,
                num_parcela,
                dat_vencimento,
                val_parcela
              ) VALUES ($1, $2, $3, $4)
            `;

            await client.query(insertParcelaQuery, [
              seq_pedido,
              parcela.numero,
              converterData(dataVenc),
              parcela.valor,
            ]);
          }
        }
      }
    } else if (parcelas && parcelas.length > 0) {
      // Sem condição de pagamento: usa parcelas manuais
      console.log("Salvando parcelas manuais (sem condição de pagamento)");
      for (const parcela of parcelas) {
        const dataVenc = parcela.dataVencimento || parcela.datavencimento;

        if (!dataVenc) {
          throw new Error(`Parcela ${parcela.numero} sem data de vencimento`);
        }

        const insertParcelaQuery = `
          INSERT INTO ${schema}.tab_pagamento_pedido_app (
            seq_pedido,
            num_parcela,
            dat_vencimento,
            val_parcela
          ) VALUES ($1, $2, $3, $4)
        `;

        await client.query(insertParcelaQuery, [
          seq_pedido,
          parcela.numero,
          converterData(dataVenc),
          parcela.valor,
        ]);
      }
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Pedido atualizado com sucesso",
      data: {
        seq_pedido: seq_pedido,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao atualizar pedido:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar pedido",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// PUT /api/pedidos/sincronizar
// Marca um pedido como sincronizado (ind_sincronizado = 'S')
app.put("/api/pedidos/sincronizar", async (req, res) => {
  try {
    const { schema, seq_pedido } = req.body;

    if (!schema || !seq_pedido) {
      return res.status(400).json({
        success: false,
        message: "Schema e seq_pedido são obrigatórios",
      });
    }

    // Atualiza o pedido para sincronizado
    const updateQuery = `
      UPDATE ${schema}.tab_pedido_app
      SET ind_sincronizado = 'S'
      WHERE seq_pedido = $1
    `;

    const result = await pool.query(updateQuery, [seq_pedido]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Pedido não encontrado",
      });
    }

    res.json({
      success: true,
      message: "Pedido sincronizado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao sincronizar pedido:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao sincronizar pedido",
      error: error.message,
    });
  }
});

// ===============================================
// ROTAS DE VENDAS (NOTAS FISCAIS)
// ===============================================

// POST /api/vendas/ultima
app.post("/api/vendas/ultima", async (req, res) => {
  try {
    const { schema, usuario, cod_cliente } = req.body;

    if (!schema || !usuario) {
      return res.status(400).json({
        success: false,
        message: "Schema e usuário são obrigatórios",
      });
    }

    console.log("=== BUSCAR ÚLTIMA VENDA ===");
    console.log("Schema:", schema);
    console.log("Usuário:", usuario);
    console.log("Cliente (opcional):", cod_cliente || "Não informado");

    // 1. Busca o parâmetro cod_parametro = 2 (filtro por vendedor em vendas)
    const parametroQuery = `
      SELECT val_parametro 
      FROM ${schema}.tab_parametro 
      WHERE cod_parametro = 2
      LIMIT 1
    `;
    const parametroResult = await pool.query(parametroQuery);
    const filtrarPorVendedor =
      parametroResult.rows.length > 0 &&
      parametroResult.rows[0].val_parametro === "S";

    console.log("Filtrar por vendedor?", filtrarPorVendedor);

    let codVendedor = null;

    // 2. Se filtro ativo, busca cod_vendedor do usuário
    if (filtrarPorVendedor) {
      const usuarioQuery = `
        SELECT cod_vendedor 
        FROM ${schema}.tab_usuario 
        WHERE nom_operador = $1 AND ind_ativo = 'S'
        LIMIT 1
      `;
      const usuarioResult = await pool.query(usuarioQuery, [usuario]);

      if (usuarioResult.rows.length > 0) {
        codVendedor = usuarioResult.rows[0].cod_vendedor;
        console.log("Código do vendedor:", codVendedor);
      } else {
        console.log("Vendedor não encontrado para o usuário");
        return res.json({
          success: true,
          message: "Nenhuma venda encontrada",
          data: null,
        });
      }
    }

    // 3. Busca a última nota fiscal
    let notaQuery = `
      SELECT
        nf.seq_nota,
        nf.num_nota,
        nf.cod_cliente,
        p.nom_pessoa as cliente,
        p.num_cnpj_cpf,
        nf.cod_vendedor,
        TO_CHAR(nf.dta_emissao, 'DD/MM/YYYY') as dta_emissao,
        nf.cod_condicao_pagamento,
        cp.des_condicao_pagamento
      FROM ${schema}.tab_nota_fiscal nf
      LEFT JOIN ${schema}.tab_pessoa p ON nf.cod_cliente = p.cod_pessoa
      LEFT JOIN ${schema}.tab_condicao_pagamento cp ON nf.cod_condicao_pagamento = cp.cod_condicao_pagamento
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Filtro por vendedor (se ativo e cod_vendedor encontrado)
    if (filtrarPorVendedor && codVendedor) {
      notaQuery += ` AND nf.cod_vendedor = $${paramIndex}`;
      params.push(codVendedor);
      paramIndex++;
      console.log(
        `✅ Aplicado filtro por vendedor: cod_vendedor = ${codVendedor}`,
      );
    } else {
      console.log("⚠️ Filtro por vendedor NÃO aplicado");
    }

    // Filtro por cliente (opcional)
    if (cod_cliente) {
      notaQuery += ` AND nf.cod_cliente = $${paramIndex}`;
      params.push(cod_cliente);
      paramIndex++;
      console.log(
        `✅ Aplicado filtro por cliente: cod_cliente = ${cod_cliente}`,
      );
    } else {
      console.log("⚠️ Filtro por cliente NÃO informado");
    }

    notaQuery += ` ORDER BY nf.dta_emissao DESC, nf.seq_nota DESC LIMIT 1`;

    console.log("📝 Query final:", notaQuery);
    console.log("📝 Parâmetros:", params);

    const notaResult = await pool.query(notaQuery, params);

    console.log(
      `🔍 Resultado da query: ${notaResult.rows.length} nota(s) encontrada(s)`,
    );

    if (notaResult.rows.length === 0) {
      console.log("❌ Nenhuma nota fiscal encontrada com os filtros aplicados");
      console.log("💡 Sugestão: Verifique se:");
      console.log(
        `   - Existe nota fiscal para o cliente ${cod_cliente || "qualquer"}`,
      );
      console.log(
        `   - O vendedor ${codVendedor || "N/A"} tem vendas para este cliente`,
      );
      console.log(`   - As notas estão na tabela ${schema}.tab_nota_fiscal`);

      return res.json({
        success: true,
        message: "Nenhuma venda encontrada",
        data: null,
      });
    }

    const nota = notaResult.rows[0];
    console.log("✅ Nota fiscal encontrada:", {
      seq_nota: nota.seq_nota,
      num_nota: nota.num_nota,
      cod_cliente: nota.cod_cliente,
      cliente: nota.cliente,
      cod_vendedor: nota.cod_vendedor,
      dta_emissao: nota.dta_emissao,
    });

    // 4. Busca os itens da nota fiscal
    const itensQuery = `
      SELECT
        seq_nota,
        seq_item_nota,
        cod_item,
        des_item,
        des_unidade,
        cod_almoxarifado,
        cod_natureza_operacao,
        qtd_item,
        val_unitario,
        val_total_item
      FROM ${schema}.tab_item_nfs
      WHERE seq_nota = $1
      ORDER BY seq_item_nota
    `;

    const itensResult = await pool.query(itensQuery, [nota.seq_nota]);

    console.log(
      `Itens com nomes encontrados:`,
      itensResult.rows.map((r) => ({
        cod_item: r.cod_item,
        des_item: r.des_item,
      })),
    );

    console.log(`Itens encontrados: ${itensResult.rows.length}`);

    // 5. Calcula o total da nota
    const totalNota = itensResult.rows.reduce(
      (acc, item) => acc + parseFloat(item.val_total_item || 0),
      0,
    );

    // 6. Monta a resposta
    const ultimaVenda = {
      seq_nota: nota.seq_nota,
      num_nota: nota.num_nota,
      cod_cliente: nota.cod_cliente,
      cliente: nota.cliente,
      num_cnpj_cpf: nota.num_cnpj_cpf,
      cod_vendedor: nota.cod_vendedor,
      dta_emissao: nota.dta_emissao,
      cod_condicao_pagamento: nota.cod_condicao_pagamento,
      des_condicao_pagamento: nota.des_condicao_pagamento,
      val_total: totalNota,
      qtd_itens: itensResult.rows.length,
      itens: itensResult.rows,
    };

    res.json({
      success: true,
      message: "Última venda encontrada",
      data: ultimaVenda,
    });
  } catch (error) {
    console.error("Erro ao buscar última venda:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar última venda",
      error: error.message,
    });
  }
});

// ===============================================
// ROTAS DE LOGO
// ===============================================

// POST /api/logo/verificar-permissao
app.post("/api/logo/verificar-permissao", async (req, res) => {
  try {
    const { schema, cod_usuario } = req.body;

    if (!schema || !cod_usuario) {
      return res.status(400).json({
        success: false,
        message: "Schema e código do usuário são obrigatórios",
      });
    }

    console.log("=== VERIFICAR PERMISSÃO LOGO ===");
    console.log("Schema:", schema);
    console.log("Usuário:", cod_usuario);

    // Busca o parâmetro 10 (usuários autorizados a alterar logo)
    const parametroQuery = `
      SELECT val_parametro
      FROM ${schema}.tab_parametro
      WHERE cod_parametro = 10
      LIMIT 1
    `;

    const parametroResult = await pool.query(parametroQuery);

    if (parametroResult.rows.length === 0) {
      console.log("Parâmetro 10 não configurado");
      return res.json({
        success: true,
        message: "Parâmetro de permissão não configurado",
        data: {
          tem_permissao: false,
        },
      });
    }

    const usuariosAutorizados = parametroResult.rows[0].val_parametro || "";
    console.log("Usuários autorizados:", usuariosAutorizados);

    // Verifica se o cod_usuario está na lista de autorizados
    // Converte cod_usuario para string para comparação
    const codUsuarioStr = String(cod_usuario).trim().toUpperCase();
    const listaUsuarios = usuariosAutorizados
      .split(",")
      .map((u) => u.trim().toUpperCase());
    const temPermissao = listaUsuarios.includes(codUsuarioStr);

    console.log("Tem permissão?", temPermissao);

    res.json({
      success: true,
      message: temPermissao
        ? "Usuário autorizado"
        : "Usuário não autorizado",
      data: {
        tem_permissao: temPermissao,
        cod_usuario_autorizado: temPermissao ? cod_usuario : null,
      },
    });
  } catch (error) {
    console.error("Erro ao verificar permissão:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao verificar permissão",
      error: error.message,
    });
  }
});

// POST /api/logo/upload
app.post("/api/logo/upload", async (req, res) => {
  try {
    const multer = require("multer");
    const path = require("path");

    // Configurar storage do multer
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const logosDir = path.join(__dirname, "public", "logos");
        cb(null, logosDir);
      },
      filename: (req, file, cb) => {
        const schema = req.body.schema;
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `${schema}_logo_${timestamp}${ext}`);
      },
    });

    const upload = multer({
      storage: storage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(
          path.extname(file.originalname).toLowerCase(),
        );
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
          return cb(null, true);
        } else {
          cb(new Error("Apenas imagens PNG e JPEG são permitidas!"));
        }
      },
    }).single("logo");

    upload(req, res, async (err) => {
      if (err) {
        console.error("Erro no upload:", err);
        return res.status(400).json({
          success: false,
          message: err.message || "Erro ao fazer upload",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Nenhum arquivo foi enviado",
        });
      }

      const { schema } = req.body;

      if (!schema) {
        return res.status(400).json({
          success: false,
          message: "Schema não informado",
        });
      }

      console.log("=== UPLOAD DE LOGO ===");
      console.log("Schema:", schema);
      console.log("Arquivo:", req.file.filename);

      // Gerar URL da logo
      const serverUrl = process.env.SERVER_PUBLIC_URL || `http://localhost:${PORT}`;
      const logoUrl = `${serverUrl}/logos/${req.file.filename}`;

      console.log("URL da logo:", logoUrl);

      // Atualizar tab_base com a nova logo_url
      const updateQuery = `
        UPDATE tab_base
        SET logo_url = $1
        WHERE nom_schema = $2
      `;

      const result = await pool.query(updateQuery, [logoUrl, schema]);

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Schema não encontrado na tab_base",
        });
      }

      console.log("✅ Logo atualizada com sucesso no banco");

      res.json({
        success: true,
        message: "Logo atualizada com sucesso",
        data: {
          logo_url: logoUrl,
        },
      });
    });
  } catch (error) {
    console.error("Erro ao fazer upload da logo:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao fazer upload da logo",
      error: error.message,
    });
  }
});

// ===============================================
// ROTA DE HEALTH CHECK (para Railway e monitoramento)
// ===============================================

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    database: "PostgreSQL",
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    database: "PostgreSQL",
  });
});

// ===============================================
// INICIALIZAÇÃO DO SERVIDOR
// ===============================================

app.listen(PORT, HOST, () => {
  const serverIP = process.env.SERVER_PUBLIC_IP || "localhost";

  console.log("\n🚀 Backend rodando!");
  console.log(`📡 Ambiente: ${NODE_ENV}`);
  console.log(`📡 Porta: ${PORT}`);
  console.log(`📡 Host: ${HOST}`);
  console.log(`🌐 URL Local: http://localhost:${PORT}`);
  console.log(`🌐 URL Rede: http://${serverIP}:${PORT}`);
  console.log("\n💾 Usando PostgreSQL");
  console.log(`📊 Database: ${process.env.DB_NAME || "drfpedido"}`);
  console.log(`🖥️ Host DB: ${process.env.DB_HOST || "cloud.digitalrf.com.br"}`);
  console.log("\n✅ Servidor pronto para receber requisições");
  console.log("\n");
});
