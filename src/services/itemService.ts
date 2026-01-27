import { getAPIBaseURL } from "../config/api";

export interface Item {
  cod_item: number;
  des_item: string;
  cod_barra: string;
  cod_referencia: string;
  des_unidade: string;
  num_fator_conversao: number;
  val_preco_venda: number;
  val_custo_medio: number;
  val_custo_unitario: number;
  per_margem_desejada: number;
}

export interface ItemPedido extends Item {
  quantidade: number;
  val_total: number;
}

export interface PesquisarItensResponse {
  success: boolean;
  message: string;
  data?: Item[];
}

export interface DetalhesItensResponse {
  success: boolean;
  message: string;
  data?: {
    [cod_item: number]: {
      val_preco_venda: number;
      val_custo_medio: number;
      val_custo_unitario: number;
      per_margem_desejada: number;
    };
  };
}

// Pesquisar itens
export const pesquisarItens = async (
  schema: string,
  cod_empresa: number,
  termo?: string,
  limit: number = 50,
  offset: number = 0
): Promise<PesquisarItensResponse> => {
  try {
    const response = await fetch(`${getAPIBaseURL()}/itens/pesquisar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        schema,
        cod_empresa,
        termo,
        limit,
        offset,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao pesquisar itens");
    }

    return data;
  } catch (error) {
    console.error("Erro na pesquisa de itens:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erro ao pesquisar itens",
    };
  }
};

// Buscar detalhes de múltiplos itens (preço e custos)
export const buscarDetalhesItens = async (
  schema: string,
  cod_empresa: number,
  cod_itens: number[]
): Promise<DetalhesItensResponse> => {
  try {
    const response = await fetch(`${getAPIBaseURL()}/itens/detalhes-multiplos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        schema,
        cod_empresa,
        cod_itens,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao buscar detalhes dos itens");
    }

    return data;
  } catch (error) {
    console.error("Erro ao buscar detalhes dos itens:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erro ao buscar detalhes dos itens",
    };
  }
};
