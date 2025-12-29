import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";
import { mockStaff } from "@/backend/trpc/routes/settings";

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
        const backendUser = mockStaff.find((s) => s.id === storedUser.id);
        if (backendUser) {
          const userData: User = {
            id: backendUser.id,
            name: backendUser.name,
            email: backendUser.email,
            role: backendUser.role === "admin" ? "Administrator" : "Staff",
            mustChangePassword: backendUser.mustChangePassword,
          };
          setUser(userData);
        } else {
          setUser(storedUser);
        }
      }
    } catch (error) {
      console.log("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (userId: string, password: string) => {
    const backendUser = mockStaff.find((s) => s.id === userId);
    
    if (backendUser) {
      if (backendUser.password !== password) {
        throw new Error("Invalid password");
      }
      const userData: User = {
        id: backendUser.id,
        name: backendUser.name,
        email: backendUser.email,
        role: backendUser.role === "admin" ? "Administrator" : "Staff",
        mustChangePassword: backendUser.mustChangePassword,
      };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
      setUser(userData);
    } else {
      const userMap: Record<string, User> = {
        "admin1": { id: "admin1", name: "Admin User", email: "admin@company.com", role: "Administrator", mustChangePassword: false },
        "tech1": { id: "tech1", name: "Tech Support", email: "tech@company.com", role: "Staff", mustChangePassword: false },
        "agent1": { id: "agent1", name: "Agent Smith", email: "agent@company.com", role: "Support Agent", mustChangePassword: false },
      };
      
      const newUser = userMap[userId] || { id: userId, name: userId, email: `${userId}@company.com`, role: "User", mustChangePassword: false };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
      setUser(newUser);
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  const updateUserPassword = async () => {
    if (user) {
      const backendUser = mockStaff.find((s) => s.id === user.id);
      if (backendUser) {
        const userData: User = {
          ...user,
          mustChangePassword: backendUser.mustChangePassword,
        };
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
        setUser(userData);
      }
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
