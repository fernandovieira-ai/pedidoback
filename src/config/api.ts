/**
 * ============================================
 * 🔧 CONFIGURAÇÃO DE SERVIDORES - AppPedido
 * ============================================
 *
 * Este arquivo controla para qual servidor o app vai se conectar
 *
 * 3 MODOS DISPONÍVEIS:
 *
 * 1. 'local'       → Testes no seu computador (localhost)
 *                    Use para testar no iOS Simulator ou Android Emulator
 *
 * 2. 'network'     → Testes na rede local (131.100.231.199)
 *                    Use para testar em celular físico na mesma rede
 *                    Esse é o servidor que está rodando AGORA no seu PC
 *
 * 3. 'production'  → Servidor externo de produção (IP fixo)
 *                    Use quando subir para servidor na nuvem/externo
 */

// ============================================
// ⚙️ URLs DOS SERVIDORES
// ============================================

const SERVERS = {
  // 🏠 LOCAL - Desenvolvimento no seu computador
  local: "http://localhost:3001/api",

  // 🌐 REDE LOCAL - Testes na sua rede WiFi
  // ALTERE para o IP da sua máquina de desenvolvimento
  network: "http://192.168.100.12:3001/api",
  // Para descobrir seu IP: ipconfig (Windows) ou ifconfig (Linux/Mac)

  // 🚀 PRODUÇÃO - Servidor Railway (Cloud)
  // Backend hospedado no Railway com HTTPS automático
  production: "https://backeend-pedido-production-25a7.up.railway.app/api",
};

// ============================================
// 🎯 ESCOLHA O MODO AQUI:
// ============================================
// Altere entre: 'local' | 'network' | 'production'

// 🔧 ALTERE AQUI para mudar entre local e Railway:
// "network" = Backend local (192.168.100.12:3001)
// "production" = Backend Railway (cloud)
const MODO_ATUAL: "local" | "network" | "production" = "network";

// 💡 GUIA RÁPIDO DE USO:
//
// MODO 'local':
//   - Para testes no computador
//   - iOS Simulator
//   - Android Emulator
//   - Backend rodando em localhost
//
// MODO 'network':
//   - Para testes em celular físico
//   - Celular e PC na mesma rede WiFi
//   - Backend rodando em 192.168.100.12
//   - Use este para desenvolvimento local
//
// MODO 'production': ← VOCÊ ESTÁ AQUI AGORA
//   - App publicado
//   - Backend hospedado no Railway
//   - HTTPS automático
//   - Acesso de qualquer lugar via internet

// ============================================
// 🔄 LÓGICA DE SELEÇÃO (NÃO ALTERE)
// ============================================

export const getAPIBaseURL = (): string => {
  const url = SERVERS[MODO_ATUAL];

  console.log(`🔧 Modo: ${MODO_ATUAL.toUpperCase()}`);
  console.log(`🌐 URL: ${url}`);

  return url;
};

// URL base da API
export const API_BASE_URL = getAPIBaseURL();

// ============================================
// 📡 ENDPOINTS DA API
// ============================================

export const API_ENDPOINTS = {
  auth: {
    validateCNPJ: "/auth/validate-cnpj",
    login: "/auth/login",
    logout: "/auth/logout",
    refreshToken: "/auth/refresh-token",
  },
  pedidos: {
    list: "/pedidos",
    create: "/pedidos",
    update: (id: string) => `/pedidos/${id}`,
    delete: (id: string) => `/pedidos/${id}`,
  },
};

// ============================================
// ⚙️ CONFIGURAÇÕES GERAIS
// ============================================

// Timeout padrão para requisições (em ms)
export const API_TIMEOUT = 30000; // 30 segundos

// Headers padrão
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

// ============================================
// 🛠️ HELPERS
// ============================================

/**
 * Helper para construir URL completa
 */
export const buildURL = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Helper para adicionar token aos headers
 */
export const getAuthHeaders = (token?: string) => {
  const headers = { ...DEFAULT_HEADERS };
  if (token) {
    Object.assign(headers, { Authorization: `Bearer ${token}` });
  }
  return headers;
};
