import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from "../styles/styles";

export default function InitialRoute() {
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Busca a chave padronizada @session_token
        const token = await AsyncStorage.getItem('@session_token');

        if (token) {
          router.replace('/telas/(app)');
        } else {
          router.replace('/telas/(auth)/login');
        }
      } catch (error) {
        console.error("Erro ao verificar token:", error);
        router.replace('/telas/(auth)/login');
      }
    };

    checkAuthStatus();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}