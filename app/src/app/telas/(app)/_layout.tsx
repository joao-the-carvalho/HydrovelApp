import { Tabs, router } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TouchableOpacity } from "react-native";
import {useState, useEffect } from "react";

export default function AppLayout() {
  const [userName, setUserName] = useState("Usuário");

  useEffect(() => {
      const loadUserData = async () => {
        try {
          const storedName = await AsyncStorage.getItem('@user_name');
          if (storedName) {
            setUserName(storedName);
          }
        } catch (error) {
          console.error("Erro ao carregar nome do usuário:", error);
        }
      };

      loadUserData();
    }, []);
  return (
    <Tabs 
      screenOptions={({ route }) => ({
        headerRight: () => (
          <TouchableOpacity 
            onPress={() => router.push('/telas/(app)/notificacoes')}
            style={{ marginRight: 16 }}
          >
            <Ionicons name="notifications-outline" size={30} color="#000000" />
          </TouchableOpacity>
        ),
        tabBarStyle: { backgroundColor: '#FFFFFF' },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'ellipse';

          if (route.name === 'index') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'analise') {
            iconName = focused ? 'analytics' : 'analytics-outline'  ;
          } else if (route.name === 'config') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Início", headerTitle: `Olá, ${userName}`,
          headerTitleStyle: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#000000', }}} />
      <Tabs.Screen name="analise" options={{ title: "Análise", 
        headerTitleStyle: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#000000', }
       }} />
      <Tabs.Screen name="configuracoes" options={{ title: "Configurações" }} />
      <Tabs.Screen 
    name="notificacoes" 
    options={{ 
      href: null,
      title: "Notificações",
      headerShown: true,
    }} 
  />
    </Tabs>
  );
}