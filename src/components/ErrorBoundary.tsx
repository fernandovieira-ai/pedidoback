import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - Captura erros de renderização
 *
 * Isso previne que o app crashe completamente quando
 * houver dados corrompidos no AsyncStorage
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ ErrorBoundary capturou erro:', error);
    console.error('📋 Info:', errorInfo);

    // Se for erro de tipo boolean, limpar storage automaticamente
    if (error.message.includes('boolean') || error.message.includes('Boolean')) {
      console.log('🧹 Detectado erro de tipo boolean - limpando storage...');
      this.clearStorageAndReload();
    }
  }

  clearStorageAndReload = async () => {
    try {
      await AsyncStorage.clear();
      console.log('✅ Storage limpo');
      // Resetar estado
      this.setState({ hasError: false, error: null });
    } catch (error) {
      console.error('❌ Erro ao limpar storage:', error);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.title}>Erro no Aplicativo</Text>
            <Text style={styles.message}>
              Detectamos um problema com os dados salvos.
            </Text>

            {this.state.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {this.state.error.message}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={this.clearStorageAndReload}
            >
              <Text style={styles.buttonText}>
                🔧 Corrigir Automaticamente
              </Text>
            </TouchableOpacity>

            <Text style={styles.hint}>
              Isso vai limpar os dados salvos e recarregar o app
            </Text>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: '#fee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    fontSize: 11,
    color: '#c00',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    marginTop: 16,
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
});
