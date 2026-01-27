/**
 * ⚠️ SCRIPT DE EMERGÊNCIA - Limpar AsyncStorage Corrompido
 *
 * Execute este arquivo ANTES de iniciar o app se o erro persistir:
 *
 * node clear-async-storage.js
 */

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("\n========================================");
console.log("🧹 LIMPAR ASYNCSTORAGE - AppPedido");
console.log("========================================\n");
console.log("⚠️ INSTRUÇÕES PARA LIMPAR O STORAGE:\n");
console.log("1. No CELULAR, abra o Expo Go");
console.log("2. Vá em: Menu (três pontos) > Settings");
console.log('3. Toque em "Clear AsyncStorage"');
console.log("4. OU desinstale o Expo Go e reinstale\n");
console.log("========================================\n");
console.log("📱 ALTERNATIVA - Limpar dados do app:\n");
console.log("Android:");
console.log("  Configurações > Apps > Expo Go > ");
console.log("  Armazenamento > Limpar dados\n");
console.log("iOS:");
console.log("  Desinstalar e reinstalar o Expo Go\n");
console.log("========================================\n");

rl.question("Pressione ENTER para continuar...", () => {
  console.log("\n✅ Após limpar, execute: npm start\n");
  rl.close();
});
