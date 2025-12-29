import createContextHook from "@nkzw/create-context-hook";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";

interface BrandingConfig {
  companyName: string;
  primaryColor: string;
  accentColor: string;
}

export const [BrandingProvider, useBranding] = createContextHook(() => {
  const brandingQuery = trpc.settings.getBranding.useQuery();
  const [branding, setBranding] = useState<BrandingConfig>({
    companyName: "KDesk",
    primaryColor: "#3B82F6",
    accentColor: "#10B981",
  });

  useEffect(() => {
    if (brandingQuery.data) {
      setBranding(brandingQuery.data);
    }
  }, [brandingQuery.data]);

  return {
    branding,
    isLoading: brandingQuery.isLoading,
    refetch: brandingQuery.refetch,
  };
});
