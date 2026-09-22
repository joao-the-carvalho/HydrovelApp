import { Text, View, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "../../../styles/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";

export default function HomeScreen() {
  const [valorVazamento, setValorVazamento] = useState<number>(0.0);
  const [ph, setPh] = useState<number>(0.0);
  const [turbidez, setTurbidez] = useState<number | string>("");
  const [textoStatus, setTextoStatus] = useState<string>("Carregando dados...");

  const getBaseUrl = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'web') {
      return 'http://localhost:3000'; 
    } else {
      return 'http://192.168.0.14:3000'; 
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
      // Rota sem o prefixo /sensors
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
      // Rota sem o prefixo /sensors
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
    const valorVazao = await handleLeak();
    const valorQld = await handleQuality();

    if (valorVazao === null || !valorQld) {
      setTextoStatus("Falha na conexão com os sensores");
      return;
    }

    setValorVazamento(valorVazao);
    setPh(valorQld.ph || 0);
    setTurbidez(valorQld.turbidez || 0);

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
  };

  useEffect(() => {
    handleStatus();
  }, []);

  return (
    <SafeAreaView style={[styles.container, styles.center]}>
      {/* Card Principal Topo */}
      <View style={styles.statusCard}>
        <Text>{textoStatus}</Text>
      </View>

      {/* Grid de Cards Inferiores */}
      <View style={styles.row}>
        {/* Card Vazamento */}
        <View style={styles.smallCard}>
          <Text style={styles.smallCardText}>
            Diferença Vazão: {valorVazamento} L/min
          </Text>
        </View>

        {/* Card Qualidade da Água */}
        <View style={styles.smallCard}>
          <Text style={styles.smallCardText}>
            pH: {ph} | Turbidez: {turbidez}
          </Text>
        </View>
      </View>   
    </SafeAreaView>
  );
}