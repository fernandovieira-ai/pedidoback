import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../styles/colors";
import {
  excluirPedido,
  obterDetalhesPedido,
  PedidoDetalhado,
  sincronizarPedido,
} from "../services/pedidoService";
import { formatCurrency } from "../utils/formatters";

interface DetalhesPedidoScreenProps {
  navigation: any;
  route: any;
}

export default function DetalhesPedidoScreen({
  navigation,
  route,
}: DetalhesPedidoScreenProps) {
  const {
    usuario,
    cnpj,
    schema,
    empresa,
    pedido: pedidoInicial,
  } = route.params || {};

  const [pedido, setPedido] = useState<PedidoDetalhado | null>(null);
  const [loading, setLoading] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  // Recarregar detalhes sempre que a tela ganhar foco (após edição)
  useFocusEffect(
    useCallback(() => {
      carregarDetalhes();
    }, [])
  );

  const carregarDetalhes = async () => {
    if (!schema || !pedidoInicial) {
      Alert.alert("Erro", "Dados incompletos");
      return;
    }

    try {
      setLoading(true);
      const resultado = await obterDetalhesPedido(
        schema,
        pedidoInicial.seq_pedido
      );

      if (resultado.success && resultado.data) {
        setPedido(resultado.data);
      } else {
        Alert.alert("Erro", resultado.message || "Erro ao carregar detalhes");
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
      Alert.alert("Erro", "Erro ao carregar detalhes do pedido");
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = () => {
    Alert.alert(
      "Confirmar Exclusão",
      `Deseja realmente excluir o Pedido #${pedidoInicial.seq_pedido}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: confirmarExclusao,
        },
      ]
    );
  };

  const confirmarExclusao = async () => {
    if (!schema || !pedidoInicial) return;

    try {
      setExcluindo(true);
      const resultado = await excluirPedido(schema, pedidoInicial.seq_pedido);

      if (resultado.success) {
        Alert.alert("Sucesso", "Pedido excluído com sucesso", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert("Erro", resultado.message || "Erro ao excluir pedido");
      }
    } catch (error) {
      console.error("Erro ao excluir pedido:", error);
      Alert.alert("Erro", "Erro ao excluir pedido");
    } finally {
      setExcluindo(false);
    }
  };

  const handleEditar = () => {
    if (!pedido) return;

    navigation.navigate("AddPedido", {
      ...route.params,
      pedidoParaEditar: pedido,
    });
  };

  const handleSincronizar = () => {
    Alert.alert(
      "Confirmar Envio",
      `Deseja enviar o Pedido #${pedido?.seq_pedido}? Após o envio, o pedido não poderá mais ser editado ou excluído.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Enviar",
          onPress: confirmarSincronizacao,
        },
      ]
    );
  };

  const confirmarSincronizacao = async () => {
    if (!schema || !pedido) return;

    try {
      setSincronizando(true);
      const resultado = await sincronizarPedido(schema, pedido.seq_pedido);

      if (resultado.success) {
        Alert.alert("Sucesso", "Pedido enviado com sucesso", [
          {
            text: "OK",
            onPress: () => carregarDetalhes(), // Recarrega para atualizar o estado
          },
        ]);
      } else {
        Alert.alert("Erro", resultado.message || "Erro ao enviar pedido");
      }
    } catch (error) {
      console.error("Erro ao sincronizar pedido:", error);
      Alert.alert("Erro", "Erro ao enviar pedido");
    } finally {
      setSincronizando(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.white} />
            <Text style={styles.loadingText}>Carregando detalhes...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!pedido) {
    return (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Pedido não encontrado</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pedido #{pedido.seq_pedido}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.scrollContent}>
          {/* Card de Informações Gerais */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informações Gerais</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cliente:</Text>
              <Text style={styles.infoValue}>{pedido.cliente}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data Pedido:</Text>
              <Text style={styles.infoValue}>{pedido.dat_pedido}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data Entrega:</Text>
              <Text style={styles.infoValue}>{pedido.dat_entrega}</Text>
            </View>

            {pedido.des_condicao_pagamento && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Condição de Pagamento:</Text>
                <Text style={styles.infoValue}>
                  {pedido.des_condicao_pagamento}
                </Text>
              </View>
            )}

            {pedido.des_observacao && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Observação:</Text>
                <Text style={styles.infoValue}>{pedido.des_observacao}</Text>
              </View>
            )}
          </View>

          {/* Card de Itens */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Itens do Pedido</Text>

            {pedido.itens.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemCodigo}>#{item.cod_item}</Text>
                  <Text style={styles.itemQuantidade}>
                    Qtd: {item.quantidade} {item.des_unidade}
                  </Text>
                </View>

                <Text style={styles.itemDescricao}>{item.des_item}</Text>

                <View style={styles.itemFooter}>
                  <Text style={styles.itemPreco}>
                    Unit: {formatCurrency(item.val_unitario)}
                  </Text>
                  <Text style={styles.itemTotal}>
                    Total: {formatCurrency(item.val_total)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Card de Totais */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resumo Financeiro</Text>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(pedido.val_subtotal)}
              </Text>
            </View>

            {pedido.val_desconto > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Desconto:</Text>
                <Text style={[styles.totalValue, styles.descontoValue]}>
                  -{formatCurrency(pedido.val_desconto)}
                </Text>
              </View>
            )}

            {pedido.val_acrescimo > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Acréscimo:</Text>
                <Text style={[styles.totalValue, styles.acrescimoValue]}>
                  +{formatCurrency(pedido.val_acrescimo)}
                </Text>
              </View>
            )}

            {pedido.val_frete > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Frete:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(pedido.val_frete)}
                </Text>
              </View>
            )}

            <View style={[styles.totalRow, styles.totalFinal]}>
              <Text style={styles.totalFinalLabel}>Total:</Text>
              <Text style={styles.totalFinalValue}>
                {formatCurrency(pedido.val_total)}
              </Text>
            </View>
          </View>

          {/* Card de Parcelas */}
          {pedido.parcelas && pedido.parcelas.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Parcelas de Pagamento</Text>

              {pedido.parcelas.map((parcela, index) => (
                <View key={index} style={styles.parcelaCard}>
                  <View style={styles.parcelaHeader}>
                    <Text style={styles.parcelaNumero}>
                      Parcela {parcela.numero}
                    </Text>
                    <Text style={styles.parcelaValor}>
                      {formatCurrency(parcela.valor)}
                    </Text>
                  </View>
                  <Text style={styles.parcelaVencimento}>
                    Vencimento: {parcela.dataVencimento}
                  </Text>
                </View>
              ))}

              <View style={styles.parcelasTotalContainer}>
                <Text style={styles.parcelasTotalLabel}>
                  Total em {pedido.parcelas.length}x
                </Text>
                <Text style={styles.parcelasTotalValor}>
                  {formatCurrency(pedido.val_total)}
                </Text>
              </View>
            </View>
          )}

          {/* Botões de Ação */}
          <View style={styles.botoesContainer}>
            <TouchableOpacity
              style={[
                styles.botao,
                styles.botaoEditar,
                pedido.ind_sincronizado === "S" && styles.botaoDesabilitado,
              ]}
              onPress={handleEditar}
              disabled={excluindo || pedido.ind_sincronizado === "S"}
            >
              <Text
                style={[
                  styles.botaoEditarText,
                  pedido.ind_sincronizado === "S" &&
                    styles.botaoDesabilitadoText,
                ]}
              >
                ✏️ Editar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.botao,
                styles.botaoExcluir,
                pedido.ind_sincronizado === "S" && styles.botaoDesabilitado,
              ]}
              onPress={handleExcluir}
              disabled={excluindo || pedido.ind_sincronizado === "S"}
            >
              {excluindo ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text
                  style={[
                    styles.botaoExcluirText,
                    pedido.ind_sincronizado === "S" &&
                      styles.botaoDesabilitadoText,
                  ]}
                >
                  🗑️ Excluir
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Botão de Enviar */}
          <View style={styles.botoesContainer}>
            <TouchableOpacity
              style={[
                styles.botao,
                styles.botaoEnviar,
                pedido.ind_sincronizado === "S" && styles.botaoEnviado,
              ]}
              onPress={handleSincronizar}
              disabled={sincronizando || pedido.ind_sincronizado === "S"}
            >
              {sincronizando ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.botaoEnviarText}>
                  {pedido.ind_sincronizado === "S"
                    ? "✅ Pedido Enviado"
                    : "📤 Enviar Pedido"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  backButton: {
    padding: 5,
  },
  backText: {
    color: colors.white,
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: colors.white,
    fontSize: 14,
    marginTop: 10,
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.darkGray,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  itemCard: {
    backgroundColor: colors.lightGray,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  itemCodigo: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  itemQuantidade: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.darkGray,
  },
  itemDescricao: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemPreco: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.darkGray,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  descontoValue: {
    color: colors.error,
  },
  acrescimoValue: {
    color: colors.primary,
  },
  totalFinal: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    paddingTop: 12,
    marginTop: 4,
  },
  totalFinalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  totalFinalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
  },
  botoesContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  botao: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  botaoEditar: {
    backgroundColor: colors.primary,
  },
  botaoEditarText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  botaoExcluir: {
    backgroundColor: colors.error,
  },
  botaoExcluirText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  parcelaCard: {
    backgroundColor: colors.lightGray,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  parcelaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  parcelaNumero: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary,
  },
  parcelaValor: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.primary,
  },
  parcelaVencimento: {
    fontSize: 13,
    color: colors.darkGray,
  },
  parcelasTotalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  parcelasTotalLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.white,
  },
  parcelasTotalValor: {
    fontSize: 17,
    fontWeight: "bold",
    color: colors.white,
  },
  botaoDesabilitado: {
    backgroundColor: colors.mediumGray,
    opacity: 0.6,
  },
  botaoDesabilitadoText: {
    color: colors.darkGray,
  },
  botaoEnviar: {
    backgroundColor: colors.success,
  },
  botaoEnviado: {
    backgroundColor: colors.mediumGray,
    opacity: 0.7,
  },
  botaoEnviarText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});
