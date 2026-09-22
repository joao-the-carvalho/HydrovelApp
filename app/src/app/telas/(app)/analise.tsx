import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Defs, ClipPath, G } from 'react-native-svg';

type TabType = 'encanamento' | 'caixa';

// ============================================================
// COMPONENTES VISUAIS
// ============================================================

const TabBar: React.FC<{ activeTab: TabType; onTabChange: (tab: TabType) => void }> = ({ activeTab, onTabChange }) => (
  <View style={localStyles.tabBar}>
    <TouchableOpacity 
      style={[localStyles.tab, activeTab === 'encanamento' && localStyles.activeTab]} 
      onPress={() => onTabChange('encanamento')}
    >
      <Text style={[localStyles.tabText, activeTab === 'encanamento' && localStyles.activeTabText]}>
        Encanamento
      </Text>
    </TouchableOpacity>
    <View style={localStyles.tabDivider} />
    <TouchableOpacity 
      style={[localStyles.tab, activeTab === 'caixa' && localStyles.activeTab]} 
      onPress={() => onTabChange('caixa')}
    >
      <Text style={[localStyles.tabText, activeTab === 'caixa' && localStyles.activeTabText]}>
        Caixa d'Água
      </Text>
    </TouchableOpacity>
  </View>
);

const WaterTank: React.FC<{ level: number }> = ({ level }) => {
  const [wavePhase1, setWavePhase1] = useState(0);
  const [wavePhase2, setWavePhase2] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    const duration = 2500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress1 = (elapsed % duration) / duration;
      const progress2 = (elapsed % (duration * 1.3)) / (duration * 1.3);
      
      setWavePhase1(progress1);
      setWavePhase2(progress2);
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const tankWidth = 200;
  const tankHeight = 180;
  const clampedLevel = Math.max(5, Math.min(95, level));
  const waterHeight = (clampedLevel / 100) * (tankHeight - 20);
  const waterY = tankHeight - waterHeight - 10;

  const createWavePath = (phase: number, amplitude: number, offset: number) => {
    const segments = 8;
    const segWidth = tankWidth / segments;
    let path = `M 0 ${waterY + offset}`;
    
    for (let i = 0; i <= segments; i++) {
      const x = i * segWidth;
      const waveOffset = Math.sin((i + phase * 4) * Math.PI) * amplitude;
      if (i === 0) {
        path += ` L ${x} ${waterY + offset + waveOffset}`;
      } else {
        const cpX = x - segWidth / 2;
        const cpY = waterY + offset - waveOffset;
        path += ` Q ${cpX} ${cpY} ${x} ${waterY + offset + waveOffset}`;
      }
    }
    path += ` L ${tankWidth} ${tankHeight} L 0 ${tankHeight} Z`;
    return path;
  };

  // Path que define o formato interno da caixa (para o clipPath)
  const tankInnerPath = `M 10 25 L ${tankWidth - 10} 25 L ${tankWidth - 20} ${tankHeight} L 20 ${tankHeight} Z`;

  return (
    <View style={localStyles.tankCard}>
      <View style={localStyles.tankContainer}>
        <Svg width={tankWidth} height={tankHeight}>
          {/* Definição do clipPath para cortar a água dentro da caixa */}
          <Defs>
            <ClipPath id="tankClip">
              <Path d={tankInnerPath} />
            </ClipPath>
          </Defs>

          {/* Tampa */}
          <Path d={`M 20 10 L ${tankWidth - 20} 10 L ${tankWidth - 10} 25 L 10 25 Z`} fill="#E0E0E0" stroke="#999" strokeWidth="1" />
          <Path d={`M 30 5 L ${tankWidth - 30} 5 L ${tankWidth - 20} 10 L 20 10 Z`} fill="#F5F5F5" stroke="#999" strokeWidth="1" />
          
          {/* Corpo da caixa (fundo) */}
          <Path d={tankInnerPath} fill="#F0F4F8" stroke="#B0BEC5" strokeWidth="2" />

          {/* Ondas Animadas - APLICANDO O CLIP PATH AQUI */}
          <G clipPath="url(#tankClip)">
            <Path d={createWavePath(wavePhase1, 4, 0)} fill="#4A90E2" opacity={0.9} />
            <Path d={createWavePath(wavePhase2, 3, 5)} fill="#6BA4E8" opacity={0.7} />
          </G>

          {/* Borda frontal (por cima da água) */}
          <Path d={tankInnerPath} fill="none" stroke="#B0BEC5" strokeWidth="2" />
        </Svg>

        {/* Indicador de Nível */}
        <View style={localStyles.levelIndicator}>
          <Text style={localStyles.levelText}>{level}%</Text>
          <Text style={localStyles.levelLabel}>Nível</Text>
        </View>
      </View>
    </View>
  );
};

const InfoCard: React.FC<{ ph: number; turbidez: number | string; status: string }> = ({ ph, turbidez, status }) => {
  const isTurbidezOk = typeof turbidez === 'number' ? turbidez <= 5.0 : String(turbidez).toLowerCase() === 'normal' || String(turbidez).toLowerCase() === 'ok';
  const isPhOk = ph >= 6.0 && ph <= 9.5;

  return (
    <View style={localStyles.infoCard}>
      <View style={localStyles.statusBanner}>
        <Text style={localStyles.statusText}>{status}</Text>
      </View>
      <View style={localStyles.infoRow}>
        <View style={localStyles.infoItem}>
          <Text style={localStyles.infoLabel}>Turbidez:</Text>
          <Text style={[localStyles.infoValue, isTurbidezOk ? localStyles.textSuccess : localStyles.textDanger]}>
            {typeof turbidez === 'number' ? `${turbidez} UNT` : turbidez} {isTurbidezOk ? '(OK)' : '(Atenção)'}
          </Text>
        </View>
        <View style={localStyles.infoItem}>
          <Text style={localStyles.infoLabel}>pH:</Text>
          <Text style={[localStyles.infoValue, isPhOk ? localStyles.textSuccess : localStyles.textDanger]}>
            {ph} {isPhOk ? '(Ideal)' : '(Atenção)'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const EncanamentoCard: React.FC<{ vazamento: number; status: string }> = ({ vazamento, status }) => (
  <View style={localStyles.infoCard}>
    <View style={[localStyles.statusBanner, vazamento > 0.3 ? localStyles.bgDanger : localStyles.bgSuccess]}>
      <Text style={localStyles.statusTextWhite}>{status}</Text>
    </View>
    <View style={localStyles.leakDetails}>
      <Text style={localStyles.leakLabel}>Diferença de Vazão:</Text>
      <Text style={[localStyles.leakValue, vazamento > 0.3 ? localStyles.textDanger : localStyles.textSuccess]}>
        {vazamento.toFixed(2)} L/s
      </Text>
      <Text style={localStyles.leakHint}>
        {vazamento <= 0.3 ? 'Nenhum vazamento significativo detectado.' : 'Diferença entre entrada e saída detectada! Verifique suas tubulações.'}
      </Text>
    </View>
  </View>
);

// ============================================================
// TELA PRINCIPAL
// ============================================================
export default function OutraScreen() {
  const [valorVazamento, setValorVazamento] = useState<number>(0.0);
  const [ph, setPh] = useState<number>(0.0);
  const [turbidez, setTurbidez] = useState<number | string>("");
  const [textoStatus, setTextoStatus] = useState<string>("Carregando dados...");
  
  const [activeTab, setActiveTab] = useState<TabType>('caixa');
  const [nivelCaixa, setNivelCaixa] = useState<number>(80); 
  const [loading, setLoading] = useState<boolean>(true);

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

  const handleLeak = async () => {
    try {
      const headers = await getHeaders();
      const response = await fetch(`${getBaseUrl()}/api/vazamento/ultimo`, { headers });
      if (!response.ok) return null;
      const json = await response.json();
      if (!json || Object.keys(json).length === 0) return 0.0;
      const diferencaVazao = Math.abs((json.vazaoEntrada || 0) - (json.vazaoSaida || 0));
      return Number(diferencaVazao.toFixed(2));
    } catch (error) {
      console.error("Erro ao buscar vazamento:", error);
      return null;
    }
  };

  const handleQuality = async () => {
    try {
      const headers = await getHeaders();
      const response = await fetch(`${getBaseUrl()}/api/qualidade/ultima`, { headers });
      if (!response.ok) return null;
      const json = await response.json();
      return json && Object.keys(json).length > 0 ? json : null;
    } catch (error) {
      console.error("Erro ao buscar qualidade:", error);
      return null;
    }
  };

  const handleStatus = async () => {
    setLoading(true);
    const valorVazao = await handleLeak();
    const valorQld = await handleQuality();

    if (valorVazao === null || !valorQld) {
      setTextoStatus("Falha na conexão com os sensores");
      setLoading(false);
      return;
    }

    setValorVazamento(valorVazao);
    setPh(valorQld.ph || 0);
    setTurbidez(valorQld.turbidez || 0);
    
    // Se sua API retornar o nível da caixa, descomente e ajuste:
    // setNivelCaixa(valorQld.nivelCaixa || 80);

    const semVazamento = valorVazao <= 0.3;
    const phIdeal = valorQld.ph >= 6.0 && valorQld.ph <= 9.5;
    const turbidezValor = valorQld.turbidez;
    const turbidezIdeal = typeof turbidezValor === 'number'
      ? turbidezValor <= 5.0
      : String(turbidezValor || '').toLowerCase() === 'normal' || String(turbidezValor || '').toLowerCase() === 'ok';

    if (semVazamento && phIdeal && turbidezIdeal) {
      setTextoStatus("Sua residência está segura");
    } else if (!semVazamento) {
      setTextoStatus("Atenção: Suspeita de vazamento detectada!");
    } else {
      setTextoStatus("Atenção: Qualidade da água fora dos padrões!");
    }
    setLoading(false);
  };

  useEffect(() => {
    handleStatus();
  }, []);

  const onRefresh = React.useCallback(() => {
    handleStatus();
  }, []);

  return (
    <SafeAreaView style={localStyles.container} edges={['bottom', 'left', 'right']}>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {loading ? (
        <View style={localStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={localStyles.loadingText}>Buscando dados dos sensores...</Text>
        </View>
      ) : (
        <ScrollView 
          style={localStyles.content} 
          contentContainerStyle={localStyles.contentInner}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
        >
          {activeTab === 'caixa' ? (
            <>
              <WaterTank level={nivelCaixa} />
              <InfoCard ph={ph} turbidez={turbidez} status={textoStatus} />
            </>
          ) : (
            <>
              <EncanamentoCard vazamento={valorVazamento} status={textoStatus} />
              <View style={localStyles.placeholderCard}>
                <Text style={localStyles.placeholderText}>Histórico de vazão em desenvolvimento</Text>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ============================================================
// ESTILOS LOCAIS
// ============================================================
const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#1E88E5',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#1E88E5',
  },
  tabDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 5,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 15,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  tankCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  tankContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  levelIndicator: {
    position: 'absolute',
    left: 15,
    top: '35%',
    alignItems: 'flex-start',
  },
  levelText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  levelLabel: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  statusBanner: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    marginBottom: 15,
    alignItems: 'center',
  },
  bgSuccess: {
    backgroundColor: '#E8F5E9',
  },
  bgDanger: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1565C0',
    textAlign: 'center',
  },
  statusTextWhite: {
    fontSize: 15,
    fontWeight: '600',
    color: '#C62828',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  textSuccess: {
    color: '#2E7D32',
  },
  textDanger: {
    color: '#C62828',
  },
  leakDetails: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  leakLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  leakValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  leakHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  placeholderCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 30,
    marginTop: 15,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#CCC',
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
  }
});