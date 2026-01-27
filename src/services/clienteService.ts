import { getAPIBaseURL } from "../config/api";

export interface Cliente {
  cod_pessoa: number;
  nom_pessoa: string;
  num_cnpj: string;
  des_endereco: string;
  nom_cidade: string;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface PesquisarClientesResponse {
  success: boolean;
  message: string;
  data?: Cliente[];
  pagination?: PaginationInfo;
}

// Pesquisar clientes com paginação
export const pesquisarClientes = async (
  schema: string,
  usuario: string,
  termo?: string,
  limit: number = 100,
  offset: number = 0
): Promise<PesquisarClientesResponse> => {
  try {
    const response = await fetch(`${getAPIBaseURL()}/clientes/pesquisar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ schema, usuario, termo, limit, offset }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao pesquisar clientes");
    }

    return data;
  } catch (error) {
    console.error("Erro na pesquisa de clientes:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erro ao pesquisar clientes",
    };
  }
};
