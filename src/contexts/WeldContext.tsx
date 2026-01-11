import { WeldProvider } from "@ada-anvil/weld/react";
import { ReactNode } from "react";

interface CardanoWalletProviderProps {
  children: ReactNode;
}

export function CardanoWalletProvider({ children }: CardanoWalletProviderProps) {
  return (
    <WeldProvider
      storage={{
        get(key) {
          if (typeof window !== "undefined") {
            return window.localStorage.getItem(key) ?? undefined;
          }
          return undefined;
        },
        set(key, value) {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, value);
          }
        },
        remove(key) {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(key);
          }
        },
      }}
      onUpdateError={(context, error) => {
        console.error("Weld wallet error:", context, error);
      }}
      extensions={{
        onUpdateError: (error) => {
          console.error("Weld extensions error:", error);
        },
      }}
    >
      {children}
    </WeldProvider>
  );
}
