import { getAPIBaseURL } from "../config/api";

export interface Cliente {
  cod_pessoa: number;
  nom_pessoa: string;
  num_cnpj: string;
  des_endereco: string;
  nom_cidade: string;
}

export interface EnderecoCliente {
  seq_endereco: number;
  cod_pessoa: number;
  des_logradouro: string;
  des_complemento: string;
  nom_cidade: string;
  nom_bairro: string;
  num_cep: string;
  num_caixa_postal: string;
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
  offset: number = 0,
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

// Buscar endereços de um cliente
export const buscarEnderecosCliente = async (
  schema: string,
  cod_pessoa: number,
): Promise<{ success: boolean; message: string; data?: EnderecoCliente[] }> => {
  try {
    const response = await fetch(`${getAPIBaseURL()}/clientes/enderecos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ schema, cod_pessoa }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao buscar endereços");
    }

    return data;
  } catch (error) {
    console.error("Erro ao buscar endereços do cliente:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erro ao buscar endereços",
    };
  }
};
