import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from "../../../styles/styles";

export default function NotificacoesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.textTitle}>Notificações</Text>
      <Text style={styles.textMain}>Sua central de alertas de vazamento e qualidade.</Text>
    </SafeAreaView>
  );
}