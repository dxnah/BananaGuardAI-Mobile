import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

function AuthGuard() {
  const { currentUser } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inTabsGroup = segments[0] === '(tabs)';
    const inLogin = segments[0] === 'login';
    const inSignup = segments[0] === 'signup';

    if (!currentUser && inTabsGroup) {
      // Wala naka-login pero naa sa tabs — i-redirect sa login
      router.replace('/login' as any);
    } else if (currentUser && (inLogin || inSignup)) {
      // Naka-login na pero naa pa sa login/signup — i-redirect sa tabs
      router.replace('/(tabs)' as any);
    }
  }, [currentUser, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  );
}