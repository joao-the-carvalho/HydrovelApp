import React, { useState } from "react";
import { Image, Pressable, Text, TextInput, Platform, Alert, ActivityIndicator } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import layout from "../../../styles/styles";
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [email, onChangeEmail] = useState("");
  const [password, onChangePassword] = useState("");
  const [loading, setLoading] = useState(false);

  const getBaseUrl = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'web') {
      return 'http://localhost:3000'; 
    } else {
      return 'https://ideally-debtless-tiring.ngrok-free.dev'; 
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${getBaseUrl()}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          senha: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Salva exatamente a mesma chave consultada pelo index.tsx
        await AsyncStorage.setItem('@session_token', data.token);
        
        const nomeUsuario = data.user?.nome || data.nome || 'Usuário';
        await AsyncStorage.setItem('@user_name', nomeUsuario);

        Alert.alert("Sucesso", "Login realizado com sucesso!");
        router.replace('/telas/(app)');
      } else {
        // Exibe o motivo exato retornado pelo Node.js
        Alert.alert("Erro", data.message || "E-mail ou senha inválidos.");
      }
    } catch (error) {
      Alert.alert("Erro de conexão", "Não foi possível conectar ao servidor.");
      console.error("Erro no login:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={layout.container}>
        <SafeAreaView style={layout.center}>
          <Image
            source={require("../../assets/image.png")}
            style={layout.imageLocal}
            resizeMode="contain"
          />
          <Text style={layout.textMain}>Login</Text>
          <TextInput
            style={layout.input}
            onChangeText={onChangeEmail}
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="E-mail"
          />
          <TextInput
            style={layout.input}
            onChangeText={onChangePassword}
            value={password}
            secureTextEntry
            placeholder="Senha"
          />
          <Pressable 
            style={layout.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#000" /> : <Text>Fazer Login</Text>}
          </Pressable>
          <Text style={{ marginTop: 15 }}>Não tem uma conta?</Text>
          <Pressable 
            style={layout.button}
            onPress={() => router.replace('/telas/(auth)/signup')}
          >
            <Text>Faça registro!</Text>
          </Pressable>
        </SafeAreaView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}