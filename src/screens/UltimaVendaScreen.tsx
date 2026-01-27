import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../styles/colors";
import { buscarUltimaVenda, UltimaVenda } from "../services/vendaService";
import { pesquisarClientes, Cliente } from "../services/clienteService";
import { formatCurrency } from "../utils/formatters";

interface UltimaVendaScreenProps {
  navigation: any;
  route: any;
}

export default function UltimaVendaScreen({
  navigation,
  route,
}: UltimaVendaScreenProps) {
  const { usuario, cnpj, schema } = route.params || {};

  const [venda, setVenda] = useState<UltimaVenda | null>(null);
  const [loading, setLoading] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    null
  );

  // Estados da pesquisa de cliente
  const [modalVisible, setModalVisible] = useState(false);
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pesquisando, setPesquisando] = useState(false);

  // Efeito com debounce para pesquisa automática
  useEffect(() => {
    // Não pesquisa se o modal não estiver visível
    if (!modalVisible) return;

    // Se o termo for menor que 2 caracteres, limpa a lista
    if (termoPesquisa.trim().length < 2) {
      setClientes([]);
      setPesquisando(false);
      return;
    }

    // Debounce: espera 500ms após a última digitação
    const timeoutId = setTimeout(async () => {
      try {
        setPesquisando(true);
        const resultado = await pesquisarClientes(
          schema,
          usuario,
          termoPesquisa.trim(),
          50,
          0
        );

        if (resultado.success && resultado.data) {
          setClientes(resultado.data);
        } else {
          setClientes([]);
        }
      } catch (error) {
        console.error("Erro ao pesquisar clientes:", error);
        setClientes([]);
      } finally {
        setPesquisando(false);
      }
    }, 500);

    // Cleanup: cancela o timeout anterior quando o usuário digita novamente
    return () => clearTimeout(timeoutId);
  }, [termoPesquisa, modalVisible, schema, usuario]);

  const selecionarCliente = async (cliente: Cliente) => {
    console.log("=== CLIENTE SELECIONADO ===");
    console.log("Cliente completo:", JSON.stringify(cliente, null, 2));
    console.log("cod_pessoa:", cliente.cod_pessoa);
    console.log("Tipo de cod_pessoa:", typeof cliente.cod_pessoa);

    setClienteSelecionado(cliente);
    setModalVisible(false);
    setTermoPesquisa("");
    setClientes([]);
    await carregarUltimaVenda(cliente.cod_pessoa);
  };

  const limparSelecao = () => {
    setClienteSelecionado(null);
    setVenda(null);
    setModalVisible(true);
  };

  const carregarUltimaVenda = async (cod_cliente: number) => {
    try {
      setLoading(true);
      console.log("=== CARREGANDO ÚLTIMA VENDA ===");
      console.log("Schema:", schema);
      console.log("Usuário:", usuario);
      console.log("Código do Cliente:", cod_cliente);

      const resultado = await buscarUltimaVenda(schema, usuario, cod_cliente);

      console.log("Resultado da busca:", resultado);

      if (resultado.success) {
        if (resultado.data) {
          console.log("✅ Venda encontrada:", resultado.data);
          setVenda(resultado.data);
        } else {
          console.log("⚠️ Nenhuma venda encontrada para o cliente");
          Alert.alert(
            "Informação",
            "Nenhuma venda encontrada para este cliente"
          );
          setVenda(null);
        }
      } else {
        Alert.alert("Erro", resultado.message);
        setVenda(null);
      }
    } catch (error) {
      console.error("Erro ao carregar última venda:", error);
      Alert.alert("Erro", "Erro ao carregar última venda");
      setVenda(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVoltar = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleVoltar}>
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Última Venda</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Conteúdo */}
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {!clienteSelecionado ? (
              /* Instruções para selecionar cliente */
              <View style={styles.selectionContainer}>
                <Text style={styles.instructionText}>
                  Selecione um cliente para visualizar a última venda
                </Text>
                <TouchableOpacity
                  style={styles.searchButtonLarge}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={styles.searchButtonLargeText}>
                    🔍 Pesquisar Cliente
                  </Text>
                </TouchableOpacity>
              </View>
            ) : loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.white} />
                <Text style={styles.loadingText}>Carregando...</Text>
              </View>
            ) : (
              <>
                {/* Card do Cliente Selecionado */}
                <View style={styles.clienteCard}>
                  <View style={styles.clienteHeader}>
                    <Text style={styles.clienteLabel}>Cliente Selecionado</Text>
                    <TouchableOpacity
                      style={styles.trocarButton}
                      onPress={limparSelecao}
                    >
                      <Text style={styles.trocarButtonText}>Trocar</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.clienteNome}>
                    {clienteSelecionado.nom_pessoa}
                  </Text>
                  <Text style={styles.clienteInfo}>
                    Código: {clienteSelecionado.cod_pessoa}
                  </Text>
                  {clienteSelecionado.num_cnpj && (
                    <Text style={styles.clienteInfo}>
                      CNPJ/CPF: {clienteSelecionado.num_cnpj}
                    </Text>
                  )}
                </View>

                {venda ? (
                  <>
                    {/* Card da Nota Fiscal */}
                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>Dados da Nota Fiscal</Text>

                      <View style={styles.row}>
                        <Text style={styles.label}>Nota Fiscal:</Text>
                        <Text style={styles.value}>{venda.num_nota}</Text>
                      </View>

                      <View style={styles.row}>
                        <Text style={styles.label}>Data Emissão:</Text>
                        <Text style={styles.value}>{venda.dta_emissao}</Text>
                      </View>

                      {venda.des_condicao_pagamento && (
                        <View style={styles.row}>
                          <Text style={styles.label}>Condição Pgto:</Text>
                          <Text style={styles.value}>
                            {venda.des_condicao_pagamento}
                          </Text>
                        </View>
                      )}

                      <View style={styles.divider} />

                      <View style={styles.row}>
                        <Text style={styles.labelTotal}>Valor Total:</Text>
                        <Text style={styles.valueTotal}>
                          {formatCurrency(venda.val_total)}
                        </Text>
                      </View>
                    </View>

                    {/* Card dos Itens */}
                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>
                        Itens ({venda.qtd_itens})
                      </Text>

                      {venda.itens.map((item, index) => (
                        <View key={index} style={styles.itemCard}>
                          <Text style={styles.itemNome}>{item.des_item}</Text>

                          <View style={styles.itemRow}>
                            <Text style={styles.itemLabel}>Código:</Text>
                            <Text style={styles.itemValue}>
                              {item.cod_item}
                            </Text>
                          </View>

                          <View style={styles.itemRow}>
                            <Text style={styles.itemLabel}>Quantidade:</Text>
                            <Text style={styles.itemValue}>
                              {item.qtd_item} {item.des_unidade}
                            </Text>
                          </View>

                          <View style={styles.itemRow}>
                            <Text style={styles.itemLabel}>Valor Unit.:</Text>
                            <Text style={styles.itemValue}>
                              {formatCurrency(item.val_unitario)}
                            </Text>
                          </View>

                          <View style={styles.itemDivider} />

                          <View style={styles.itemRow}>
                            <Text style={styles.itemLabelTotal}>
                              Total Item:
                            </Text>
                            <Text style={styles.itemValueTotal}>
                              {formatCurrency(item.val_total_item)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      Nenhuma venda encontrada para este cliente
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>

        {/* Modal de Pesquisa de Cliente */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => {
                setModalVisible(false);
                setTermoPesquisa("");
                setClientes([]);
              }}
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Pesquisar Cliente</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setModalVisible(false);
                    setTermoPesquisa("");
                    setClientes([]);
                  }}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Digite código, nome ou CNPJ do cliente..."
                  placeholderTextColor={colors.mediumGray}
                  value={termoPesquisa}
                  onChangeText={setTermoPesquisa}
                  returnKeyType="search"
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {pesquisando && termoPesquisa.trim().length >= 2 && (
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                    style={styles.searchLoading}
                  />
                )}
              </View>

              {termoPesquisa.trim().length < 2 ? (
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListText}>
                    Digite pelo menos 2 caracteres para pesquisar
                  </Text>
                </View>
              ) : pesquisando ? (
                <View style={styles.loadingModal}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingModalText}>Pesquisando...</Text>
                </View>
              ) : (
                <FlatList
                  data={clientes}
                  keyExtractor={(item) => item.cod_pessoa.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.clienteItem}
                      onPress={() => selecionarCliente(item)}
                    >
                      <View style={styles.clienteItemContent}>
                        <Text style={styles.clienteItemNome}>
                          {item.nom_pessoa}
                        </Text>
                        <Text style={styles.clienteItemDetalhe}>
                          Código: {item.cod_pessoa}
                        </Text>
                        {item.num_cnpj && (
                          <Text style={styles.clienteItemDetalhe}>
                            CNPJ/CPF: {item.num_cnpj}
                          </Text>
                        )}
                        {item.nom_cidade && (
                          <Text style={styles.clienteItemDetalhe}>
                            Cidade: {item.nom_cidade}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyList}>
                      <Text style={styles.emptyListText}>
                        Nenhum cliente encontrado
                      </Text>
                    </View>
                  }
                  keyboardShouldPersistTaps="handled"
                />
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
    paddingVertical: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  selectionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  instructionText: {
    color: colors.white,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  searchButtonLarge: {
    backgroundColor: colors.white,
    borderRadius: 15,
    paddingVertical: 18,
    paddingHorizontal: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  searchButtonLargeText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "bold",
  },
  clienteCard: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clienteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  clienteLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
    textTransform: "uppercase",
  },
  trocarButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  trocarButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  clienteNome: {
    fontSize: 17,
    fontWeight: "bold",
    color: colors.darkGray,
    marginBottom: 4,
  },
  clienteInfo: {
    fontSize: 13,
    color: colors.mediumGray,
    marginBottom: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  loadingText: {
    color: colors.white,
    fontSize: 16,
    marginTop: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: colors.darkGray,
    fontWeight: "600",
  },
  value: {
    fontSize: 14,
    color: colors.darkGray,
    flex: 1,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: 12,
  },
  labelTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  valueTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  itemCard: {
    backgroundColor: colors.lightGray,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  itemNome: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemLabel: {
    fontSize: 13,
    color: colors.darkGray,
  },
  itemValue: {
    fontSize: 13,
    color: colors.darkGray,
    fontWeight: "600",
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.mediumGray,
    marginVertical: 8,
  },
  itemLabelTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary,
  },
  itemValueTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    color: colors.white,
    fontSize: 16,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.darkGray,
    fontWeight: "bold",
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 12,
    position: "relative",
  },
  searchInput: {
    backgroundColor: colors.lightGray,
    borderRadius: 10,
    padding: 14,
    paddingRight: 50,
    fontSize: 16,
    color: colors.darkGray,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  searchLoading: {
    position: "absolute",
    right: 28,
    top: 28,
  },
  loadingModal: {
    padding: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingModalText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.darkGray,
  },
  clienteItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  clienteItemContent: {
    flexDirection: "column",
  },
  clienteItemNome: {
    fontSize: 17,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 6,
  },
  clienteItemDetalhe: {
    fontSize: 14,
    color: colors.darkGray,
    marginTop: 2,
  },
  emptyList: {
    padding: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyListText: {
    fontSize: 15,
    color: colors.mediumGray,
    textAlign: "center",
    lineHeight: 22,
  },
});
