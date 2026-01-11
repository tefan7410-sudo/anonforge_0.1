import { useState, useMemo } from 'react';
import { useExtensions } from '@ada-anvil/weld/react';
import { SUPPORTED_WALLETS } from '@ada-anvil/weld';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Wallet, AlertCircle, ChevronDown } from 'lucide-react';
import { useWalletAuth, WalletAuthMode } from '@/hooks/use-wallet-auth';
import { toast } from 'sonner';

interface WalletConnectModalProps {
  open: boolean;
  onClose: () => void;
  mode: WalletAuthMode;
  onSuccess?: () => void;
}


export function WalletConnectModal({ 
  open, 
  onClose, 
  mode, 
  onSuccess 
}: WalletConnectModalProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [showAllWallets, setShowAllWallets] = useState(false);
  
  const installed = useExtensions("supportedMap");
  const isExtensionsLoading = useExtensions("isLoading");
  
  const { authenticate, isConnecting, error } = useWalletAuth();

  // Split wallets into installed and not installed
  const { installedWallets, notInstalledWallets } = useMemo(() => {
    const cardano = SUPPORTED_WALLETS.filter(w => !['metamask'].includes(w.key));
    return {
      installedWallets: cardano.filter(w => installed.has(w.key)),
      notInstalledWallets: cardano.filter(w => !installed.has(w.key)),
    };
  }, [installed]);

  const handleConnect = async (walletKey: string) => {
    setSelectedWallet(walletKey);
    
    try {
      const result = await authenticate({ mode, walletKey });
      
      if (result.success) {
        toast.success(result.message || 'Connected successfully');
        onClose();
        onSuccess?.();
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      
      // Handle specific error cases
      if (err.message?.includes('User rejected')) {
        toast.error('Connection cancelled by user');
      } else if (err.message?.includes('stake_address_already_linked')) {
        toast.error('This wallet is already linked to another account');
      } else if (err.message?.includes('no_account_found')) {
        toast.error('No account found for this wallet. Please register first.');
      } else {
        toast.error(err.message || 'Failed to connect wallet');
      }
    } finally {
      setSelectedWallet(null);
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'login':
        return 'Select your wallet to sign in with your Cardano wallet';
      case 'register':
        return 'Select your wallet to create an account with your Cardano wallet';
      case 'link':
        return 'Link a Cardano wallet to your account for wallet-based sign-in';
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'login':
        return 'Sign in with Wallet';
      case 'register':
        return 'Register with Wallet';
      case 'link':
        return 'Connect Wallet';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {getModeTitle()}
          </DialogTitle>
          <DialogDescription>
            {getModeDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {isExtensionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Installed wallets - always visible */}
              <div className="space-y-2">
                {installedWallets.map((wallet) => {
                  const isLoading = selectedWallet === wallet.key && isConnecting;
                  
                  return (
                    <Button
                      key={wallet.key}
                      variant="outline"
                      className="w-full justify-start gap-3 h-14"
                      onClick={() => handleConnect(wallet.key)}
                      disabled={isConnecting}
                    >
                      <div className="h-8 w-8 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                        <img 
                          src={wallet.icon} 
                          alt={wallet.displayName}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                        <span className="hidden items-center justify-center text-muted-foreground font-bold text-sm">
                          {wallet.displayName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{wallet.displayName}</div>
                        <div className="text-xs text-muted-foreground">Installed</div>
                      </div>
                      {isLoading && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </Button>
                  );
                })}
              </div>

              {/* Show more wallets toggle */}
              {notInstalledWallets.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    className="w-full text-sm text-muted-foreground"
                    onClick={() => setShowAllWallets(!showAllWallets)}
                  >
                    {showAllWallets ? 'Hide' : 'Show'} wallets to install ({notInstalledWallets.length})
                    <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showAllWallets ? 'rotate-180' : ''}`} />
                  </Button>

                  {/* Not installed wallets - only visible when expanded */}
                  {showAllWallets && (
                    <div className="space-y-2">
                      {notInstalledWallets.map((wallet) => (
                        <Button
                          key={wallet.key}
                          variant="ghost"
                          className="w-full justify-start gap-3 h-14 opacity-60"
                          asChild
                        >
                          <a 
                            href={wallet.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <div className="h-8 w-8 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                              <img 
                                src={wallet.icon} 
                                alt={wallet.displayName}
                                className="h-full w-full object-contain grayscale"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  if (e.currentTarget.nextElementSibling) {
                                    (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                  }
                                }}
                              />
                              <span className="hidden items-center justify-center text-muted-foreground font-bold text-sm">
                                {wallet.displayName.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium">{wallet.displayName}</div>
                              <div className="text-xs text-muted-foreground">
                                Click to install
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </a>
                        </Button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* No wallets installed message */}
              {installed.size === 0 && !isExtensionsLoading && (
                <div className="flex items-start gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                  <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-700 dark:text-yellow-400">
                      No Cardano wallets detected
                    </p>
                    <p className="text-yellow-600 dark:text-yellow-500 mt-1">
                      Install a wallet extension like Eternl, Lace, or VESPR to continue.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">
              {error.message || 'An error occurred'}
            </p>
          </div>
        )}

        <div className="text-xs text-center text-muted-foreground">
          By connecting, you agree to sign a message to verify wallet ownership. 
          No transaction will be made.
        </div>
      </DialogContent>
    </Dialog>
  );
}
