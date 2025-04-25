import { router, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { SessionIsActive } from '@/contexts/AuthContext';
import { useEffect } from 'react';
export default function AuthLayout() {
  useEffect(() => {
    const checkSession = async () => {
      const isActive = await SessionIsActive();
      if (isActive) {
        router.push('/(tabs)');
      }
    }
    checkSession();
  }, []);
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
} 