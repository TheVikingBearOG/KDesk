import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { User, Lock, LogIn } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useBranding } from "@/contexts/BrandingContext";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors } = useBranding();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!userId.trim() || !password.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await signIn(userId.trim(), password.trim());
      router.replace("/");
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userType: "admin" | "tech" | "agent") => {
    setIsLoading(true);
    try {
      const users = {
        admin: "admin1",
        tech: "tech1",
        agent: "agent1",
      };
      await signIn(users[userType], "password");
      router.replace("/");
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/viv3xwwna0e1id45vv721" }}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>Support Ticket System</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Sign In</Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <User size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="User ID"
                placeholderTextColor={colors.textSecondary}
                value={userId}
                onChangeText={setUserId}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Lock size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.signInButton, (!userId.trim() || !password.trim()) && styles.signInButtonDisabled]}
            onPress={handleSignIn}
            disabled={isLoading || !userId.trim() || !password.trim()}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <LogIn size={20} color="#FFFFFF" />
                <Text style={styles.signInButtonText}>Sign In</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or quick login as</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.quickLoginContainer}>
            <TouchableOpacity
              style={styles.quickLoginButton}
              onPress={() => handleQuickLogin("admin")}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.quickLoginText}>Admin</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLoginButton}
              onPress={() => handleQuickLogin("tech")}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.quickLoginText}>Tech Support</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLoginButton}
              onPress={() => handleQuickLogin("agent")}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.quickLoginText}>Agent</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundColor,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    width: 240,
    height: 80,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  formContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 32,
    ...Platform.select({
      web: {
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" as any,
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 24,
    textAlign: "center",
  },
  inputGroup: {
    gap: 16,
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: colors.border,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  signInButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryColor,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  signInButtonDisabled: {
    opacity: 0.5,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  quickLoginContainer: {
    flexDirection: "row",
    gap: 12,
  },
  quickLoginButton: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
  },
  quickLoginText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
