import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { useExtensions } from "@ada-anvil/weld/react";
import { useMemo, useState } from "react";

// Supported wallets with metadata
const SUPPORTED_WALLETS = [
  { key: "eternl", name: "Eternl", icon: "🔷", url: "https://eternl.io" },
  { key: "nami", name: "Nami", icon: "🌙", url: "https://namiwallet.io" },
  { key: "lace", name: "Lace", icon: "💎", url: "https://www.lace.io" },
  { key: "flint", name: "Flint", icon: "🔥", url: "https://flint-wallet.com" },
  { key: "typhon", name: "Typhon", icon: "🌀", url: "https://typhonwallet.io" },
  { key: "vespr", name: "Vespr", icon: "⚡", url: "https://vespr.xyz" },
  { key: "begin", name: "Begin", icon: "🚀", url: "https://begin.is" },
  { key: "nufi", name: "NuFi", icon: "🎯", url: "https://nu.fi" },
  { key: "gerowallet", name: "Gero", icon: "🦊", url: "https://gerowallet.io" },
  { key: "yoroi", name: "Yoroi", icon: "📦", url: "https://yoroi-wallet.com" },
];

interface WalletReconnectModalProps {
  open: boolean;
  onClose: () => void;
  onConnect: (walletKey: string) => Promise<void>;
  lastWalletKey?: string | null;
  isReconnecting?: boolean;
}

export function WalletReconnectModal({
  open,
  onClose,
  onConnect,
  lastWalletKey,
  isReconnecting = false,
}: WalletReconnectModalProps) {
  const extensions = useExtensions("allArr");
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { installedWallets, notInstalledWallets } = useMemo(() => {
    const installedKeys = new Set(extensions.map((ext) => ext.info.key));
    return {
      installedWallets: SUPPORTED_WALLETS.filter((w) => installedKeys.has(w.key)),
      notInstalledWallets: SUPPORTED_WALLETS.filter((w) => !installedKeys.has(w.key)),
    };
  }, [extensions]);

  const handleConnect = async (walletKey: string) => {
    setConnecting(walletKey);
    setError(null);
    try {
      await onConnect(walletKey);
      onClose();
    } catch (err) {
      console.error("Wallet connection error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setConnecting(null);
    }
  };

  // If we have a last wallet key, show quick reconnect option
  const lastWallet = lastWalletKey 
    ? SUPPORTED_WALLETS.find(w => w.key === lastWalletKey)
    : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {isReconnecting ? "Reconnect Wallet" : "Connect Wallet"}
          </DialogTitle>
          <DialogDescription>
            {isReconnecting 
              ? "Your wallet session expired. Reconnect to continue with payment."
              : "Select a wallet to pay with ADA"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick reconnect for last used wallet */}
          {lastWallet && installedWallets.some(w => w.key === lastWallet.key) && (
            <div className="pb-4 border-b border-border">
              <p className="text-sm text-muted-foreground mb-2">Quick reconnect</p>
              <Button
                variant="default"
                className="w-full justify-start gap-3"
                onClick={() => handleConnect(lastWallet.key)}
                disabled={connecting !== null}
              >
                {connecting === lastWallet.key ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="text-lg">{lastWallet.icon}</span>
                )}
                <span>Reconnect to {lastWallet.name}</span>
              </Button>
            </div>
          )}

          {/* Installed wallets */}
          {installedWallets.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {lastWallet ? "Or choose another wallet" : "Installed wallets"}
              </p>
              <div className="space-y-2">
                {installedWallets
                  .filter(w => w.key !== lastWalletKey)
                  .map((wallet) => (
                    <Button
                      key={wallet.key}
                      variant="outline"
                      className="w-full justify-start gap-3"
                      onClick={() => handleConnect(wallet.key)}
                      disabled={connecting !== null}
                    >
                      {connecting === wallet.key ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <span className="text-lg">{wallet.icon}</span>
                      )}
                      <span>{wallet.name}</span>
                    </Button>
                  ))}
              </div>
            </div>
          )}

          {/* No wallets installed */}
          {installedWallets.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">
                No Cardano wallets detected. Install one to continue:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {notInstalledWallets.slice(0, 4).map((wallet) => (
                  <Button
                    key={wallet.key}
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={wallet.url} target="_blank" rel="noopener noreferrer">
                      <span className="mr-2">{wallet.icon}</span>
                      {wallet.name}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
