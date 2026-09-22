import React, {useState} from "react";
import { Image, Pressable, Text, ActivityIndicator, Alert, TextInput, Platform } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import styles from "../../../styles/styles";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ConfigScreen(){
  const handleLogout = async () => {
  try {
    await AsyncStorage.multiRemove(['@session_token', '@user_token', '@user_name']);
    
    router.replace('/telas/(auth)/login');
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
  }
};
return(
    <SafeAreaView style={[styles.container, styles.center]}>
          <Text style={[styles.textTitle]}>Essa é a página de configurações</Text>
          <Text style={[styles.textMain]}>
            Configure suas coisas aqui bla bla bla mto chato
          </Text>
      <Pressable onPress={handleLogout} style={styles.button}>
        <Text>Sair da Conta</Text>
      </Pressable>
    </SafeAreaView>
);
}