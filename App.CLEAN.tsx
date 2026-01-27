import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>✅ Teste Básico OK</Text>
        <Text style={styles.subtext}>React Native puro funcionando</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#22c55e",
  },
  subtext: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
});
