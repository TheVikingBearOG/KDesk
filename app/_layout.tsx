import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { trpc, trpcClient } from "@/lib/trpc";
import Sidebar from "@/components/Sidebar";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "login";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/");
    }
  }, [isAuthenticated, segments, isLoading, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        {isAuthenticated && <Sidebar />}
        <View style={[styles.mainContent, !isAuthenticated && styles.mainContentFullWidth]}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="index" />
            <Stack.Screen name="tickets" />
            <Stack.Screen name="ticket/[id]" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="chat" />
            <Stack.Screen name="statistics" />
            <Stack.Screen name="submit" options={{ presentation: "modal" }} />
          </Stack>
        </View>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="tickets" options={{ headerShown: false }} />
      <Stack.Screen name="ticket/[id]" options={{ title: "Ticket Details" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="chat" options={{ title: "Team Chat" }} />
      <Stack.Screen name="statistics" options={{ title: "Statistics" }} />
      <Stack.Screen name="submit" options={{ title: "Submit Ticket", presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrandingProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </BrandingProvider>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row" as const,
  },
  mainContent: {
    flex: 1,
    marginLeft: Platform.OS === "web" ? 280 : 0,
  },
  mainContentFullWidth: {
    marginLeft: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
});
