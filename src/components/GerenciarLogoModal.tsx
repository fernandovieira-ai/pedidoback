import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../styles/colors";
import { EmpresaLogo } from "./EmpresaLogo";
import {
  verificarPermissaoAlterarLogo,
  uploadLogo,
} from "../services/logoService";

interface GerenciarLogoModalProps {
  visible: boolean;
  onClose: () => void;
  schema: string;
  cod_usuario: string;
  logoAtual?: string;
  nomeEmpresa?: string;
  onLogoAtualizada: (novaLogoUrl: string) => void;
}

export const GerenciarLogoModal = ({
  visible,
  onClose,
  schema,
  cod_usuario,
  logoAtual,
  nomeEmpresa,
  onLogoAtualizada,
}: GerenciarLogoModalProps) => {
  const [temPermissao, setTemPermissao] = useState(false);
  const [verificandoPermissao, setVerificandoPermissao] = useState(true);
  const [fazendoUpload, setFazendoUpload] = useState(false);
  const [novaLogoPreview, setNovaLogoPreview] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    if (visible) {
      verificarPermissao();
    }
  }, [visible]);

  const verificarPermissao = async () => {
    setVerificandoPermissao(true);
    try {
      const response = await verificarPermissaoAlterarLogo(schema, cod_usuario);
      if (response.success && response.data) {
        setTemPermissao(response.data.tem_permissao);
      } else {
        setTemPermissao(false);
      }
    } catch (error) {
      console.error("Erro ao verificar permissão:", error);
      setTemPermissao(false);
    } finally {
      setVerificandoPermissao(false);
    }
  };

  const solicitarPermissaoCamera = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão Negada",
          "Precisamos de permissão para acessar suas fotos!"
        );
        return false;
      }
    }
    return true;
  };

  const selecionarImagem = async () => {
    const temPermissaoGaleria = await solicitarPermissaoCamera();
    if (!temPermissaoGaleria) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setNovaLogoPreview(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Erro ao selecionar imagem:", error);
      Alert.alert("Erro", "Erro ao selecionar imagem");
    }
  };

  const confirmarUpload = async () => {
    if (!novaLogoPreview) {
      Alert.alert("Erro", "Selecione uma imagem primeiro");
      return;
    }

    Alert.alert(
      "Confirmar Upload",
      "Deseja realmente alterar a logo da empresa?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: realizarUpload,
        },
      ]
    );
  };

  const realizarUpload = async () => {
    if (!novaLogoPreview) return;

    setFazendoUpload(true);
    try {
      // Extrair nome e tipo do arquivo
      const fileName = `logo_${Date.now()}.jpg`;
      const mimeType = "image/jpeg";

      const response = await uploadLogo(
        schema,
        novaLogoPreview,
        fileName,
        mimeType
      );

      if (response.success && response.data) {
        Alert.alert("Sucesso", "Logo atualizada com sucesso!");
        onLogoAtualizada(response.data.logo_url);
        setNovaLogoPreview(undefined);
        onClose();
      } else {
        Alert.alert("Erro", response.message);
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      Alert.alert("Erro", "Erro ao fazer upload da logo");
    } finally {
      setFazendoUpload(false);
    }
  };

  const cancelarSelecao = () => {
    setNovaLogoPreview(undefined);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Gerenciar Logo</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {verificandoPermissao ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Verificando permissões...</Text>
            </View>
          ) : !temPermissao ? (
            <View style={styles.semPermissaoContainer}>
              <Text style={styles.semPermissaoIcon}>🔒</Text>
              <Text style={styles.semPermissaoTexto}>
                Você não tem permissão para alterar a logo da empresa.
              </Text>
              <Text style={styles.semPermissaoSubtexto}>
                Apenas usuários autorizados podem fazer essa alteração.
              </Text>
              <TouchableOpacity onPress={onClose}>
                <LinearGradient
                  colors={[colors.buttonGradientStart, colors.buttonGradientEnd]}
                  style={styles.botaoFechar}
                >
                  <Text style={styles.botaoFecharTexto}>Fechar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.conteudo}>
              {/* Logo Atual */}
              <View style={styles.logoSection}>
                <Text style={styles.sectionTitle}>Logo Atual</Text>
                <EmpresaLogo
                  logoUrl={logoAtual}
                  nomeEmpresa={nomeEmpresa}
                  size={120}
                  style={styles.logoPreview}
                />
              </View>

              {/* Nova Logo Preview */}
              {novaLogoPreview && (
                <View style={styles.logoSection}>
                  <Text style={styles.sectionTitle}>Nova Logo</Text>
                  <EmpresaLogo
                    logoUrl={novaLogoPreview}
                    nomeEmpresa={nomeEmpresa}
                    size={120}
                    style={styles.logoPreview}
                  />
                </View>
              )}

              {/* Botões */}
              <View style={styles.botoesContainer}>
                {!novaLogoPreview ? (
                  <TouchableOpacity
                    onPress={selecionarImagem}
                    disabled={fazendoUpload}
                  >
                    <LinearGradient
                      colors={[
                        colors.buttonGradientStart,
                        colors.buttonGradientEnd,
                      ]}
                      style={styles.botao}
                    >
                      <Text style={styles.botaoTexto}>
                        📷 Selecionar Nova Logo
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={confirmarUpload}
                      disabled={fazendoUpload}
                    >
                      <LinearGradient
                        colors={["#10b981", "#059669"]}
                        style={styles.botao}
                      >
                        {fazendoUpload ? (
                          <ActivityIndicator color={colors.white} />
                        ) : (
                          <Text style={styles.botaoTexto}>✓ Confirmar Upload</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={cancelarSelecao}
                      disabled={fazendoUpload}
                      style={styles.botaoCancelar}
                    >
                      <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Informações */}
              <View style={styles.infoContainer}>
                <Text style={styles.infoTexto}>
                  💡 A logo deve ser quadrada (1:1) para melhor visualização
                </Text>
                <Text style={styles.infoTexto}>
                  📏 Tamanho recomendado: 512x512 pixels
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    maxWidth: 500,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.white,
    fontWeight: "bold",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textSecondary,
  },
  semPermissaoContainer: {
    padding: 40,
    alignItems: "center",
  },
  semPermissaoIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  semPermissaoTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 10,
  },
  semPermissaoSubtexto: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 30,
  },
  botaoFechar: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  botaoFecharTexto: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  conteudo: {
    padding: 20,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  logoPreview: {
    marginVertical: 10,
  },
  botoesContainer: {
    marginBottom: 20,
  },
  botao: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  botaoTexto: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  botaoCancelar: {
    paddingVertical: 12,
    alignItems: "center",
  },
  botaoCancelarTexto: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  infoContainer: {
    backgroundColor: colors.lightGray,
    padding: 16,
    borderRadius: 10,
  },
  infoTexto: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
});
