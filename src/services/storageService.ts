import AsyncStorage from "@react-native-async-storage/async-storage";

// Chaves de armazenamento
const STORAGE_KEYS = {
  AUTH_TOKEN: "@AppPedido:authToken",
  USER_DATA: "@AppPedido:userData",
  CNPJ_DATA: "@AppPedido:cnpjData",
  REMEMBER_ME: "@AppPedido:rememberMe",
  SAVED_PASSWORD: "@AppPedido:savedPassword",
  SAVED_USERNAME: "@AppPedido:savedUsername",
  REMEMBER_PASSWORD: "@AppPedido:rememberPassword",
  SELECTED_EMPRESA: "@AppPedido:selectedEmpresa",
};

// Interface dos dados do usuário
export interface UserData {
  usuario: string;
  cnpj: string;
  schema: string;
}

/**
 * Salvar token de autenticação
 */
export const saveAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error("Erro ao salvar token:", error);
    throw error;
  }
};

/**
 * Obter token de autenticação
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error("Erro ao obter token:", error);
    return null;
  }
};

/**
 * Remover token de autenticação
 */
export const removeAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error("Erro ao remover token:", error);
    throw error;
  }
};

/**
 * Salvar dados do usuário
 */
export const saveUserData = async (userData: UserData): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_DATA,
      JSON.stringify(userData)
    );
  } catch (error) {
    console.error("Erro ao salvar dados do usuário:", error);
    throw error;
  }
};

/**
 * Obter dados do usuário
 */
export const getUserData = async (): Promise<UserData | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Erro ao obter dados do usuário:", error);
    return null;
  }
};

/**
 * Remover dados do usuário
 */
export const removeUserData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    console.error("Erro ao remover dados do usuário:", error);
    throw error;
  }
};

/**
 * Salvar preferência "Lembrar-me"
 */
export const saveRememberMe = async (remember: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.REMEMBER_ME,
      remember ? "true" : "false"
    );
  } catch (error) {
    console.error("Erro ao salvar preferência lembrar-me:", error);
    throw error;
  }
};

/**
 * Obter preferência "Lembrar-me"
 */
export const getRememberMe = async (): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
    return data === "true";
  } catch (error) {
    console.error("Erro ao obter preferência lembrar-me:", error);
    return false;
  }
};

/**
 * Limpar apenas dados da sessão (Logout mantendo credenciais salvas)
 * Remove token e dados do usuário, mas mantém CNPJ, usuário e senha salvos
 */
export const clearSessionData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.SELECTED_EMPRESA,
    ]);
  } catch (error) {
    console.error("Erro ao limpar dados da sessão:", error);
    throw error;
  }
};

/**
 * Limpar todos os dados armazenados (Logout completo)
 */
export const clearAllStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.CNPJ_DATA,
      STORAGE_KEYS.REMEMBER_ME,
      STORAGE_KEYS.SAVED_PASSWORD,
      STORAGE_KEYS.REMEMBER_PASSWORD,
      STORAGE_KEYS.SAVED_USERNAME,
      STORAGE_KEYS.SELECTED_EMPRESA,
    ]);
  } catch (error) {
    console.error("Erro ao limpar armazenamento:", error);
    throw error;
  }
};

/**
 * Verificar se usuário está autenticado
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await getAuthToken();
    return Boolean(token !== null);
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error);
    return false;
  }
};

// Interface para dados do CNPJ
export interface CNPJData {
  cnpj: string;
  schema: string;
  empresa?: string;
}

/**
 * Salvar dados do CNPJ validado
 */
export const saveCNPJData = async (cnpjData: CNPJData): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.CNPJ_DATA,
      JSON.stringify(cnpjData)
    );
  } catch (error) {
    console.error("Erro ao salvar dados do CNPJ:", error);
    throw error;
  }
};

/**
 * Obter dados do CNPJ salvo
 */
export const getCNPJData = async (): Promise<CNPJData | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CNPJ_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Erro ao obter dados do CNPJ:", error);
    return null;
  }
};

/**
 * Remover dados do CNPJ
 */
export const removeCNPJData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.CNPJ_DATA);
  } catch (error) {
    console.error("Erro ao remover dados do CNPJ:", error);
    throw error;
  }
};

/**
 * Salvar senha do usuário
 */
export const savePassword = async (password: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_PASSWORD, password);
  } catch (error) {
    console.error("Erro ao salvar senha:", error);
    throw error;
  }
};

/**
 * Obter senha salva
 */
export const getSavedPassword = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.SAVED_PASSWORD);
  } catch (error) {
    console.error("Erro ao obter senha salva:", error);
    return null;
  }
};

/**
 * Remover senha salva
 */
export const removeSavedPassword = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_PASSWORD);
  } catch (error) {
    console.error("Erro ao remover senha salva:", error);
    throw error;
  }
};

/**
 * Salvar nome de usuário
 */
export const saveUsername = async (username: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_USERNAME, username);
  } catch (error) {
    console.error("Erro ao salvar nome de usuário:", error);
    throw error;
  }
};

/**
 * Obter nome de usuário salvo
 */
export const getSavedUsername = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.SAVED_USERNAME);
  } catch (error) {
    console.error("Erro ao obter nome de usuário salvo:", error);
    return null;
  }
};

/**
 * Remover nome de usuário salvo
 */
export const removeSavedUsername = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_USERNAME);
  } catch (error) {
    console.error("Erro ao remover nome de usuário salvo:", error);
    throw error;
  }
};

/**
 * Salvar preferência "Salvar senha"
 */
export const saveRememberPassword = async (
  remember: boolean
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.REMEMBER_PASSWORD,
      remember ? "true" : "false"
    );
  } catch (error) {
    console.error("Erro ao salvar preferência salvar senha:", error);
    throw error;
  }
};

/**
 * Obter preferência "Salvar senha"
 */
export const getRememberPassword = async (): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_PASSWORD);
    return data === "true";
  } catch (error) {
    console.error("Erro ao obter preferência salvar senha:", error);
    return false;
  }
};

// Interface para dados da empresa
export interface EmpresaData {
  cod_empresa: number;
  nom_razao_social: string;
  nom_fantasia: string;
  num_cnpj_cpf: string;
  cod_base: number;
}

/**
 * Salvar empresa selecionada
 */
export const saveSelectedEmpresa = async (
  empresa: EmpresaData
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.SELECTED_EMPRESA,
      JSON.stringify(empresa)
    );
  } catch (error) {
    console.error("Erro ao salvar empresa selecionada:", error);
    throw error;
  }
};

/**
 * Obter empresa selecionada
 */
export const getSelectedEmpresa = async (): Promise<EmpresaData | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_EMPRESA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Erro ao obter empresa selecionada:", error);
    return null;
  }
};

/**
 * Remover empresa selecionada
 */
export const removeSelectedEmpresa = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_EMPRESA);
  } catch (error) {
    console.error("Erro ao remover empresa selecionada:", error);
    throw error;
  }
};
