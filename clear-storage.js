// Script temporário para limpar AsyncStorage
// Execute: node clear-storage.js

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function clearAll() {
  try {
    console.log('🧹 Limpando AsyncStorage...');
    await AsyncStorage.clear();
    console.log('✅ AsyncStorage limpo com sucesso!');
    console.log('📱 Reinicie o app para aplicar as mudanças');
  } catch (error) {
    console.error('❌ Erro ao limpar AsyncStorage:', error);
  }
}

// Nota: Este script não funcionará diretamente no Node.js
// Use o console do React Native Debugger ou adicione um botão no app para limpar
console.log('⚠️ Este é um script de referência');
console.log('🔧 Para limpar o AsyncStorage:');
console.log('1. Fechar completamente o app');
console.log('2. Limpar cache do Expo: npx expo start --clear');
console.log('3. Ou desinstalar e reinstalar o app');
