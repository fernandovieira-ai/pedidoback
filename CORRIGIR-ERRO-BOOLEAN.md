# 🔧 Como Corrigir o Erro: java.lang.String cannot be cast to java.lang.Boolean

## 📋 O Problema

O erro ocorre porque o AsyncStorage tinha valores string ("true"/"false") salvos onde o app espera boolean verdadeiro.

## ✅ Solução - Passo a Passo

### **Passo 1: Limpar AsyncStorage Corrompido**

1. **O app está configurado para abrir na tela de Reset**
2. **Recarregue o app:**
   ```bash
   # Pressione 'r' no terminal do Expo
   # OU
   npx expo start --clear
   ```

3. **No app, você verá uma tela com botão "🗑️ Limpar Storage"**
4. **Pressione o botão**
5. **Feche COMPLETAMENTE o app** (não apenas minimize)

### **Passo 2: Voltar App.tsx ao Normal**

Edite `App.tsx` e remova/comente estas linhas:

```typescript
// ANTES (estado atual):
import { ResetStorageScreen } from "./ResetStorageScreen"; // REMOVER

initialRouteName="ResetStorage"  // ALTERAR para "Login"

<Stack.Screen name="ResetStorage" component={ResetStorageScreen} />  // REMOVER
```

```typescript
// DEPOIS (voltar ao normal):
// import { ResetStorageScreen } from "./ResetStorageScreen";

initialRouteName="Login"  // ✅ Voltou ao normal

// <Stack.Screen name="ResetStorage" component={ResetStorageScreen} />
```

### **Passo 3: Reiniciar App Limpo**

```bash
# Parar Expo (Ctrl+C)

# Reiniciar com cache limpo
npx expo start --clear

# Pressionar 'i' para iOS ou 'a' para Android
```

### **Passo 4: Testar**

1. Faça login normalmente
2. O erro "java.lang.String cannot be cast to java.lang.Boolean" não deve mais aparecer
3. As correções de tipo já foram aplicadas no código

---

## 🔍 O Que Foi Corrigido no Código

1. **LoginScreen.tsx:**
   - Adicionados tipos explícitos `<boolean>` nos estados
   - Conversões `Boolean()` em todas as props

2. **storageService.ts:**
   - Funções `getRememberMe()` e `getRememberPassword()` agora garantem retorno boolean
   - Conversões para lidar com strings herdadas

3. **DashboardScreen.tsx:**
   - Já estava correto

---

## 🗑️ Limpeza Após Correção

Depois de confirmar que funciona, você pode:

1. **Deletar arquivos temporários:**
   - `ResetStorageScreen.tsx`
   - `clear-storage.js`
   - `CORRIGIR-ERRO-BOOLEAN.md` (este arquivo)

2. **Remover do App.tsx:**
   - Import do ResetStorageScreen
   - Stack.Screen do ResetStorage

---

## 🚨 Se o Erro Voltar

Se o erro aparecer novamente no futuro:

1. **Desinstalar app do dispositivo/simulador:**
   ```bash
   # Android
   adb uninstall com.anonymous.AppPedidoExpo

   # iOS Simulator
   xcrun simctl erase all
   ```

2. **Reinstalar:**
   ```bash
   npx expo start --clear
   ```

---

**Data:** 14/01/2026
**Erro:** java.lang.String cannot be cast to java.lang.Boolean
**Status:** ✅ CORRIGIDO
