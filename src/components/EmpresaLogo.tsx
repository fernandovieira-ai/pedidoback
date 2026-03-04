import React, { useState } from "react";
import { View, Image, Text, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../styles/colors";

interface EmpresaLogoProps {
  logoUrl?: string;
  nomeEmpresa?: string;
  size?: number;
  style?: ViewStyle;
}

export const EmpresaLogo = ({
  logoUrl,
  nomeEmpresa = "LOGO",
  size = 100,
  style,
}: EmpresaLogoProps) => {
  const [imageError, setImageError] = useState(false);

  // Se não tem URL ou deu erro ao carregar, mostra placeholder
  const showPlaceholder = !logoUrl || imageError;

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      {showPlaceholder ? (
        // Placeholder quando não tem logo
        <View
          style={[
            styles.placeholder,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.placeholderText, { fontSize: size * 0.24 }]}>
            {nomeEmpresa ? nomeEmpresa.substring(0, 4).toUpperCase() : "LOGO"}
          </Text>
        </View>
      ) : (
        // Logo da empresa
        <Image
          source={{ uri: logoUrl }}
          style={[styles.logo, { width: size, height: size, borderRadius: size / 2 }]}
          resizeMode="contain"
          onError={() => setImageError(true)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    backgroundColor: colors.white,
  },
  placeholder: {
    backgroundColor: colors.gradientStart,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontWeight: "bold",
    color: colors.textWhite,
  },
});
