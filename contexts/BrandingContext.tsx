import createContextHook from "@nkzw/create-context-hook";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";

type ThemeType = "light" | "dark" | "plex";

interface BrandingConfig {
  companyName: string;
  theme: ThemeType;
}

interface ThemeColors {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  inputBackground: string;
}

const themes: Record<ThemeType, ThemeColors> = {
  light: {
    primaryColor: "#3B82F6",
    accentColor: "#10B981",
    backgroundColor: "#F9FAFB",
    cardBackground: "#FFFFFF",
    textPrimary: "#1F2937",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    inputBackground: "#F9FAFB",
  },
  dark: {
    primaryColor: "#3B82F6",
    accentColor: "#10B981",
    backgroundColor: "#111827",
    cardBackground: "#1F2937",
    textPrimary: "#F9FAFB",
    textSecondary: "#9CA3AF",
    border: "#374151",
    inputBackground: "#374151",
  },
  plex: {
    primaryColor: "#E5A00D",
    accentColor: "#CC7B19",
    backgroundColor: "#1F1F1F",
    cardBackground: "#282828",
    textPrimary: "#FFFFFF",
    textSecondary: "#A0A0A0",
    border: "#404040",
    inputBackground: "#3A3A3A",
  },
};

export const [BrandingProvider, useBranding] = createContextHook(() => {
  const [branding, setBranding] = useState<BrandingConfig>({
    companyName: "KDesk",
    theme: "light",
  });
  
  const brandingQuery = trpc.settings.getBranding.useQuery(undefined, {
    enabled: true,
  });

  useEffect(() => {
    if (brandingQuery.data) {
      setBranding(brandingQuery.data);
    }
  }, [brandingQuery.data]);

  const colors = themes[branding.theme];

  return {
    branding,
    colors,
    isLoading: brandingQuery.isLoading,
    refetch: brandingQuery.refetch,
  };
});
