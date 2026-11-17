import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

type Sensor = {
  id: string;
  nome: string;       
  chave: string;      
  status: 'baixo' | 'alto'; // risco (atualizado pelo dashboard)
};

export default function ConfigScreen() {
  const router = useRouter();

  // ---- Estados ----
  const [sensores, setSensores] = useState<Sensor[]>([]);
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [emailUsuario, setEmailUsuario] = useState('');

  // Modal de sensor (add / edit)
  const [modalSensor, setModalSensor] = useState(false);
  const [modoSensor, setModoSensor] = useState<'add' | 'edit'>('add');
  const [sensorEmEdicao, setSensorEmEdicao] = useState<Sensor | null>(null);
  const [inputNomeSensor, setInputNomeSensor] = useState('');
  const [inputChaveSensor, setInputChaveSensor] = useState('');

  // Modal de campo simples (nome/email da conta)
  const [modalCampo, setModalCampo] = useState(false);
  const [tipoCampo, setTipoCampo] = useState<'nome' | 'email'>('nome');
  const [valorCampo, setValorCampo] = useState('');

  // Segurança
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [trocando, setTrocando] = useState(false);

  const getBaseUrl = () =>
    Platform.OS === 'ios' || Platform.OS === 'web'
      ? 'http://localhost:3000'
      : 'https://ideally-debtless-tiring.ngrok-free.dev';

  const getHeaders = async () => {
    const token = await AsyncStorage.getItem('@session_token');
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  };

  // ---- Carregamento inicial ----
  const carregarDados = useCallback(async () => {
    try {
      const [jsonSensores, nome, email] = await Promise.all([
        AsyncStorage.getItem('@sensors'),
        AsyncStorage.getItem('@user_name'),
        AsyncStorage.getItem('@user_email'),
      ]);
      setSensores(jsonSensores ? JSON.parse(jsonSensores) : []);
      setNomeUsuario(nome || 'Usuário');
      setEmailUsuario(email || 'email@exemplo.com');
    } catch (e) {
      console.error('Erro ao carregar dados locais:', e);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // ---- Persistência de sensores ----
  const salvarSensores = async (lista: Sensor[]) => {
    setSensores(lista);
    await AsyncStorage.setItem('@sensors', JSON.stringify(lista));
  };

  // ---- Modal de sensor ----
  const abrirModalAdd = () => {
    setModoSensor('add');
    setSensorEmEdicao(null);
    setInputNomeSensor('');
    setInputChaveSensor('');
    setModalSensor(true);
  };

  const abrirModalEdit = (sensor: Sensor) => {
    setModoSensor('edit');
    setSensorEmEdicao(sensor);
    setInputNomeSensor(sensor.nome);
    setInputChaveSensor(sensor.chave);
    setModalSensor(true);
  };

  const confirmarSensor = async () => {
    const nome = inputNomeSensor.trim();
    const chave = inputChaveSensor.trim();

    if (!nome || !chave) {
      Alert.alert('Erro', 'Preencha nome e chave do sensor.');
      return;
    }

    if (modoSensor === 'add') {
      // impede chave duplicada
      if (sensores.some((s) => s.chave === chave)) {
        Alert.alert('Erro', 'Já existe um sensor com essa chave.');
        return;
      }
      const novo: Sensor = {
        id: String(Date.now()),
        nome,
        chave,
        status: 'baixo',
      };
      await salvarSensores([...sensores, novo]);
    } else if (sensorEmEdicao) {
      const atualizado = sensores.map((s) =>
        s.id === sensorEmEdicao.id ? { ...s, nome, chave } : s
      );
      await salvarSensores(atualizado);
    }

    setModalSensor(false);
  };

  const removerSensor = (sensor: Sensor) => {
    Alert.alert(
      'Remover sensor',
      `Deseja remover "${sensor.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => salvarSensores(sensores.filter((s) => s.id !== sensor.id)),
        },
      ]
    );
  };

  // ---- Dashboard por sensor ----
  const acessarDashboard = (sensor: Sensor) => {
    // salva a chave "ativa" e passa como param para a tela de análise
    AsyncStorage.setItem('@active_sensor', JSON.stringify(sensor));
    router.push({
      pathname: '/telas/(app)/analise', // ajuste ao path real da sua tela de análise
      params: { chave: sensor.chave, nome: sensor.nome },
    });
  };

  // ---- Modal de campo (nome/email) ----
  const abrirModalCampo = (tipo: 'nome' | 'email') => {
    setTipoCampo(tipo);
    setValorCampo(tipo === 'nome' ? nomeUsuario : emailUsuario);
    setModalCampo(true);
  };

  const confirmarCampo = async () => {
    const valor = valorCampo.trim();
    if (!valor) return;
    if (tipoCampo === 'nome') {
      setNomeUsuario(valor);
      await AsyncStorage.setItem('@user_name', valor);
    } else {
      setEmailUsuario(valor);
      await AsyncStorage.setItem('@user_email', valor);
    }
    setModalCampo(false);
  };

  // ---- Trocar senha ----
  const handleTrocarSenha = async () => {
    if (!senhaAtual || !senhaNova || !confirmarSenha) {
      Alert.alert('Erro', 'Preencha todos os campos de senha.');
      return;
    }
    if (senhaNova !== confirmarSenha) {
      Alert.alert('Erro', 'A confirmação não coincide com a nova senha.');
      return;
    }
    if (senhaNova.length < 6) {
      Alert.alert('Erro', 'A nova senha deve ter ao menos 6 caracteres.');
      return;
    }

    setTrocando(true);
    try {
      const headers = await getHeaders();
      // Ajuste a rota conforme seu backend
      const response = await fetch(`${getBaseUrl()}/api/usuario/senha`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ senhaAtual, senhaNova }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        Alert.alert('Sucesso', 'Senha alterada com sucesso!');
        setSenhaAtual('');
        setSenhaNova('');
        setConfirmarSenha('');
      } else {
        Alert.alert('Erro', data.message || 'Não foi possível alterar a senha.');
      }
    } catch (e) {
      Alert.alert('Erro de conexão', 'Não foi possível conectar ao servidor.');
      console.error(e);
    } finally {
      setTrocando(false);
    }
  };

    const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['@session_token', '@user_token', '@user_name']);
      
      router.replace('/telas/(auth)/login');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
    };
  // ---- Ícones ----
  const IconeMais = () => (
    <Svg width="18" height="18" viewBox="0 0 24 24">
      <Path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#1E88E5" />
    </Svg>
  );
  const IconeLapis = () => (
    <Svg width="18" height="18" viewBox="0 0 24 24">
      <Path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#1E88E5" />
    </Svg>
  );
  const IconeX = () => (
    <Svg width="22" height="22" viewBox="0 0 24 24">
      <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#666" />
    </Svg>
  );

  return (
    <SafeAreaView style={st.container} edges={['top', 'left', 'right']}>
      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Adicionar sensor */}
        <Pressable style={st.btnAdicionar} onPress={abrirModalAdd}>
          <IconeMais />
          <Text style={st.btnAdicionarTexto}>Adicionar Sensor</Text>
        </Pressable>

        {/* Sensores cadastrados */}
        <View style={st.secaoHeader}>
          <Text style={st.secaoTitulo}>Sensores Cadastrados</Text>
          <Pressable style={st.filtros}>
            <Text style={st.filtrosTexto}>Filtros</Text>
          </Pressable>
        </View>

        {sensores.length === 0 ? (
          <View style={st.vazio}>
            <Text style={st.vazioTexto}>
              Nenhum sensor cadastrado ainda.{'\n'}Toque em "Adicionar Sensor" para começar.
            </Text>
          </View>
        ) : (
          sensores.map((sensor) => (
            <View key={sensor.id} style={st.cardSensor}>
              <View style={st.cardSensorTopo}>
                <View style={st.cardCol}>
                  <Text style={st.cardRotulo}>{sensor.nome}</Text>
                  <Text style={st.cardNome}>Sensor de Vazamento</Text>
                  <Pressable style={st.btnOutline} onPress={() => acessarDashboard(sensor)}>
                    <Text style={st.btnOutlineTexto}>Acessar Dashboard</Text>
                  </Pressable>
                </View>
                <View style={st.cardCol}>
                  <Text style={st.cardRotulo}>Status:</Text>
                  <View style={st.linhaStatus}>
                    <View
                      style={[
                        st.barraStatus,
                        { backgroundColor: sensor.status === 'baixo' ? '#4CAF50' : '#C62828' },
                      ]}
                    />
                    <Text style={st.textoStatus}>
                      {sensor.status === 'baixo'
                        ? 'Ativo, baixo risco de vazamento'
                        : 'Ativo, alto risco de contaminação'}
                    </Text>
                  </View>
                  <Pressable style={st.btnOutline} onPress={() => abrirModalEdit(sensor)}>
                    <Text style={st.btnOutlineTexto}>Atualizar Nome</Text>
                  </Pressable>
                </View>
              </View>
              <Pressable onPress={() => removerSensor(sensor)}>
                <Text style={st.linkRemover}>Remover sensor</Text>
              </Pressable>
            </View>
          ))
        )}

        {/* Informações da conta */}
        <Text style={st.secaoTitulo}>Informações da Conta</Text>
        <View style={st.cardConta}>
          <Text style={st.labelCampo}>Nome do Usuário</Text>
          <View style={st.linhaCampo}>
            <View style={st.campoRead}>
              <Text style={st.campoTexto}>{nomeUsuario}</Text>
            </View>
            <Pressable onPress={() => abrirModalCampo('nome')} style={st.btnLapis}>
              <IconeLapis />
            </Pressable>
          </View>

          <Text style={[st.labelCampo, { marginTop: 16 }]}>Email</Text>
          <View style={st.linhaCampo}>
            <View style={st.campoRead}>
              <Text style={st.campoTexto}>{emailUsuario}</Text>
            </View>
            <Pressable onPress={() => abrirModalCampo('email')} style={st.btnLapis}>
              <IconeLapis />
            </Pressable>
          </View>
        </View>

        {/* Segurança */}
        <Text style={st.secaoTitulo}>Informações de Segurança</Text>
        <View style={st.cardConta}>
          <Text style={st.labelCampo}>Senha Atual</Text>
          <TextInput
            style={st.input}
            value={senhaAtual}
            onChangeText={setSenhaAtual}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#BBB"
          />

          <Text style={[st.labelCampo, { marginTop: 14 }]}>Senha Nova</Text>
          <TextInput
            style={st.input}
            value={senhaNova}
            onChangeText={setSenhaNova}
            secureTextEntry
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#BBB"
          />

          <Text style={[st.labelCampo, { marginTop: 14 }]}>Confirmar Senha Nova</Text>
          <TextInput
            style={st.input}
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry
            placeholder="Repita a nova senha"
            placeholderTextColor="#BBB"
          />

          <Pressable
            style={[st.btnTrocando, trocando && { opacity: 0.6 }]}
            onPress={handleTrocarSenha}
            disabled={trocando}
          >
            <Text style={st.btnTrocandoTexto}>
              {trocando ? 'Salvando...' : 'Trocar de Senha'}
            </Text>
          </Pressable>
          <Pressable onPress={handleLogout} style={st.btnTrocando}>
            <Text>Sair da Conta</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ===== Modal Sensor (add/edit) ===== */}
      <Modal visible={modalSensor} transparent animationType="slide" onRequestClose={() => setModalSensor(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={st.modalOverlay}>
          <View style={st.modalContent}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitulo}>
                {modoSensor === 'add' ? 'Adicionar Sensor' : 'Atualizar Sensor'}
              </Text>
              <Pressable onPress={() => setModalSensor(false)}><IconeX /></Pressable>
            </View>

            <Text style={st.labelCampo}>Nome (local/pessoa)</Text>
            <TextInput
              style={st.input}
              value={inputNomeSensor}
              onChangeText={setInputNomeSensor}
              placeholder="Ex: Casa, Mãe, Escritório"
              placeholderTextColor="#BBB"
            />

            <Text style={[st.labelCampo, { marginTop: 14 }]}>Chave do Sensor</Text>
            <TextInput
              style={st.input}
              value={inputChaveSensor}
              onChangeText={setInputChaveSensor}
              placeholder="Chave gerada no ESP"
              placeholderTextColor="#BBB"
              autoCapitalize="none"
              editable={modoSensor === 'add'} // na edição, chave fica fixa
            />
            {modoSensor === 'edit' && (
              <Text style={st.dica}>A chave não pode ser alterada após o cadastro.</Text>
            )}

            <Pressable style={st.btnTrocando} onPress={confirmarSensor}>
              <Text style={st.btnTrocandoTexto}>
                {modoSensor === 'add' ? 'Cadastrar' : 'Salvar'}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===== Modal Campo (nome/email) ===== */}
      <Modal visible={modalCampo} transparent animationType="fade" onRequestClose={() => setModalCampo(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={st.modalOverlay}>
          <View style={[st.modalContent, { width: '80%' }]}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitulo}>
                {tipoCampo === 'nome' ? 'Editar Nome' : 'Editar Email'}
              </Text>
              <Pressable onPress={() => setModalCampo(false)}><IconeX /></Pressable>
            </View>
            <TextInput
              style={st.input}
              value={valorCampo}
              onChangeText={setValorCampo}
              keyboardType={tipoCampo === 'email' ? 'email-address' : 'default'}
              autoCapitalize={tipoCampo === 'email' ? 'none' : 'words'}
              placeholder={tipoCampo === 'email' ? 'seu@email.com' : 'Seu nome'}
              placeholderTextColor="#BBB"
            />
            <Pressable style={st.btnTrocando} onPress={confirmarCampo}>
              <Text style={st.btnTrocandoTexto}>Salvar</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  btnAdicionar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: '#1E88E5',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: '#FFF',
    marginBottom: 24,
    gap: 8,
  },
  btnAdicionarTexto: { color: '#1A1A1A', fontSize: 15, fontWeight: '600' },

  secaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  secaoTitulo: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  filtros: {
    backgroundColor: '#1A1A1A',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filtrosTexto: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  vazio: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  vazioTexto: { color: '#666', fontSize: 14, textAlign: 'center', lineHeight: 20 },

  cardSensor: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardSensorTopo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardCol: { flex: 1, paddingHorizontal: 6 },
  cardRotulo: { fontSize: 12, color: '#999', marginBottom: 2 },
  cardNome: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  linhaStatus: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  barraStatus: { width: 4, height: 34, borderRadius: 2, marginRight: 8 },
  textoStatus: { fontSize: 13, color: '#333', flex: 1 },
  btnOutline: {
    borderWidth: 1,
    borderColor: '#1E88E5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  btnOutlineTexto: { color: '#1E88E5', fontSize: 13, fontWeight: '600' },
  linkRemover: { color: '#C62828', fontSize: 12, alignSelf: 'flex-end' },

  cardConta: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  labelCampo: { fontSize: 13, color: '#666', marginBottom: 6 },
  linhaCampo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  campoRead: {
    flex: 1,
    backgroundColor: '#ECEFF3',
    borderRadius: 10,
    padding: 12,
  },
  campoTexto: { color: '#555', fontSize: 14 },
  btnLapis: { padding: 6 },
  input: {
    backgroundColor: '#ECEFF3',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  btnTrocando: {
    backgroundColor: '#1E88E5',
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 28,
    marginTop: 18,
  },
  btnTrocandoTexto: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  dica: { fontSize: 12, color: '#999', marginTop: 6 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 22,
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
});