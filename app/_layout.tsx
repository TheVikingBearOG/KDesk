import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { trpc, trpcClient } from "@/lib/trpc";
import Sidebar from "@/components/Sidebar";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <Sidebar />
        <View style={styles.mainContent}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="tickets" />
            <Stack.Screen name="ticket/[id]" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="chat" />
            <Stack.Screen name="submit" options={{ presentation: "modal" }} />
          </Stack>
        </View>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="tickets" options={{ headerShown: false }} />
      <Stack.Screen name="ticket/[id]" options={{ title: "Ticket Details" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="chat" options={{ title: "Team Chat" }} />
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
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootLayoutNav />
        </GestureHandlerRootView>
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
});
