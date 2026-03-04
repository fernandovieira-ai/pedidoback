import { getAPIBaseURL } from "../config/api";

export interface ParametrosPreco {
  permite_alterar_preco: "S" | "N";
  tipo_custo: "U" | "M"; // U = Unitário, M = Médio
  bloquear_margem_baixa: "S" | "N"; // S = Bloquear, N = Apenas avisar
}

export interface ParametrosPrecoResponse {
  success: boolean;
  message: string;
  data?: ParametrosPreco;
}

export interface ParametrosItensIniciais {
  quantidade_itens_iniciais: number | null;
}

export interface ParametrosItensIniciaisResponse {
  success: boolean;
  message: string;
  data?: ParametrosItensIniciais;
}

// Buscar parâmetros de configuração de preço
export const buscarParametrosPreco = async (
  schema: string,
): Promise<ParametrosPrecoResponse> => {
  try {
    const response = await fetch(
      `${getAPIBaseURL()}/parametros/preco?schema=${encodeURIComponent(
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
      throw new Error(data.message || "Erro ao buscar parâmetros de preço");
    }

    return data;
  } catch (error) {
    console.error("Erro ao buscar parâmetros de preço:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};

// Buscar parâmetro de itens iniciais (código 8)
export const buscarParametroItensIniciais = async (
  schema: string,
): Promise<ParametrosItensIniciaisResponse> => {
  try {
    const response = await fetch(
      `${getAPIBaseURL()}/parametros/itens-iniciais?schema=${encodeURIComponent(
        schema,
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    // Verifica se a resposta é JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Resposta não é JSON:", await response.text());
      throw new Error("Servidor retornou resposta inválida");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Erro ao buscar parâmetro de itens iniciais",
      );
    }

    return data;
  } catch (error) {
    console.error("Erro ao buscar parâmetro de itens iniciais:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
};
