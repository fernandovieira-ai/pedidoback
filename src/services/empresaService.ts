import { getAPIBaseURL } from "../config/api";

export interface Empresa {
  cod_empresa: number;
  nom_razao_social: string;
  nom_fantasia: string;
  num_cnpj_cpf: string;
  cod_base: number;
}

export interface ListarEmpresasResponse {
  success: boolean;
  message: string;
  data?: Empresa[];
}

// Listar empresas do schema
export const listarEmpresas = async (
  schema: string
): Promise<ListarEmpresasResponse> => {
  try {
    const response = await fetch(`${getAPIBaseURL()}/empresas/listar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ schema }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao listar empresas");
    }

    return data;
  } catch (error) {
    console.error("Erro ao listar empresas:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erro ao listar empresas",
    };
  }
};
