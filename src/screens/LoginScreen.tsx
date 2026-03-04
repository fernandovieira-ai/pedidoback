import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../styles/colors";
import { validateCNPJ, loginUser } from "../services/authService";
import {
  saveAuthToken,
  saveUserData,
  saveRememberMe,
  saveCNPJData,
  getCNPJData,
  removeCNPJData,
  savePassword,
  getSavedPassword,
  removeSavedPassword,
  saveUsername,
  getSavedUsername,
  removeSavedUsername,
  saveRememberPassword,
  getRememberPassword,
  clearAllStorage,
} from "../services/storageService";
import { formatCNPJ, unformatCNPJ } from "../utils/formatters";
import { EmpresaLogo } from "../components/EmpresaLogo";

type LoginStep = "cnpj" | "credentials";

interface CNPJData {
  cnpj: string;
  schema: string;
  logo_url?: string;
  nome_empresa?: string;
}

interface LoginScreenProps {
  navigation?: any;
}

export const LoginScreen = ({ navigation }: LoginScreenProps) => {
  // Estados principais
  const [loginStep, setLoginStep] = useState<LoginStep>("cnpj");
  const [loading, setLoading] = useState<boolean>(false);
  const [mensagem, setMensagem] = useState("");
  const [mensagemTipo, setMensagemTipo] = useState<"erro" | "sucesso" | "">("");

  // Etapa 1: CNPJ
  const [cnpj, setCNPJ] = useState("");
  const [cnpjData, setCNPJData] = useState<CNPJData | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [nomeEmpresa, setNomeEmpresa] = useState<string | undefined>(undefined);

  // Etapa 2: Credenciais
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState<boolean>(false);
  const [salvarSenha, setSalvarSenha] = useState<boolean>(false);
  const [mostrarSenha, setMostrarSenha] = useState<boolean>(false);

  // useEffect: Carregar CNPJ e senha salvos ao montar componente
  useEffect(() => {
    carregarDadosSalvos();
  }, []);

  // Função para carregar dados salvos
  const carregarDadosSalvos = async () => {
    try {
      // Carregar CNPJ salvo
      const cnpjSalvo = await getCNPJData();
      if (cnpjSalvo) {
        setCNPJ(formatCNPJ(cnpjSalvo.cnpj));
        setCNPJData(cnpjSalvo);
        setLogoUrl(cnpjSalvo.logo_url);
        setNomeEmpresa(cnpjSalvo.nome_empresa);
        setLoginStep("credentials"); // Pula direto para credenciais
      }

      // Carregar usuário e senha salvos
      const usuarioSalvo = await getSavedUsername();
      const senhaSalva = await getSavedPassword();
      const lembrarSenha = await getRememberPassword();

      // getRememberPassword já retorna boolean corretamente
      if (lembrarSenha === true && usuarioSalvo && senhaSalva) {
        setUsuario(usuarioSalvo);
        setSenha(senhaSalva);
        setSalvarSenha(true);
      }
    } catch (error) {
      console.error("⚠️ ERRO ao carregar dados salvos:", error);
      // Se houver erro, limpar storage corrompido automaticamente
      console.log("🧹 Limpando AsyncStorage corrompido...");
      try {
        await clearAllStorage();
        console.log("✅ Storage limpo - App vai recarregar normalmente");
      } catch (cleanError) {
        console.error("❌ Erro ao limpar storage:", cleanError);
      }
    }
  };

  // Handler: Formatar CNPJ enquanto digita
  const handleCNPJChange = (text: string) => {
    const formatted = formatCNPJ(text);
    setCNPJ(formatted);
  };

  // Handler: Validar CNPJ
  const handleValidateCNPJ = async () => {
    setMensagem("");
    setMensagemTipo("");

    // Usar apenas números para validação
    const cnpjNumbers = unformatCNPJ(cnpj);

    if (!cnpjNumbers || cnpjNumbers.length === 0) {
      setMensagem("Por favor, informe o CNPJ");
      setMensagemTipo("erro");
      return;
    }

    if (cnpjNumbers.length !== 14) {
      setMensagem("CNPJ deve ter 14 dígitos");
      setMensagemTipo("erro");
      return;
    }

    setLoading(true);
    try {
      const response = await validateCNPJ(cnpjNumbers);

      if (response.success && response.data) {
        const cnpjDataToSave = {
          cnpj: response.data.cnpj,
          schema: response.data.schema,
          logo_url: response.data.logo_url,
          nome_empresa: response.data.nome_empresa,
        };

        setCNPJData(cnpjDataToSave);
        setLogoUrl(response.data.logo_url);
        setNomeEmpresa(response.data.nome_empresa);

        // Salvar CNPJ validado para próximas vezes
        await saveCNPJData(cnpjDataToSave);

        setLoginStep("credentials");
        setMensagem("");
      } else {
        setMensagem(response.message || "Erro ao validar CNPJ");
        setMensagemTipo("erro");
      }
    } catch (error) {
      setMensagem("Erro de conexão com o servidor");
      setMensagemTipo("erro");
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Fazer login
  const handleLogin = async () => {
    setMensagem("");
    setMensagemTipo("");

    if (!usuario || !senha) {
      setMensagem("Por favor, preencha todos os campos");
      setMensagemTipo("erro");
      return;
    }

    if (!cnpjData) {
      setMensagem("Erro: CNPJ não validado");
      setMensagemTipo("erro");
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser(
        cnpjData.cnpj,
        cnpjData.schema,
        usuario,
        senha
      );

      if (response.success && response.data) {
        // Salvar token de autenticação
        if (response.data.token) {
          await saveAuthToken(response.data.token);
        }

        // Atualizar logo_url e nome_empresa nos estados locais
        const logoAtualizado = response.data.logo_url || logoUrl;
        const nomeEmpresaAtualizado = response.data.nome_empresa || nomeEmpresa;

        // Atualizar CNPJ_DATA com logo e nome atualizados
        await saveCNPJData({
          cnpj: response.data.cnpj,
          schema: response.data.schema,
          logo_url: logoAtualizado,
          nome_empresa: nomeEmpresaAtualizado,
        });

        // Salvar dados do usuário
        await saveUserData({
          usuario: response.data.usuario,
          cod_usuario: response.data.cod_usuario,
          cnpj: response.data.cnpj,
          schema: response.data.schema,
          logo_url: logoAtualizado,
          nome_empresa: nomeEmpresaAtualizado,
        });

        // Salvar preferência "Lembrar-me"
        await saveRememberMe(lembrar);

        // Salvar ou remover usuário e senha conforme checkbox
        if (salvarSenha) {
          await saveUsername(usuario);
          await savePassword(senha);
          await saveRememberPassword(true);
        } else {
          await removeSavedUsername();
          await removeSavedPassword();
          await saveRememberPassword(false);
        }

        setMensagem("Login realizado com sucesso!");
        setMensagemTipo("sucesso");

        // Aguardar 1 segundo e navegar para o dashboard
        setTimeout(() => {
          if (navigation) {
            navigation.navigate("Dashboard");
          }
        }, 1000);
      } else {
        setMensagem(response.message || "Erro ao fazer login");
        setMensagemTipo("erro");
      }
    } catch (error) {
      setMensagem("Erro de conexão com o servidor");
      setMensagemTipo("erro");
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Alterar CNPJ (limpar CNPJ salvo)
  const handleAlterarCNPJ = async () => {
    try {
      await removeCNPJData();
      setCNPJ("");
      setCNPJData(null);
      setLogoUrl(undefined);
      setNomeEmpresa(undefined);
      setLoginStep("cnpj");
      setUsuario("");
      setSenha("");
      setMensagem("");
      setMensagemTipo("");
    } catch (error) {
      console.error("Erro ao limpar CNPJ:", error);
    }
  };

  // Handler: Voltar para tela de CNPJ (sem limpar CNPJ salvo)
  const handleBackToCNPJ = () => {
    setLoginStep("cnpj");
    setUsuario("");
    setSenha("");
    setMensagem("");
    setMensagemTipo("");
  };

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.loginBox}>
            {/* Header */}
            <View style={styles.loginHeader}>
              <View style={styles.logoContainer}>
                <EmpresaLogo
                  logoUrl={logoUrl}
                  nomeEmpresa={nomeEmpresa}
                  size={100}
                />
              </View>
              <Text style={styles.title}>
                {nomeEmpresa || "DIGITALRF"}
              </Text>
              <Text style={styles.subtitle}>
                {loginStep === "cnpj"
                  ? "Informe seu CNPJ para acessar"
                  : "Faça login para acessar"}
              </Text>
            </View>

            {/* Step 1: CNPJ Validation */}
            {loginStep === "cnpj" && (
              <View style={styles.form}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>CNPJ</Text>
                  <TextInput
                    style={styles.input}
                    value={cnpj}
                    onChangeText={handleCNPJChange}
                    placeholder="00.000.000/0000-00"
                    keyboardType="numeric"
                    editable={!loading}
                    maxLength={18}
                  />
                  <Text style={styles.helperText}>Ex: 53.865.832/0001-37</Text>
                </View>

                <TouchableOpacity
                  onPress={handleValidateCNPJ}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={[
                      colors.buttonGradientStart,
                      colors.buttonGradientEnd,
                    ]}
                    style={styles.button}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.buttonText} />
                    ) : (
                      <Text style={styles.buttonText}>Validar CNPJ</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {mensagem !== "" && (
                  <View
                    style={[
                      styles.mensagem,
                      mensagemTipo === "erro"
                        ? styles.mensagemErro
                        : styles.mensagemSucesso,
                    ]}
                  >
                    <Text
                      style={[
                        styles.mensagemText,
                        mensagemTipo === "erro"
                          ? styles.mensagemTextErro
                          : styles.mensagemTextSucesso,
                      ]}
                    >
                      {mensagem}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Step 2: Credentials */}
            {loginStep === "credentials" && cnpjData && (
              <View style={styles.form}>
                {/* CNPJ Display com botão Alterar */}
                <View style={styles.cnpjDisplayContainer}>
                  <View style={styles.cnpjDisplay}>
                    <Text style={styles.cnpjLabel}>CNPJ Selecionado:</Text>
                    <Text style={styles.cnpjValue}>
                      {formatCNPJ(cnpjData.cnpj)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleAlterarCNPJ}
                    disabled={loading}
                    style={styles.alterarCNPJButton}
                  >
                    <Text style={styles.alterarCNPJText}>Alterar CNPJ</Text>
                  </TouchableOpacity>
                </View>

                {/* Campo Usuário */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Usuário</Text>
                  <TextInput
                    style={styles.input}
                    value={usuario}
                    onChangeText={setUsuario}
                    placeholder="Digite seu usuário"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>

                {/* Campo Senha */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Senha</Text>
                  <View style={styles.senhaContainer}>
                    <TextInput
                      style={styles.senhaInput}
                      value={senha}
                      onChangeText={setSenha}
                      placeholder="Digite sua senha"
                      secureTextEntry={!mostrarSenha}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      style={styles.senhaToggleButton}
                      onPress={() => setMostrarSenha(!mostrarSenha)}
                      disabled={loading}
                    >
                      <Text style={styles.senhaToggleIcon}>
                        {mostrarSenha ? "👁️" : "👁️‍🗨️"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Checkbox Salvar senha */}
                <TouchableOpacity
                  style={styles.checkboxGroup}
                  onPress={() => setSalvarSenha((prev) => Boolean(!prev))}
                  disabled={loading}
                >
                  <View
                    style={[
                      styles.checkbox,
                      salvarSenha && styles.checkboxChecked,
                    ]}
                  >
                    {salvarSenha && <Text style={styles.checkboxMark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Salvar senha</Text>
                </TouchableOpacity>

                {/* Checkbox Lembrar-me */}
                <TouchableOpacity
                  style={styles.checkboxGroup}
                  onPress={() => setLembrar((prev) => !prev)}
                  disabled={loading}
                >
                  <View
                    style={[styles.checkbox, lembrar && styles.checkboxChecked]}
                  >
                    {lembrar && <Text style={styles.checkboxMark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Lembrar-me</Text>
                </TouchableOpacity>

                {/* Botão Login */}
                <TouchableOpacity onPress={handleLogin} disabled={loading}>
                  <LinearGradient
                    colors={[
                      colors.buttonGradientStart,
                      colors.buttonGradientEnd,
                    ]}
                    style={styles.button}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.buttonText} />
                    ) : (
                      <Text style={styles.buttonText}>Entrar</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Mensagem */}
                {mensagem !== "" && (
                  <View
                    style={[
                      styles.mensagem,
                      mensagemTipo === "erro"
                        ? styles.mensagemErro
                        : styles.mensagemSucesso,
                    ]}
                  >
                    <Text
                      style={[
                        styles.mensagemText,
                        mensagemTipo === "erro"
                          ? styles.mensagemTextErro
                          : styles.mensagemTextSucesso,
                      ]}
                    >
                      {mensagem}
                    </Text>
                  </View>
                )}

                {/* Botão Voltar */}
                <TouchableOpacity
                  onPress={handleBackToCNPJ}
                  disabled={loading}
                  style={styles.backButtonContainer}
                >
                  <Text style={styles.backButton}>← Voltar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Footer */}
            <View style={styles.loginFooter}>
              <TouchableOpacity>
                <Text style={styles.linkRecuperar}>Esqueceu a senha?</Text>
              </TouchableOpacity>

              {/* Botão de Emergência - Limpar Storage */}
              <TouchableOpacity
                onPress={async () => {
                  Alert.alert(
                    "Limpar Dados",
                    "Isso vai apagar todos os dados salvos (CNPJ, usuário, senha). Continuar?",
                    [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Limpar",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            await clearAllStorage();
                            Alert.alert(
                              "Sucesso",
                              "Dados limpos! Recarregue o app.",
                              [{ text: "OK" }]
                            );
                            // Resetar estados locais
                            setCNPJ("");
                            setCNPJData(null);
                            setUsuario("");
                            setSenha("");
                            setSalvarSenha(false);
                            setLembrar(false);
                            setLoginStep("cnpj");
                          } catch (error) {
                            Alert.alert("Erro", "Não foi possível limpar os dados");
                          }
                        },
                      },
                    ]
                  );
                }}
                style={styles.emergencyButton}
              >
                <Text style={styles.emergencyButtonText}>
                  🔧 Problemas? Clique aqui
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
    paddingTop: 40,
    paddingBottom: 40,
  },
  loginBox: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  loginHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoContainer: {
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 100,
    height: 100,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: colors.gradientStart,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textWhite,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textSecondary,
  },
  form: {
    width: "100%",
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textLabel,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    fontSize: 14,
    backgroundColor: colors.inputBackground,
    color: colors.inputText,
    fontWeight: "500",
  },
  senhaContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    position: "relative",
  },
  senhaInput: {
    flex: 1,
    padding: 12,
    paddingRight: 50,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    fontSize: 14,
    backgroundColor: colors.inputBackground,
    color: colors.inputText,
    fontWeight: "500",
  },
  senhaToggleButton: {
    position: "absolute",
    right: 0,
    height: "100%",
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  senhaToggleIcon: {
    fontSize: 20,
  },
  helperText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  cnpjDisplayContainer: {
    marginBottom: 16,
  },
  cnpjDisplay: {
    backgroundColor: colors.inputBackground,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  cnpjLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 3,
  },
  cnpjValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  alterarCNPJButton: {
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  alterarCNPJText: {
    fontSize: 12,
    color: colors.link,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  checkboxGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 3,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.buttonGradientStart,
    borderColor: colors.buttonGradientStart,
  },
  checkboxMark: {
    color: colors.textWhite,
    fontSize: 10,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 13,
    color: colors.textLabel,
  },
  button: {
    width: "100%",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.buttonGradientStart,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: colors.buttonText,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  mensagem: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  mensagemErro: {
    backgroundColor: colors.errorBackground,
    borderColor: colors.errorBorder,
  },
  mensagemSucesso: {
    backgroundColor: colors.successBackground,
    borderColor: colors.successBorder,
  },
  mensagemText: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500",
  },
  mensagemTextErro: {
    color: colors.errorText,
  },
  mensagemTextSucesso: {
    color: colors.successText,
  },
  loginFooter: {
    alignItems: "center",
    marginTop: 16,
  },
  linkRecuperar: {
    color: colors.link,
    fontSize: 13,
    fontWeight: "500",
  },
  backButtonContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  backButton: {
    color: colors.link,
    fontSize: 13,
    fontWeight: "500",
  },
  emergencyButton: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  emergencyButtonText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "400",
    textDecorationLine: "underline",
  },
});
