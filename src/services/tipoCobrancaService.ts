import { getAPIBaseURL } from "../config/api";

export interface TipoCobranca {
  cod_tipo_cobranca: number;
  des_tipo_cobranca: string;
}

export interface ListarTiposCobrancaResponse {
  success: boolean;
  message: string;
  data?: TipoCobranca[];
}

export interface TipoCobrancaPadraoResponse {
  success: boolean;
  message: string;
  data?: {
    cod_tipo_cobranca_padrao: number | null;
  };
}

// Listar todos os tipos de cobrança
export const listarTiposCobranca = async (
  schema: string,
): Promise<ListarTiposCobrancaResponse> => {
  try {
    const response = await fetch(
      `${getAPIBaseURL()}/tipos-cobranca/listar?schema=${encodeURIComponent(
        schema,
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao listar tipos de cobrança");
    }

    return data;
  } catch (error) {
    console.error("Erro ao listar tipos de cobrança:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Erro ao listar tipos de cobrança",
    };
  }
};

// Buscar tipo de cobrança padrão (parâmetro 9)
export const buscarTipoCobrancaPadrao = async (
  schema: string,
): Promise<TipoCobrancaPadraoResponse> => {
  try {
    const response = await fetch(
      `${getAPIBaseURL()}/parametros/tipo-cobranca-padrao?schema=${encodeURIComponent(
        schema,
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Resposta não é JSON:", await response.text());
      throw new Error("Servidor retornou resposta inválida");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao buscar tipo de cobrança padrão");
    }

    return data;
  } catch (error) {
    console.error("Erro ao buscar tipo de cobrança padrão:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};
