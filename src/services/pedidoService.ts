import { API_BASE_URL } from "../config/api";
import { Cliente } from "./clienteService";
import { ItemPedido } from "./itemService";
import { CondicaoPagamento } from "./condicaoPagamentoService";

// Interface para parcela
export interface Parcela {
  numero: number;
  dataVencimento: string;
  valor: number;
}

// Interface para dados do pedido
export interface DadosPedido {
  schema: string;
  cod_empresa: number;
  usuario: string;
  cliente: Cliente;
  seq_endereco?: number;
  cod_tipo_cobranca?: number;
  dataEntrega: string;
  itens: ItemPedido[];
  subtotal: number;
  desconto: number;
  acrescimo: number;
  frete: number;
  total: number;
  observacao: string;
  condicaoPagamento: CondicaoPagamento;
  parcelas: Parcela[];
}

// Interface para pedido resumido (listagem)
export interface PedidoResumo {
  seq_pedido: number;
  cod_cliente: number;
  cliente: string;
  dat_pedido: string;
  dat_entrega: string;
  val_total: number;
  qtd_itens: number;
  condicao_pagamento: string;
  ind_sincronizado?: string;
}

// Interface para item do pedido detalhado
export interface ItemPedidoDetalhado {
  cod_item: number;
  des_item: string;
  quantidade: number;
  val_unitario: number;
  val_total: number;
  des_unidade: string;
}

// Interface para pedido detalhado
export interface PedidoDetalhado {
  seq_pedido: number;
  cod_cliente: number;
  cliente: string;
  num_cnpj: string;
  dat_pedido: string;
  dat_entrega: string;
  des_observacao: string;
  val_subtotal: number;
  val_desconto: number;
  val_acrescimo: number;
  val_frete: number;
  val_total: number;
  cod_condicao_pagamento: number;
  des_condicao_pagamento: string;
  seq_endereco?: number;
  cod_tipo_cobranca?: number;
  itens: ItemPedidoDetalhado[];
  parcelas: Parcela[];
  ind_sincronizado?: string;
}

// Interface para filtros de listagem
export interface FiltrosListagem {
  schema: string;
  cod_empresa: number;
  usuario?: string;
  cod_cliente?: number;
  data_inicio?: string;
  data_fim?: string;
  apenas_pendentes?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Cria um novo pedido no backend
 * @param dadosPedido Dados completos do pedido
 */
export const criarPedido = async (
  dadosPedido: DadosPedido,
): Promise<ApiResponse<{ seq_pedido: number }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/pedidos/criar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dadosPedido),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro ao criar pedido",
    };
  }
};

/**
 * Lista pedidos com filtros opcionais
 * @param filtros Filtros para listagem
 */
export const listarPedidos = async (
  filtros: FiltrosListagem,
): Promise<ApiResponse<PedidoResumo[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/pedidos/listar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filtros),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Erro ao listar pedidos:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erro ao listar pedidos",
    };
  }
};

/**
 * Obtém detalhes completos de um pedido
 * @param schema Schema do banco de dados
 * @param seq_pedido Número sequencial do pedido
 */
export const obterDetalhesPedido = async (
  schema: string,
  seq_pedido: number,
): Promise<ApiResponse<PedidoDetalhado>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/pedidos/detalhes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ schema, seq_pedido }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Erro ao obter detalhes do pedido:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Erro ao obter detalhes do pedido",
    };
  }
};

/**
 * Exclui um pedido
 * @param schema Schema do banco de dados
 * @param seq_pedido Número sequencial do pedido
 */
export const excluirPedido = async (
  schema: string,
  seq_pedido: number,
): Promise<ApiResponse<void>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/pedidos/excluir`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ schema, seq_pedido }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Erro ao excluir pedido:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erro ao excluir pedido",
    };
  }
};

/**
 * Atualiza um pedido existente
 * @param dadosPedido Dados completos do pedido com seq_pedido
 */
export const atualizarPedido = async (
  dadosPedido: DadosPedido & { seq_pedido: number },
): Promise<ApiResponse<{ seq_pedido: number }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/pedidos/atualizar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dadosPedido),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erro ao atualizar pedido",
    };
  }
};

/**
 * Sincroniza um pedido (marca como ind_sincronizado = 'S')
 * @param schema Schema do banco de dados
 * @param seq_pedido Número sequencial do pedido
 */
export const sincronizarPedido = async (
  schema: string,
  seq_pedido: number,
): Promise<ApiResponse<void>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/pedidos/sincronizar`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ schema, seq_pedido }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Erro ao sincronizar pedido:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erro ao sincronizar pedido",
    };
  }
};
