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

// Buscar parâmetros de configuração de preço
export const buscarParametrosPreco = async (
  schema: string
): Promise<ParametrosPrecoResponse> => {
  try {
    const response = await fetch(
      `${getAPIBaseURL()}/parametros/preco?schema=${encodeURIComponent(
        schema
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Erro ao buscar parâmetros de preço"
      );
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
