# Instruções para Agentes de IA - AppPedidoExpo

## Visão Geral da Arquitetura

Este é um aplicativo React Native/Expo para pedidos B2B com autenticação multi-tenant baseada em CNPJ/schema. A arquitetura segue um padrão de **autenticação em duas etapas**:

1. **Validação de CNPJ** → obtém o schema do tenant
2. **Login com credenciais** → autentica usuário no schema específico

### Estrutura de Diretórios

```
src/
├── config/       # Configurações de API e ambiente
├── screens/      # Telas da aplicação (Login, Dashboard, AddPedido)
├── services/     # Lógica de negócio e integração com API
├── styles/       # Sistema de cores e estilos compartilhados
└── utils/        # Utilitários (formatters, validators, helpers)
```

## Padrões Críticos do Projeto

### 1. Configuração de API Multi-Plataforma

O arquivo [src/config/api.ts](src/config/api.ts) usa detecção de plataforma para URLs de API:

- **Android físico**: Usa `LOCAL_NETWORK_IP` (ex: `192.168.100.12:3000`)
- **Android Emulator**: Deve usar `10.0.2.2` (localhost do PC host)
- **iOS Simulator**: Usa `localhost`

**Ao adicionar novos endpoints**, seguir o padrão:
```typescript
export const API_ENDPOINTS = {
  recurso: {
    list: '/recurso',
    create: '/recurso',
    update: (id: string) => `/recurso/${id}`,
  },
};
```

### 2. Serviço de Armazenamento Local

[src/services/storageService.ts](src/services/storageService.ts) gerencia AsyncStorage com prefixo `@AppPedido:`:

- **Token de autenticação**: `saveAuthToken()`, `getAuthToken()`
- **Dados do usuário**: `saveUserData({ usuario, cnpj, schema })`
- **Preferências**: `saveCNPJData()`, `saveRememberMe()`, `savePassword()`

**Importante**: Ao adicionar novas chaves de storage, atualizar o objeto `STORAGE_KEYS`.

### 3. Fluxo de Autenticação

O [LoginScreen](src/screens/LoginScreen.tsx) implementa um wizard de 2 etapas:

```typescript
type LoginStep = 'cnpj' | 'credentials';

// Etapa 1: Validar CNPJ e obter schema
const response = await validateCNPJ(cnpjNumbers);
setCNPJData({ cnpj: response.data.cnpj, schema: response.data.schema });

// Etapa 2: Login com credenciais no schema específico
await loginUser(cnpj, schema, usuario, senha);
```

**Ao modificar o login**, preservar:
- Formatação automática de CNPJ durante digitação (`formatCNPJ`)
- Salvamento de CNPJ validado para próxima sessão
- Timeout de 10 segundos com `AbortController`

### 4. Sistema de Cores

[src/styles/colors.ts](src/styles/colors.ts) define o tema roxo da DigitalRF:

```typescript
primary: '#24024b',
secondary: '#4a0e78',
gradientStart: '#24024b',
gradientEnd: '#4a0e78',
```

**Importante**: Usar `LinearGradient` com `gradientStart`/`gradientEnd` para backgrounds de telas.

## Utilitários de Formatação

[src/utils/formatters.ts](src/utils/formatters.ts) fornece funções de formatação para:

- **CNPJ**: `formatCNPJ()`, `unformatCNPJ()` - Formato: 00.000.000/0000-00
- **CPF**: `formatCPF()`, `unformatCPF()` - Formato: 000.000.000-00
- **Telefone**: `formatPhone()`, `unformatPhone()` - Formatos: (00) 0000-0000 ou (00) 00000-0000
- **CEP**: `formatCEP()`, `unformatCEP()` - Formato: 00000-000
- **Data**: `formatDate()`, `unformatDate()` - Formato: DD/MM/AAAA
- **Moeda**: `formatCurrency(value)` - Formato: R$ 1.234,56
- **Decimal**: `formatDecimal(value, decimals)` - Formato: 1.234,56

**Ao usar formatadores em inputs**, aplicar durante `onChangeText` para formatação automática.

## Comandos de Desenvolvimento

```bash
# Iniciar servidor Expo
npm start

# Executar no Android
npm run android

# Executar no iOS
npm run ios

# Executar na Web
npm run web
```

**Observação**: O projeto usa Expo SDK ~54.0 com React 19.1.0 e React Native 0.81.5.

## Convenções de Código

1. **TypeScript Strict Mode**: Sempre tipar props, estados e responses de API
2. **Interfaces de Response**: Seguir padrão `{ success: boolean, message: string, data?: T }`
3. **Error Handling**: Usar try/catch em services, retornar objetos com `success: false`
4. **Component Props**: Definir interface com sufixo `Props` (ex: `LoginScreenProps`)
5. **Async/Await**: Preferir sobre Promises para código de services
6. **Export Pattern**: Screens usam `export default function`, services usam `export const`
7. **Modal Pattern**: Modais de pesquisa/seleção devem ter `animationType="slide"`, `transparent={true}` e overlay com `rgba(0, 0, 0, 0.5)`
8. **Validações de Formulário**: Sempre validar campos obrigatórios antes de submit, usando `Alert.alert` para erros

## Padrões de UI/UX

### Telas de Formulário

**Estrutura padrão** (ver [AddPedidoScreen](src/screens/AddPedidoScreen.tsx)):
```typescript
<LinearGradient colors={[colors.gradientStart, colors.gradientEnd]}>
  <SafeAreaView>
    <View style={styles.header}>
      <TouchableOpacity onPress={handleCancel}>← Voltar</TouchableOpacity>
      <Text>Título da Tela</Text>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled">
      <View style={styles.formCard}>
        {/* Campos do formulário */}
      </View>
    </ScrollView>
  </SafeAreaView>
</LinearGradient>
```

**Ao criar formulários**:
- Usar `keyboardShouldPersistTaps="handled"` no ScrollView
- Card branco (`backgroundColor: colors.white`) com `borderRadius: 15`
- Botões de ação no rodapé: Cancelar (à esquerda) + Salvar (à direita)
- Mostrar `ActivityIndicator` no botão de submit durante loading
- Desabilitar campos com `editable={!loading}` durante submit

### Modal de Pesquisa/Seleção

**Padrão para modais de pesquisa** (ver [AddPedidoScreen](src/screens/AddPedidoScreen.tsx)):
```typescript
<Modal visible={modalVisible} animationType="slide" transparent={true}>
  <View style={styles.modalOverlay}> {/* rgba(0, 0, 0, 0.5) */}
    <View style={styles.modalContent}> {/* borderTopRadius: 20 */}
      {/* Header com título + botão X */}
      {/* Campo de pesquisa + botão 🔍 */}
      <FlatList
        data={resultados}
        renderItem={({ item }) => <TouchableOpacity onPress={() => selecionar(item)} />}
        ListEmptyComponent={<Text>Mensagem quando vazio</Text>}
      />
    </View>
  </View>
</Modal>
```

**Importante**: 
- Modal deve ocupar 80% da altura (`maxHeight: '80%'`)
- Adicionar `paddingBottom` para iOS safe area
- Input de pesquisa deve ter `autoFocus={true}`

## Integrações Externas

- **AsyncStorage**: Persistência local de dados do usuário
- **React Navigation**: Stack Navigator para navegação entre telas
- **Expo Linear Gradient**: Backgrounds com gradiente roxo corporativo

## Dependências Backend

A API backend (não incluída neste repo) deve implementar:

- `POST /api/auth/validate-cnpj`: Retorna `{ cnpj, schema }`
- `POST /api/auth/login`: Retorna `{ usuario, cnpj, schema, token }`
- `POST /api/clientes/pesquisar`: Requer `{ schema, termo }` no body

**Ao criar novas features**, sempre incluir o `schema` nas requisições multi-tenant.
