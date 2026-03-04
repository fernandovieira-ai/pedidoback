import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders } from '../config/api';

export interface ValidateCNPJResponse {
  success: boolean;
  message: string;
  data?: {
    cnpj: string;
    schema: string;
    logo_url?: string;
    nome_empresa?: string;
  };
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    usuario: string;
    cod_usuario: string;
    cnpj: string;
    schema: string;
    token: string;
    logo_url?: string;
    nome_empresa?: string;
  };
}

// Validar CNPJ e obter schema
export const validateCNPJ = async (
  cnpj: string,
): Promise<ValidateCNPJResponse> => {
  try {
    console.log('Tentando validar CNPJ:', cnpj);
    console.log('URL:', `${API_BASE_URL}${API_ENDPOINTS.auth.validateCNPJ}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.auth.validateCNPJ}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ cnpj }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao validar CNPJ');
    }

    return data;
  } catch (error) {
    console.error('Erro na validação de CNPJ:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        message:
          'Timeout: Não foi possível conectar ao servidor. Verifique se o backend está rodando.',
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao validar CNPJ',
    };
  }
};

// Fazer login com usuário e senha
export const loginUser = async (
  cnpj: string,
  schema: string,
  usuario: string,
  senha: string,
): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.login}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        cnpj,
        schema,
        usuario,
        senha,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao fazer login');
    }

    return data;
  } catch (error) {
    console.error('Erro no login:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao fazer login',
    };
  }
};
