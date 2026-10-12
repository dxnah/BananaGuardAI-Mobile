import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Dev-only: hides the harmless "Unable to activate keep awake" red box
LogBox.ignoreLogs(["Unable to activate keep awake"]);

function AuthGuard() {
  const { currentUser } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inTabsGroup = segments[0] === "(tabs)";
    const inLogin = segments[0] === "login";
    const inSignup = segments[0] === "signup";

    if (!currentUser && inTabsGroup) {
      router.replace("/login" as any);
    } else if (currentUser && (inLogin || inSignup)) {
      router.replace("/(tabs)" as any);
    }
  }, [currentUser, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
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