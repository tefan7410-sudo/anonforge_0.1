import { WeldProvider } from "@ada-anvil/weld/react";
import { STORAGE_KEYS } from "@ada-anvil/weld/server";
import { ReactNode, useMemo } from "react";

interface CardanoWalletProviderProps {
  children: ReactNode;
}

// Custom storage implementation that works with SSR
const storage = {
  get(key: string) {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(key) ?? undefined;
    }
    return undefined;
  },
  set(key: string, value: string) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, value);
    }
  },
  remove(key: string) {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(key);
    }
  },
};

// Get stored wallet key for auto-reconnect
function getStoredWalletKey(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem(STORAGE_KEYS.connectedWallet) ?? undefined;
}

export function CardanoWalletProvider({ children }: CardanoWalletProviderProps) {
  // Memoize the tryToReconnectTo config to avoid re-renders
  const walletConfig = useMemo(() => {
    const storedWallet = getStoredWalletKey();
    if (storedWallet) {
      console.log("[Weld] Auto-reconnect enabled for wallet:", storedWallet);
      return { tryToReconnectTo: storedWallet };
    }
    return undefined;
  }, []);

  return (
    <WeldProvider
      storage={storage}
      wallet={walletConfig}
      onUpdateError={(context, error) => {
        console.error("[Weld] Wallet update error:", context, error);
      }}
      extensions={{
        onUpdateError: (error) => {
          console.error("[Weld] Extensions error:", error);
        },
      }}
    >
      {children}
    </WeldProvider>
  );
}
