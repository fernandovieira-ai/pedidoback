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
  FlatList,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../styles/colors";
import { listarPedidos, PedidoResumo } from "../services/pedidoService";
import { pesquisarClientes, Cliente } from "../services/clienteService";
import { formatDate, formatCurrency } from "../utils/formatters";

interface ListarPedidosScreenProps {
  navigation: any;
  route: any;
}

export default function ListarPedidosScreen({
  navigation,
  route,
}: ListarPedidosScreenProps) {
  const { usuario, cnpj, schema, empresa } = route.params || {};

  // Estados principais
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Estados de filtros
  const [modalFiltrosVisible, setModalFiltrosVisible] = useState(false);
  const [filtroCliente, setFiltroCliente] = useState<Cliente | null>(null);
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "pendentes" | "enviados">("pendentes");
  const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
  const [showDatePickerFim, setShowDatePickerFim] = useState(false);
  const [selectedDateInicio, setSelectedDateInicio] = useState(new Date());
  const [selectedDateFim, setSelectedDateFim] = useState(new Date());

  // Estados de seleção de cliente
  const [modalClienteVisible, setModalClienteVisible] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [termoPesquisaCliente, setTermoPesquisaCliente] = useState("");
  const [pesquisandoClientes, setPesquisandoClientes] = useState(false);

  // Carregar pedidos sempre que a tela ganhar foco (após criação/edição/exclusão)
  useFocusEffect(
    useCallback(() => {
      carregarPedidos();
    }, [])
  );

  // Carregar pedidos
  const carregarPedidos = async () => {
    if (!schema || !empresa) {
      Alert.alert("Erro", "Dados incompletos. Faça login novamente.");
      return;
    }

    try {
      setLoading(true);
      const resultado = await listarPedidos({
        schema,
        cod_empresa: empresa.cod_empresa,
        usuario,
        cod_cliente: filtroCliente?.cod_pessoa,
        data_inicio: filtroDataInicio,
        data_fim: filtroDataFim,
        apenas_pendentes: filtroStatus === "pendentes",
      });

      if (resultado.success && resultado.data) {
        // Filtrar pedidos enviados se necessário
        let pedidosFiltrados = resultado.data;
        if (filtroStatus === "enviados") {
          pedidosFiltrados = resultado.data.filter(
            (p) => p.ind_sincronizado === "S"
          );
        }
        setPedidos(pedidosFiltrados);
      } else {
        Alert.alert("Erro", resultado.message || "Erro ao carregar pedidos");
        setPedidos([]);
      }
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      Alert.alert("Erro", "Erro ao carregar pedidos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    carregarPedidos();
  };

  // Pesquisar clientes
  const handlePesquisarClientes = async (termo: string) => {
    if (!schema) return;

    try {
      setPesquisandoClientes(true);
      const response = await pesquisarClientes(schema, usuario, termo, 100, 0);

      if (response.success && response.data) {
        setClientes(response.data);
      } else {
        setClientes([]);
      }
    } catch (error) {
      console.error("Erro ao pesquisar clientes:", error);
      setClientes([]);
    } finally {
      setPesquisandoClientes(false);
    }
  };

  // Abrir modal de clientes
  const abrirModalCliente = async () => {
    setModalClienteVisible(true);
    await handlePesquisarClientes("");
  };

  // Selecionar cliente
  const selecionarCliente = (cliente: Cliente) => {
    setFiltroCliente(cliente);
    setModalClienteVisible(false);
  };

  // Limpar filtro de cliente
  const limparFiltroCliente = () => {
    setFiltroCliente(null);
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    setModalFiltrosVisible(false);
    carregarPedidos();
  };

  // Limpar todos os filtros
  const limparFiltros = () => {
    setFiltroCliente(null);
    setFiltroDataInicio("");
    setFiltroDataFim("");
    setFiltroStatus("pendentes");
    setModalFiltrosVisible(false);
    setTimeout(() => carregarPedidos(), 100);
  };

  // Manipular data início
  const handleDateSelectInicio = (event: any, date?: Date) => {
    setShowDatePickerInicio(Platform.OS === "ios");

    if (date) {
      setSelectedDateInicio(date);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      setFiltroDataInicio(`${day}/${month}/${year}`);
    }
  };

  // Manipular data fim
  const handleDateSelectFim = (event: any, date?: Date) => {
    setShowDatePickerFim(Platform.OS === "ios");

    if (date) {
      setSelectedDateFim(date);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      setFiltroDataFim(`${day}/${month}/${year}`);
    }
  };

  // Navegar para detalhes
  const verDetalhes = (pedido: PedidoResumo) => {
    navigation.navigate("DetalhesPedido", {
      ...route.params,
      pedido,
    });
  };

  // Renderizar item do pedido
  const renderPedidoItem = ({ item }: { item: PedidoResumo }) => (
    <TouchableOpacity
      style={styles.pedidoCard}
      onPress={() => verDetalhes(item)}
    >
      <View style={styles.pedidoHeader}>
        <View style={styles.pedidoNumeroContainer}>
          <Text style={styles.pedidoNumero}>Pedido #{item.seq_pedido}</Text>
          {item.ind_sincronizado === 'N' && (
            <View style={styles.badgePendente}>
              <Text style={styles.badgePendenteTexto}>Pendente</Text>
            </View>
          )}
          {item.ind_sincronizado === 'S' && (
            <View style={styles.badgeEnviado}>
              <Text style={styles.badgeEnviadoTexto}>Enviado</Text>
            </View>
          )}
        </View>
        <Text style={styles.pedidoData}>{item.dat_pedido}</Text>
      </View>

      <View style={styles.pedidoBody}>
        <Text style={styles.pedidoCliente}>{item.cliente}</Text>
        <Text style={styles.pedidoInfo}>
          Qtd Itens: {item.qtd_itens} | Entrega: {item.dat_entrega}
        </Text>
      </View>

      <View style={styles.pedidoFooter}>
        <Text style={styles.pedidoTotal}>{formatCurrency(item.val_total)}</Text>
        <Text style={styles.pedidoSeta}>›</Text>
      </View>
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>Listar Pedidos</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setModalFiltrosVisible(true)}
          >
            <Text style={styles.filterIcon}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Pedidos */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.white} />
            <Text style={styles.loadingText}>Carregando pedidos...</Text>
          </View>
        ) : (
          <FlatList
            data={pedidos}
            keyExtractor={(item) => item.seq_pedido.toString()}
            renderItem={renderPedidoItem}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhum pedido encontrado</Text>
                <Text style={styles.emptySubtext}>
                  {filtroCliente || filtroDataInicio || filtroDataFim
                    ? "Tente ajustar os filtros"
                    : "Crie um novo pedido para começar"}
                </Text>
              </View>
            }
          />
        )}

        {/* Modal de Filtros */}
        <Modal
          visible={modalFiltrosVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalFiltrosVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filtros</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalFiltrosVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalScrollContent}>
                {/* Filtro por Cliente */}
                <View style={styles.filtroGroup}>
                  <Text style={styles.filtroLabel}>Cliente:</Text>
                  {filtroCliente ? (
                    <View style={styles.clienteSelecionado}>
                      <Text style={styles.clienteSelecionadoNome}>
                        {filtroCliente.nom_pessoa}
                      </Text>
                      <TouchableOpacity onPress={limparFiltroCliente}>
                        <Text style={styles.clienteRemover}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.selecionarButton}
                      onPress={abrirModalCliente}
                    >
                      <Text style={styles.selecionarButtonText}>
                        Selecionar Cliente
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Filtro por Data Início */}
                <View style={styles.filtroGroup}>
                  <Text style={styles.filtroLabel}>Data Início:</Text>
                  <View style={styles.dateInputContainer}>
                    <TextInput
                      style={styles.dateInput}
                      placeholder="DD/MM/AAAA"
                      placeholderTextColor={colors.mediumGray}
                      value={filtroDataInicio}
                      onChangeText={(text) =>
                        setFiltroDataInicio(formatDate(text))
                      }
                      keyboardType="numeric"
                      maxLength={10}
                    />
                    <TouchableOpacity
                      style={styles.calendarButton}
                      onPress={() => setShowDatePickerInicio(true)}
                    >
                      <Text style={styles.calendarIcon}>📅</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Filtro por Data Fim */}
                <View style={styles.filtroGroup}>
                  <Text style={styles.filtroLabel}>Data Fim:</Text>
                  <View style={styles.dateInputContainer}>
                    <TextInput
                      style={styles.dateInput}
                      placeholder="DD/MM/AAAA"
                      placeholderTextColor={colors.mediumGray}
                      value={filtroDataFim}
                      onChangeText={(text) =>
                        setFiltroDataFim(formatDate(text))
                      }
                      keyboardType="numeric"
                      maxLength={10}
                    />
                    <TouchableOpacity
                      style={styles.calendarButton}
                      onPress={() => setShowDatePickerFim(true)}
                    >
                      <Text style={styles.calendarIcon}>📅</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Filtro de Status */}
                <View style={styles.filtroGroup}>
                  <Text style={styles.filtroLabel}>Status do Pedido:</Text>
                  <View style={styles.statusButtonsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        filtroStatus === "todos" && styles.statusButtonActive,
                      ]}
                      onPress={() => setFiltroStatus("todos")}
                    >
                      <Text
                        style={[
                          styles.statusButtonText,
                          filtroStatus === "todos" && styles.statusButtonTextActive,
                        ]}
                      >
                        Todos
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        filtroStatus === "pendentes" && styles.statusButtonActive,
                      ]}
                      onPress={() => setFiltroStatus("pendentes")}
                    >
                      <Text
                        style={[
                          styles.statusButtonText,
                          filtroStatus === "pendentes" &&
                            styles.statusButtonTextActive,
                        ]}
                      >
                        Pendentes
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        filtroStatus === "enviados" && styles.statusButtonActive,
                      ]}
                      onPress={() => setFiltroStatus("enviados")}
                    >
                      <Text
                        style={[
                          styles.statusButtonText,
                          filtroStatus === "enviados" &&
                            styles.statusButtonTextActive,
                        ]}
                      >
                        Enviados
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.filtroDescricao}>
                    {filtroStatus === "todos" && "Mostrando todos os pedidos"}
                    {filtroStatus === "pendentes" &&
                      "Mostrando apenas pedidos pendentes (padrão)"}
                    {filtroStatus === "enviados" &&
                      "Mostrando apenas pedidos enviados"}
                  </Text>
                </View>

                {/* DatePickers */}
                {showDatePickerInicio && (
                  <DateTimePicker
                    value={selectedDateInicio}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleDateSelectInicio}
                    locale="pt-BR"
                  />
                )}

                {showDatePickerFim && (
                  <DateTimePicker
                    value={selectedDateFim}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleDateSelectFim}
                    locale="pt-BR"
                  />
                )}

                {/* Botões */}
                <View style={styles.botoesContainer}>
                  <TouchableOpacity
                    style={[styles.botaoFiltro, styles.botaoLimpar]}
                    onPress={limparFiltros}
                  >
                    <Text style={styles.botaoLimparText}>Limpar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.botaoFiltro, styles.botaoAplicar]}
                    onPress={aplicarFiltros}
                  >
                    <Text style={styles.botaoAplicarText}>Aplicar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal de Seleção de Cliente */}
        <Modal
          visible={modalClienteVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalClienteVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecionar Cliente</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalClienteVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Campo de pesquisa */}
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Pesquisar cliente..."
                  placeholderTextColor={colors.mediumGray}
                  value={termoPesquisaCliente}
                  onChangeText={(text) => {
                    setTermoPesquisaCliente(text);
                    handlePesquisarClientes(text);
                  }}
                  autoFocus
                />
              </View>

              {/* Lista de clientes */}
              {pesquisandoClientes ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
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
                      <Text style={styles.clienteItemNome}>
                        {item.nom_pessoa}
                      </Text>
                      <Text style={styles.clienteItemCnpj}>
                        {item.num_cnpj}
                      </Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        Nenhum cliente encontrado
                      </Text>
                    </View>
                  }
                />
              )}
            </View>
          </View>
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
  filterButton: {
    padding: 5,
  },
  filterIcon: {
    fontSize: 20,
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
  listContent: {
    padding: 16,
  },
  pedidoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pedidoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pedidoNumeroContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pedidoNumero: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  badgePendente: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgePendenteTexto: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "600",
  },
  badgeEnviado: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeEnviadoTexto: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "600",
  },
  pedidoData: {
    fontSize: 12,
    color: colors.darkGray,
  },
  pedidoBody: {
    marginBottom: 8,
  },
  pedidoCliente: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  pedidoInfo: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  pedidoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: 8,
  },
  pedidoTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  pedidoSeta: {
    fontSize: 24,
    color: colors.mediumGray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: "100%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.darkGray,
  },
  modalScrollContent: {
    padding: 20,
  },
  filtroGroup: {
    marginBottom: 20,
  },
  filtroLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.darkGray,
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  filtroDescricao: {
    fontSize: 12,
    color: colors.mediumGray,
    fontStyle: "italic",
    marginTop: 8,
  },
  statusButtonsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.mediumGray,
    backgroundColor: colors.white,
    alignItems: "center",
  },
  statusButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.darkGray,
  },
  statusButtonTextActive: {
    color: colors.white,
  },
  clienteSelecionado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.lightGray,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  clienteSelecionadoNome: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  clienteRemover: {
    fontSize: 18,
    color: colors.error,
    fontWeight: "bold",
  },
  selecionarButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  selecionarButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateInput: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  calendarButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarIcon: {
    fontSize: 20,
  },
  botoesContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  botaoFiltro: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  botaoLimpar: {
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  botaoLimparText: {
    color: colors.darkGray,
    fontSize: 15,
    fontWeight: "600",
  },
  botaoAplicar: {
    backgroundColor: colors.primary,
  },
  botaoAplicarText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  searchInput: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  clienteItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  clienteItemNome: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  clienteItemCnpj: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
