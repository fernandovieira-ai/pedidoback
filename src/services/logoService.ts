import { getAPIBaseURL } from "../config/api";

export interface VerificarPermissaoResponse {
  success: boolean;
  message: string;
  data?: {
    tem_permissao: boolean;
    cod_usuario_autorizado?: string;
  };
}

export interface UploadLogoResponse {
  success: boolean;
  message: string;
  data?: {
    logo_url: string;
  };
}

/**
 * Verificar se o usuário tem permissão para alterar a logo
 * Busca o parâmetro 10 (cod_parametro = 10) que contém o código do usuário autorizado
 */
export const verificarPermissaoAlterarLogo = async (
  schema: string,
  cod_usuario: string
): Promise<VerificarPermissaoResponse> => {
  try {
    const response = await fetch(`${getAPIBaseURL()}/logo/verificar-permissao`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ schema, cod_usuario }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao verificar permissão");
    }

    return data;
  } catch (error) {
    console.error("Erro ao verificar permissão:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erro ao verificar permissão",
    };
  }
};

/**
 * Fazer upload da logo da empresa
 */
export const uploadLogo = async (
  schema: string,
  imageUri: string,
  fileName: string,
  mimeType: string
): Promise<UploadLogoResponse> => {
  try {
    // Criar FormData para enviar o arquivo
    const formData = new FormData();
    formData.append("schema", schema);

    // Adicionar a imagem ao FormData
    const file = {
      uri: imageUri,
      name: fileName,
      type: mimeType,
    } as any;

    formData.append("logo", file);

    const response = await fetch(`${getAPIBaseURL()}/logo/upload`, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao fazer upload da logo");
    }

    return data;
  } catch (error) {
    console.error("Erro ao fazer upload da logo:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erro ao fazer upload da logo",
    };
  }
};

/**
 * Obter a URL da logo atual da empresa
 */
export const obterLogoAtual = async (
  schema: string
): Promise<{ success: boolean; logo_url?: string; message?: string }> => {
  try {
    const response = await fetch(`${getAPIBaseURL()}/logo/obter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ schema }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao obter logo");
    }

    return data;
  } catch (error) {
    console.error("Erro ao obter logo:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro ao obter logo",
    };
  }
};
