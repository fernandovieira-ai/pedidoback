import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { LoginScreen } from "./src/screens/LoginScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import AddPedidoScreen from "./src/screens/AddPedidoScreen";
import ListarPedidosScreen from "./src/screens/ListarPedidosScreen";
import DetalhesPedidoScreen from "./src/screens/DetalhesPedidoScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="AddPedido" component={AddPedidoScreen} />
        <Stack.Screen name="ListarPedidos" component={ListarPedidosScreen} />
        <Stack.Screen name="DetalhesPedido" component={DetalhesPedidoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
