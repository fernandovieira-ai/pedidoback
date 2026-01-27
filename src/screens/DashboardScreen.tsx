import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../styles/colors";
import {
  getUserData,
  clearAllStorage,
  clearSessionData,
  UserData,
  getSelectedEmpresa,
  saveSelectedEmpresa,
  EmpresaData,
} from "../services/storageService";
import { listarEmpresas, Empresa } from "../services/empresaService";

interface DashboardScreenProps {
  navigation?: any;
}

export const DashboardScreen = ({ navigation }: DashboardScreenProps) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [empresaSelecionada, setEmpresaSelecionada] =
    useState<EmpresaData | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [modalEmpresaVisible, setModalEmpresaVisible] = useState(false);
  const [carregandoEmpresas, setCarregandoEmpresas] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await getUserData();
      setUserData(data);

      // Carregar empresa salva
      const empresaSalva = await getSelectedEmpresa();
      if (empresaSalva) {
        setEmpresaSelecionada(empresaSalva);
      } else if (data?.schema) {
        // Se não tiver empresa salva, buscar e selecionar automaticamente a primeira
        await carregarEmpresas(data.schema, true);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  const carregarEmpresas = async (schema: string, autoSelect = false) => {
    try {
      setCarregandoEmpresas(true);
      const response = await listarEmpresas(schema);

      if (response.success && response.data) {
        setEmpresas(response.data);

        // Auto selecionar primeira empresa se solicitado e não tiver empresa selecionada
        if (autoSelect && !empresaSelecionada && response.data.length > 0) {
          const primeiraEmpresa = response.data[0];
          setEmpresaSelecionada(primeiraEmpresa);
          await saveSelectedEmpresa(primeiraEmpresa);
        }
      } else {
        Alert.alert("Erro", response.message);
      }
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
      Alert.alert("Erro", "Erro ao carregar empresas");
    } finally {
      setCarregandoEmpresas(false);
    }
  };

  const abrirSelecaoEmpresa = async () => {
    if (userData?.schema) {
      await carregarEmpresas(userData.schema);
      setModalEmpresaVisible(true);
    }
  };

  const selecionarEmpresa = async (empresa: Empresa) => {
    setEmpresaSelecionada(empresa);
    await saveSelectedEmpresa(empresa);
    setModalEmpresaVisible(false);
    Alert.alert("Sucesso", `Empresa "${empresa.nom_fantasia}" selecionada`);
  };

  const handleLogout = async () => {
    try {
      // Limpa apenas dados da sessão, mantém CNPJ e credenciais salvas
      await clearSessionData();
      // Navegar de volta para a tela de login
      if (navigation) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      }
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>LOGO</Text>
            </View>
            <Text style={styles.title}>DIGITALRF</Text>
            <Text style={styles.subtitle}>Dashboard</Text>
          </View>

          {/* Informações do Usuário */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bem-vindo!</Text>

            {userData && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Usuário:</Text>
                  <Text style={styles.infoValue}>{userData.usuario}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>CNPJ:</Text>
                  <Text style={styles.infoValue}>{userData.cnpj}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Schema:</Text>
                  <Text style={styles.infoValue}>{userData.schema}</Text>
                </View>

                {/* Empresa Selecionada */}
                <View style={styles.empresaSection}>
                  <View style={styles.empresaHeader}>
                    <Text style={styles.empresaLabel}>Empresa:</Text>
                    <TouchableOpacity
                      style={styles.trocarEmpresaButton}
                      onPress={abrirSelecaoEmpresa}
                    >
                      <Text style={styles.trocarEmpresaText}>
                        {empresaSelecionada ? "Trocar" : "Selecionar"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {empresaSelecionada ? (
                    <View style={styles.empresaInfo}>
                      <Text style={styles.empresaNome}>
                        {empresaSelecionada.nom_fantasia}
                      </Text>
                      <Text style={styles.empresaDetalhe}>
                        {empresaSelecionada.nom_razao_social}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.empresaPlaceholder}>
                      Nenhuma empresa selecionada
                    </Text>
                  )}
                </View>
              </>
            )}
          </View>

          {/* Área de Funcionalidades */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Funcionalidades</Text>

            {/* Botão Novo Pedido */}
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() =>
                navigation?.navigate("AddPedido", {
                  ...userData,
                  empresa: empresaSelecionada,
                })
              }
              disabled={!empresaSelecionada}
            >
              <View style={styles.menuButtonContent}>
                <Text style={styles.menuIcon}>📝</Text>
                <Text style={styles.menuButtonText}>Novo Pedido</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            {/* Botão Listar Pedidos */}
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() =>
                navigation?.navigate("ListarPedidos", {
                  ...userData,
                  empresa: empresaSelecionada,
                })
              }
              disabled={!empresaSelecionada}
            >
              <View style={styles.menuButtonContent}>
                <Text style={styles.menuIcon}>📋</Text>
                <Text style={styles.menuButtonText}>Listar Pedidos</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            {/* Botão Última Venda */}
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() =>
                navigation?.navigate("UltimaVenda", {
                  ...userData,
                })
              }
            >
              <View style={styles.menuButtonContent}>
                <Text style={styles.menuIcon}>🛒</Text>
                <Text style={styles.menuButtonText}>Última Venda</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <Text style={styles.cardText}>Em breve mais funcionalidades:</Text>
            <Text style={styles.bulletPoint}>• Relatórios</Text>
            <Text style={styles.bulletPoint}>• Configurações</Text>
            <Text style={styles.bulletPoint}>• E muito mais...</Text>
          </View>

          {/* Botão Logout */}
          <TouchableOpacity onPress={handleLogout}>
            <LinearGradient
              colors={["#dc2626", "#b91c1c"]}
              style={styles.logoutButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoutButtonText}>Sair</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        {/* Modal de Seleção de Empresa */}
        <Modal
          visible={modalEmpresaVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalEmpresaVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Header do Modal */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecionar Empresa</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalEmpresaVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Loading */}
              {carregandoEmpresas ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Carregando empresas...</Text>
                </View>
              ) : (
                <FlatList
                  data={empresas}
                  keyExtractor={(item) => item.cod_empresa.toString()}
                  style={styles.empresasList}
                  contentContainerStyle={styles.empresasContent}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.empresaItem,
                        empresaSelecionada?.cod_empresa === item.cod_empresa &&
                          styles.empresaItemSelecionada,
                      ]}
                      onPress={() => selecionarEmpresa(item)}
                    >
                      <View style={styles.empresaItemContent}>
                        <Text style={styles.empresaItemNome}>
                          {item.nom_fantasia}
                        </Text>
                        <Text style={styles.empresaItemDetalhe}>
                          {item.nom_razao_social}
                        </Text>
                        <Text style={styles.empresaItemDetalhe}>
                          CNPJ: {item.num_cnpj_cpf}
                        </Text>
                      </View>
                      {empresaSelecionada?.cod_empresa === item.cod_empresa && (
                        <Text style={styles.checkIcon}>✓</Text>
                      )}
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        Nenhuma empresa cadastrada
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.gradientStart,
  },
  loadingText: {
    color: colors.textWhite,
    fontSize: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textWhite,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textWhite,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textLabel,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  empresaSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  empresaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  empresaLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  trocarEmpresaButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trocarEmpresaText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  empresaInfo: {
    backgroundColor: colors.lightGray,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  empresaNome: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 2,
  },
  empresaDetalhe: {
    fontSize: 12,
    color: colors.darkGray,
  },
  empresaPlaceholder: {
    fontSize: 14,
    color: colors.mediumGray,
    fontStyle: "italic",
    paddingVertical: 12,
  },
  bulletPoint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
    paddingLeft: 8,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textWhite,
  },
  menuArrow: {
    fontSize: 24,
    color: colors.textWhite,
    fontWeight: "bold",
  },
  logoutButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#dc2626",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 10,
  },
  logoutButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: "600",
  },
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: "100%",
    height: "70%",
    flex: 1,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
  },
  closeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "bold",
  },
  empresasList: {
    flex: 1,
  },
  empresasContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  empresaItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.lightGray,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  empresaItemSelecionada: {
    borderColor: colors.primary,
    backgroundColor: "#f0e6ff",
  },
  empresaItemContent: {
    flex: 1,
  },
  empresaItemNome: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  empresaItemDetalhe: {
    fontSize: 13,
    color: colors.darkGray,
    marginBottom: 2,
  },
  checkIcon: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: "bold",
    marginLeft: 10,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: colors.mediumGray,
    textAlign: "center",
  },
});
