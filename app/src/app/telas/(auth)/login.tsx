import React, { useState } from "react";
import {
  Image,
  Pressable,
  Text,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  View,
  StyleSheet
} from "react-native";
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
        await AsyncStorage.setItem('@session_token', data.token);
        const nomeUsuario = data.user?.nome || data.nome || 'Usuário';
        await AsyncStorage.setItem('@user_name', nomeUsuario);
        Alert.alert("Sucesso", "Login realizado com sucesso!");
        router.replace('/telas/(app)');
      } else {
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
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Área da Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/image.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Bem-vindo de volta</Text>
              <Text style={styles.subtitle}>Faça login para continuar</Text>
            </View>

            {/* Formulário */}
            <View style={styles.formContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>E-mail</Text>
                <TextInput
                  style={styles.input}
                  onChangeText={onChangeEmail}
                  value={email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Senha</Text>
                <TextInput
                  style={styles.input}
                  onChangeText={onChangePassword}
                  value={password}
                  secureTextEntry
                  autoComplete="password"
                  placeholder="••••••••"
                  placeholderTextColor="#999"
                />
              </View>

              <Pressable
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonTextPrimary}>Entrar</Text>
                )}
              </Pressable>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.divider} />
              </View>

              <Pressable
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => router.replace('/telas/(auth)/signup')}
              >
                <Text style={styles.buttonTextSecondary}>
                  Criar nova conta
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// estilos específicos da tela
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonPrimary: {
    backgroundColor: '#1E88E5',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1E88E5',
  },
  buttonTextPrimary: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#1E88E5',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#999',
    fontSize: 14,
  },
});