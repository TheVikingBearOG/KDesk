import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  mustChangePassword?: boolean;
}

const AUTH_KEY = "kdesk_auth_user";

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_KEY);
      if (stored) {
        const storedUser = JSON.parse(stored);
        setUser(storedUser);
      }
    } catch (error) {
      console.log("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginMutation = trpc.settings.login.useMutation();

  const signIn = async (userId: string, password: string) => {
    try {
      const userData = await loginMutation.mutateAsync({ userId, password });
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  const updateUserPassword = async () => {
    if (user) {
      const userData: User = {
        ...user,
        mustChangePassword: false,
      };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
      setUser(userData);
    }
  };

  return {
    user,
    isLoading,
    signIn,
    signOut,
    updateUserPassword,
    isAuthenticated: !!user,
  };
});
