import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthNav />
    </AuthProvider>
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
