import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Rota inicial que faz a verificação de sessão (src/app/index.tsx) */}
      <Stack.Screen name="index" />
      
      {/* Mapeamento exato da estrutura de pastas dentro de telas/ */}
      <Stack.Screen name="telas/(app)" />
      <Stack.Screen name="telas/(auth)/login" />
      <Stack.Screen name="telas/(auth)/signup" />
    </Stack>
  );
}