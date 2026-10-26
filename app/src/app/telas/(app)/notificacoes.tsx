import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useNavigation } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';

type Notificacao = {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'vazamento' | 'qualidade' | 'info';
  lida: boolean;
  data: string;
};

export default function NotificacoesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Esconde a bottom navigation apenas nesta tela
  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: 'none' },
      headerShown: false,
    });
    return () => {
      navigation.setOptions({
        tabBarStyle: undefined, // Restaura ao sair da tela
      });
    };
  }, [navigation]);;

  const getBaseUrl = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'web') {
      return 'http://localhost:3000';
    } else {
      return 'https://ideally-debtless-tiring.ngrok-free.dev';
    }
  };

  const getHeaders = async () => {
    const token = await AsyncStorage.getItem('@session_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  };

  const handleFetchNotificacoes = async () => {
    try {
      const headers = await getHeaders();
      const response = await fetch(`${getBaseUrl()}/api/notificacoes`, { headers });

      if (!response.ok) {
        throw new Error('Falha ao buscar notificações');
      }

      const data = await response.json();
      // Ajuste conforme o formato que sua API retornar
      setNotificacoes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      // Dados mockados para desenvolvimento — remova quando a API estiver pronta
           setNotificacoes([
        {
          id: '1',
          titulo: 'Suspeita de vazamento',
          descricao: 'Diferença de vazão detectada entre entrada e saída.',
          tipo: 'vazamento',
          lida: false,
          data: 'Há 10 minutos',
        },
        {
          id: '2',
          titulo: 'pH fora do padrão',
          descricao: 'O pH da água está abaixo do ideal (5.8).',
          tipo: 'qualidade',
          lida: false,
          data: 'Há 1 hora',
        },
        {
          id: '3',
          titulo: 'Limpeza em dia',
          descricao: 'Sua caixa d\'água está com a manutenção em dia.',
          tipo: 'info',
          lida: true,
          data: 'Ontem',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchNotificacoes();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await handleFetchNotificacoes();
    setRefreshing(false);
  };

  const getIconByTipo = (tipo: Notificacao['tipo']) => {
    switch (tipo) {
      case 'vazamento':
        return (
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h-2v-2h2v2zm0-4h-2V7h2v5z"
              fill="#C62828"
            />
          </Svg>
        );
      case 'qualidade':
        return (
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path
              d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z"
              fill="#F57C00"
            />
          </Svg>
        );
      default:
        return (
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Circle cx="12" cy="12" r="10" fill="#1E88E5" />
            <Path
              d="M12 16v-4m0-2h.01"
              stroke="#FFF"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </Svg>
        );
    }
  };

  const getBorderColor = (tipo: Notificacao['tipo']) => {
    switch (tipo) {
      case 'vazamento': return '#FFEBEE';
      case 'qualidade': return '#FFF3E0';
      default: return '#E3F2FD';
    }
  };

  const getDotColor = (tipo: Notificacao['tipo']) => {
    switch (tipo) {
      case 'vazamento': return '#C62828';
      case 'qualidade': return '#F57C00';
      default: return '#1E88E5';
    }
  };

  const renderNotificacao = ({ item }: { item: Notificacao }) => (
    <Pressable
      style={[
        localStyles.notificacaoCard,
        { borderLeftColor: getDotColor(item.tipo) },
        !item.lida && localStyles.notificacaoNaoLida,
      ]}
    >
      <View style={localStyles.notificacaoHeader}>
        <View style={localStyles.notificacaoIconContainer}>
          {getIconByTipo(item.tipo)}
        </View>
        <View style={localStyles.notificacaoContent}>
          <View style={localStyles.notificacaoTitleRow}>
            <Text style={localStyles.notificacaoTitulo}>{item.titulo}</Text>
            {!item.lida && <View style={[localStyles.dot, { backgroundColor: getDotColor(item.tipo) }]} />}
          </View>
          <Text style={localStyles.notificacaoDescricao}>{item.descricao}</Text>
          <Text style={localStyles.notificacaoData}>{item.data}</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={localStyles.container} edges={['top','bottom', 'left', 'right']}>
      {/* Header */}
      <View style={localStyles.header}>
        <Pressable onPress={() => router.back()} style={localStyles.backButton}>
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path
              d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
              fill="#1A1A1A"
            />
          </Svg>
        </Pressable>
        <Text style={localStyles.headerTitle}>Notificações</Text>
        <View style={{ width: 24 }} /> {/* Espaçador para centralizar o título */}
      </View>

      {/* Subtítulo */}
      <View style={localStyles.subtitleContainer}>
        <Text style={localStyles.subtitle}>
          Sua central de alertas de vazamento e qualidade.
        </Text>
      </View>

      {/* Lista de notificações */}
      {loading ? (
        <View style={localStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={localStyles.loadingText}>Carregando notificações...</Text>
        </View>
      ) : notificacoes.length === 0 ? (
        <View style={localStyles.emptyContainer}>
          <Svg width="80" height="80" viewBox="0 0 24 24">
            <Path
              d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
              fill="#E0E0E0"
            />
          </Svg>
          <Text style={localStyles.emptyTitle}>Nenhuma notificação</Text>
          <Text style={localStyles.emptyText}>
            Você está em dia! Novos alertas aparecerão aqui.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notificacoes}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificacao}
          contentContainerStyle={localStyles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E88E5" />
          }
        />
      )}
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  notificacaoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  notificacaoNaoLida: {
    backgroundColor: '#FAFBFF',
  },
  notificacaoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificacaoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificacaoContent: {
    flex: 1,
  },
  notificacaoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificacaoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notificacaoDescricao: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 6,
  },
  notificacaoData: {
    fontSize: 12,
    color: '#999',
  },
});