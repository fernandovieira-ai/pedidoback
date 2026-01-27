import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * TELA TEMPORÁRIA PARA LIMPAR ASYNCSTORAGE
 *
 * USO:
 * 1. Importe esta tela em App.tsx
 * 2. Adicione ao Stack Navigator
 * 3. Acesse a tela no app
 * 4. Pressione "Limpar Storage"
 * 5. Remova esta tela depois
 */

export const ResetStorageScreen = () => {
  const handleClearStorage = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert(
        'Sucesso!',
        'AsyncStorage limpo! Feche e reabra o app.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível limpar o storage');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset AsyncStorage</Text>
      <Text style={styles.subtitle}>
        Isso vai limpar todos os dados salvos do app
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleClearStorage}>
        <Text style={styles.buttonText}>🗑️ Limpar Storage</Text>
      </TouchableOpacity>
      <Text style={styles.warning}>
        ⚠️ Após limpar, feche completamente o app e reabra
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  warning: {
    marginTop: 20,
    fontSize: 12,
    color: '#dc2626',
    textAlign: 'center',
  },
});
