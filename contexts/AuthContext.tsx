import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
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
        setUser(JSON.parse(stored));
      }
    } catch (error) {
      console.log("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (userId: string, password: string) => {
    const userMap: Record<string, User> = {
      "admin1": { id: "admin1", name: "Admin User", email: "admin@company.com", role: "Administrator" },
      "tech1": { id: "tech1", name: "Tech Support", email: "tech@company.com", role: "Staff" },
      "agent1": { id: "agent1", name: "Agent Smith", email: "agent@company.com", role: "Support Agent" },
    };
    
    const newUser = userMap[userId] || { id: userId, name: userId, email: `${userId}@company.com`, role: "User" };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  return {
    user,
    isLoading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };
});
