import { API_BASE_URL } from "../config/api";

export interface ItemVenda {
  seq_nota: number;
  cod_item: number;
  des_item: string;
  des_unidade: string;
  cod_almoxarifado: number;
  cod_natureza_operacao: number;
  qtd_item: number;
  val_unitario: number;
  val_total_item: number;
}

export interface UltimaVenda {
  seq_nota: number;
  num_nota: string;
  cod_cliente: number;
  cliente: string;
  num_cnpj_cpf: string;
  cod_vendedor: number;
  dta_emissao: string;
  cod_condicao_pagamento: number;
  des_condicao_pagamento: string;
  val_total: number;
  qtd_itens: number;
  itens: ItemVenda[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Busca a última venda (nota fiscal) do vendedor
 * Se parâmetro cod_parametro = 2 for 'S', filtra por vendedor do usuário
 * @param schema Schema do banco de dados
 * @param usuario Nome do usuário logado
 * @param cod_cliente Código do cliente (opcional)
 */
export const buscarUltimaVenda = async (
  schema: string,
  usuario: string,
  cod_cliente?: number
): Promise<ApiResponse<UltimaVenda | null>> => {
  try {
    console.log("🔵 [vendaService] Iniciando busca de última venda");
    console.log("🔵 [vendaService] Parâmetros:", {
      schema,
      usuario,
      cod_cliente,
    });

    const body = {
      schema,
      usuario,
      cod_cliente,
    };

    console.log("🔵 [vendaService] Body da requisição:", JSON.stringify(body));
    console.log("🔵 [vendaService] URL:", `${API_BASE_URL}/vendas/ultima`);

    const response = await fetch(`${API_BASE_URL}/vendas/ultima`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log("🔵 [vendaService] Status da resposta:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("🔵 [vendaService] Resultado:", result);
    return result;
  } catch (error) {
    console.error("Erro ao buscar última venda:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erro ao buscar última venda",
    };
  }
};
