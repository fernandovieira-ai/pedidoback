import { API_BASE_URL } from "../config/api";

// Interface para item do relatório (uma linha por item do pedido)
export interface ItemRelatorioPedido {
  seq_pedido: number;
  seq_pre_venda: number | null;
  num_pre_venda: string | null;
  cliente: string;
  num_item: string;
  produto: string;
  qtd_item: number;
  val_unitario: number;
  val_total: number;
  ind_sincronizado: string;
  dat_pedido: string;
  val_total_pedido: number;
}

// Interface para o resumo do período
export interface ResumoRelatorioPedidos {
  data_inicio: string;
  data_fim: string;
  qtd_pedidos: number;
  qtd_enviados: number;
  qtd_pendentes: number;
  val_total_dia: number;
}

export interface RelatorioPedidosPeriodo {
  itens: ItemRelatorioPedido[];
  resumo: ResumoRelatorioPedidos;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

// Interface de um pedido agrupado, pronta para exibição/exportação
export interface PedidoAgrupado {
  seq_pedido: number;
  seq_pre_venda: number | null;
  num_pre_venda: string | null;
  cliente: string;
  ind_sincronizado: string;
  val_total_pedido: number;
  dat_pedido: string;
  itens: {
    num_item: string;
    produto: string;
    qtd_item: number;
    val_unitario: number;
    val_total: number;
  }[];
}

/**
 * Busca o relatório itemizado de pedidos de um vendedor em um período
 * @param schema Schema do banco de dados
 * @param cod_empresa Código da empresa
 * @param usuario Usuário logado (define o filtro por vendedor)
 * @param dataInicio Data inicial no formato DD/MM/YYYY
 * @param dataFim Data final no formato DD/MM/YYYY
 */
export const obterRelatorioPedidosPeriodo = async (
  schema: string,
  cod_empresa: number,
  usuario: string,
  dataInicio: string,
  dataFim: string,
): Promise<ApiResponse<RelatorioPedidosPeriodo>> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/relatorios/pedidos-periodo`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schema,
          cod_empresa,
          usuario,
          data_inicio: dataInicio,
          data_fim: dataFim,
        }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result?.message || `Erro HTTP ${response.status}`,
      };
    }

    return result;
  } catch (error) {
    console.error("Erro ao obter relatório de pedidos do período:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Erro ao obter relatório de pedidos do período",
    };
  }
};

/**
 * Agrupa a lista itemizada (uma linha por item) em pedidos, cada um com seus itens
 */
export const agruparPorPedido = (
  itens: ItemRelatorioPedido[],
): PedidoAgrupado[] => {
  const mapa = new Map<number, PedidoAgrupado>();

  for (const item of itens) {
    if (!mapa.has(item.seq_pedido)) {
      mapa.set(item.seq_pedido, {
        seq_pedido: item.seq_pedido,
        seq_pre_venda: item.seq_pre_venda,
        num_pre_venda: item.num_pre_venda,
        cliente: item.cliente,
        ind_sincronizado: item.ind_sincronizado,
        val_total_pedido: item.val_total_pedido,
        dat_pedido: item.dat_pedido,
        itens: [],
      });
    }

    mapa.get(item.seq_pedido)!.itens.push({
      num_item: item.num_item,
      produto: item.produto,
      qtd_item: item.qtd_item,
      val_unitario: item.val_unitario,
      val_total: item.val_total,
    });
  }

  return Array.from(mapa.values());
};
