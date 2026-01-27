import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅ App Funcionando!</Text>
      <Text style={styles.subtext}>Se você vê isso, o erro foi isolado</Text>
      <Text style={styles.info}>Próximo passo: reativar navegação</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#22c55e",
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: "#666",
  },
  info: {
    fontSize: 14,
    color: "#999",
    marginTop: 20,
  },
});
