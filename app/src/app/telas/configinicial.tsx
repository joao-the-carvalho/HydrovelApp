import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Image, Platform, Alert,
  KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// Chave fake para o protótipo (sem sensores ligados)
const CHAVE_TESTE = 'TEST-KEY-PROTOTIPO-001';

export default function ConfigInicialScreen() {
  const [chave, setChave] = useState('');

  const salvarEEntrar = async (chaveFinal: string) => {
    await AsyncStorage.setItem('@sensor_key', chaveFinal);
    await AsyncStorage.setItem('@configured', 'true');
    router.replace('/telas/(app)');
  };

  const handleSalvar = () => {
    if (!chave.trim()) {
      Alert.alert('Erro', 'Informe a chave do sensor.');
      return;
    }
    salvarEEntrar(chave.trim());
  };

  const handleTeste = () => {
    Alert.alert(
      'Chave de teste',
      'O protótipo ainda não tem sensores ligados. Usar uma chave de teste para navegar no app?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Usar teste', onPress: () => salvarEEntrar(CHAVE_TESTE) },
      ]
    );
  };

  return (
    <SafeAreaView style={st.container} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={st.flex}
      >
        <ScrollView contentContainerStyle={st.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={st.logoBox}>
            <Image source={require('../assets/image.png')} style={st.logo} resizeMode="contain" />
            <Text style={st.titulo}>Configuração Inicial</Text>
            <Text style={st.subtitulo}>
              Conecte seu primeiro sensor. Informe a chave gerada no código do ESP.
            </Text>
          </View>

          <View style={st.card}>
            <Text style={st.label}>Chave do Sensor</Text>
            <TextInput
              style={st.input}
              value={chave}
              onChangeText={setChave}
              placeholder="Ex: 8F3A-2B1C-..."
              placeholderTextColor="#BBB"
              autoCapitalize="none"
            />

            <Pressable style={st.btnPrimario} onPress={handleSalvar}>
              <Text style={st.btnPrimarioTexto}>Salvar e continuar</Text>
            </Pressable>

            <View style={st.divRow}>
              <View style={st.div} />
              <Text style={st.divTexto}>ou</Text>
              <View style={st.div} />
            </View>

            <Pressable style={st.btnSecundario} onPress={handleTeste}>
              <Text style={st.btnSecundarioTexto}>Usar chave de teste (protótipo)</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoBox: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 110, height: 110, marginBottom: 16 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },
  subtitulo: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 21, paddingHorizontal: 10 },
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 22,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    backgroundColor: '#ECEFF3', borderRadius: 12, padding: 14, fontSize: 16, color: '#333', marginBottom: 18,
  },
  btnPrimario: {
    backgroundColor: '#1E88E5', borderRadius: 12, padding: 15, alignItems: 'center',
  },
  btnPrimarioTexto: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  divRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  div: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  divTexto: { marginHorizontal: 12, color: '#999', fontSize: 14 },
  btnSecundario: {
    borderWidth: 1, borderColor: '#1E88E5', borderRadius: 12, padding: 15, alignItems: 'center',
  },
  btnSecundarioTexto: { color: '#1E88E5', fontSize: 16, fontWeight: '600' },
});