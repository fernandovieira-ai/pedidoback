import { API_BASE_URL } from "../config/api";

export interface CondicaoPagamento {
  cod_condicao_pagamento: number;
  des_condicao_pagamento: string;
  ind_tipo_condicao: string;
}

export interface ParcelaCalculada {
  numero: number;
  dataVencimento: string;
  valor: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Pesquisa condições de pagamento no backend
 * @param schema Schema do banco de dados
 * @param termo Termo de pesquisa (opcional)
 */
export const pesquisarCondicoesPagamento = async (
  schema: string,
  termo?: string
): Promise<ApiResponse<CondicaoPagamento[]>> => {
  try {
    const url = new URL(`${API_BASE_URL}/condicoes-pagamento`);
    url.searchParams.append("schema", schema);
    if (termo) {
      url.searchParams.append("termo", termo);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Erro ao pesquisar condições de pagamento:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erro ao pesquisar condições de pagamento",
    };
  }
};

/**
 * Calcula parcelas de uma condição de pagamento automática
 * @param schema Schema do banco de dados
 * @param cod_condicao_pagamento Código da condição de pagamento
 * @param valor_total Valor total do pedido
 * @param data_referencia Data de referência para cálculo (formato DD/MM/YYYY)
 */
export const calcularParcelasAutomaticas = async (
  schema: string,
  cod_condicao_pagamento: number,
  valor_total: number,
  data_referencia?: string
): Promise<ApiResponse<ParcelaCalculada[]>> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/condicoes-pagamento/calcular-parcelas`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schema,
          cod_condicao_pagamento,
          valor_total,
          data_referencia,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Erro ao calcular parcelas automáticas:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Erro ao calcular parcelas automáticas",
    };
  }
};

/**
 * Busca a última condição de pagamento usada pelo cliente (se parâmetro 5 = 'S')
 * @param schema Schema do banco de dados
 * @param cod_cliente Código do cliente
 */
export const buscarUltimaCondicaoPagamentoCliente = async (
  schema: string,
  cod_cliente: number
): Promise<ApiResponse<CondicaoPagamento | null>> => {
  try {
    const url = new URL(`${API_BASE_URL}/condicoes-pagamento/ultima-do-cliente`);
    url.searchParams.append("schema", schema);
    url.searchParams.append("cod_cliente", cod_cliente.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Erro ao buscar última condição de pagamento do cliente:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Erro ao buscar última condição de pagamento do cliente",
    };
  }
};
