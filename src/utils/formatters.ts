/**
 * Utilitários de formatação de dados
 */

/**
 * Formata CNPJ durante digitação
 * Formato: 00.000.000/0000-00
 */
export const formatCNPJ = (text: string): string => {
  const numbers = text.replace(/\D/g, "");
  return numbers
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .substring(0, 18);
};

/**
 * Remove formatação do CNPJ (retorna apenas números)
 */
export const unformatCNPJ = (text: string): string => {
  return text.replace(/\D/g, "");
};

/**
 * Formata CPF durante digitação
 * Formato: 000.000.000-00
 */
export const formatCPF = (text: string): string => {
  const numbers = text.replace(/\D/g, "");
  return numbers
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2")
    .substring(0, 14);
};

/**
 * Remove formatação do CPF (retorna apenas números)
 */
export const unformatCPF = (text: string): string => {
  return text.replace(/\D/g, "");
};

/**
 * Formata telefone durante digitação
 * Formato: (00) 00000-0000 ou (00) 0000-0000
 */
export const formatPhone = (text: string): string => {
  const numbers = text.replace(/\D/g, "");

  if (numbers.length <= 10) {
    // Formato: (00) 0000-0000
    return numbers
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .substring(0, 14);
  } else {
    // Formato: (00) 00000-0000
    return numbers
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .substring(0, 15);
  }
};

/**
 * Remove formatação do telefone (retorna apenas números)
 */
export const unformatPhone = (text: string): string => {
  return text.replace(/\D/g, "");
};

/**
 * Formata CEP durante digitação
 * Formato: 00000-000
 */
export const formatCEP = (text: string): string => {
  const numbers = text.replace(/\D/g, "");
  return numbers.replace(/^(\d{5})(\d)/, "$1-$2").substring(0, 9);
};

/**
 * Remove formatação do CEP (retorna apenas números)
 */
export const unformatCEP = (text: string): string => {
  return text.replace(/\D/g, "");
};

/**
 * Formata data durante digitação
 * Formato: DD/MM/AAAA
 */
export const formatDate = (text: string): string => {
  const numbers = text.replace(/\D/g, "");
  return numbers
    .replace(/^(\d{2})(\d)/, "$1/$2")
    .replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3")
    .substring(0, 10);
};

/**
 * Remove formatação da data (retorna apenas números)
 */
export const unformatDate = (text: string): string => {
  return text.replace(/\D/g, "");
};

/**
 * Formata valor monetário
 * Formato: R$ 1.234,56
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

/**
 * Formata número decimal
 * Formato: 1.234,56
 */
export const formatDecimal = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};
