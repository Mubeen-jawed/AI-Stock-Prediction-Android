import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    NavigationBar.setBackgroundColorAsync("#05060A");
    NavigationBar.setBorderColorAsync("#05060A");
  }, []);
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: "#05060A" }}>
      <AuthProvider>
        <AuthNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function AuthNav() {
  const { token, loading } = useAuth();

  if (loading) return null; // splash

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!token ? (
        <>
          <Stack.Screen name="_login" />
          <Stack.Screen name="_signup" />
        </>
      ) : (
        <Stack.Screen name="(tabs)" />
      )}
    </Stack>
  );
}
