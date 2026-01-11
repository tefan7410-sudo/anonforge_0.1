import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ExternalLink, Wallet, AlertCircle, ChevronDown, Copy, Check, RefreshCw } from 'lucide-react';
import { useWalletAuth, WalletAuthMode, isWalletAuthError, formatStakeAddress } from '@/hooks/use-wallet-auth';
import { toast } from 'sonner';

interface WalletConnectModalProps {
  open: boolean;
  onClose: () => void;
  mode: WalletAuthMode;
  onSuccess?: () => void;
}

interface NoAccountErrorState {
  show: boolean;
  stakeAddress: string | null;
}

export function WalletConnectModal({ 
  open, 
  onClose, 
  mode, 
  onSuccess 
}: WalletConnectModalProps) {
  const navigate = useNavigate();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [showAllWallets, setShowAllWallets] = useState(false);
  const [noAccountError, setNoAccountError] = useState<NoAccountErrorState>({ show: false, stakeAddress: null });
  const [copied, setCopied] = useState(false);
  
  const installed = useExtensions("supportedMap");
  const isExtensionsLoading = useExtensions("isLoading");
  
  const { authenticate, isConnecting, error, lastAttemptedStake, disconnect } = useWalletAuth();

  // Split wallets into installed and not installed
  const { installedWallets, notInstalledWallets } = useMemo(() => {
    const cardano = SUPPORTED_WALLETS.filter(w => !['metamask'].includes(w.key));
    return {
      installedWallets: cardano.filter(w => installed.has(w.key)),
      notInstalledWallets: cardano.filter(w => !installed.has(w.key)),
    };
  }, [installed]);

  const handleCopyStakeAddress = async () => {
    const address = noAccountError.stakeAddress || lastAttemptedStake;
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Stake address copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetAndTryAgain = () => {
    setNoAccountError({ show: false, stakeAddress: null });
    disconnect();
    setSelectedWallet(null);
  };

  const handleGoToRegister = () => {
    onClose();
    navigate('/register', { state: { walletAutoRegister: true, walletKey: selectedWallet } });
  };

  const handleConnect = async (walletKey: string) => {
    setSelectedWallet(walletKey);
    setNoAccountError({ show: false, stakeAddress: null });
    
    try {
      const result = await authenticate({ mode, walletKey });
      
      if (result.success) {
        toast.success(result.message || 'Connected successfully');
        onClose();
        onSuccess?.();
      }
    } catch (err: unknown) {
      console.error('Wallet connection error:', err);
      
      // Handle WalletAuthError with code
      if (isWalletAuthError(err)) {
        if (err.code === 'no_account_found') {
          // Show the inline error state instead of redirecting
          setNoAccountError({
            show: true,
            stakeAddress: err.attemptedStakeAddress || lastAttemptedStake || null,
          });
          return; // Don't show toast, we're showing inline UI
        } else if (err.code === 'stake_address_already_linked') {
          toast.error('This wallet is already linked to another account');
        } else {
          toast.error(err.message || 'Failed to connect wallet');
        }
      } else if (err instanceof Error) {
        // Handle regular Error objects
        if (err.message?.includes('User rejected')) {
          toast.error('Connection cancelled by user');
        } else if (err.message?.includes('stake_address_already_linked')) {
          toast.error('This wallet is already linked to another account');
        } else if (err.message?.includes('no_account_found')) {
          setNoAccountError({
            show: true,
            stakeAddress: lastAttemptedStake || null,
          });
          return;
        } else {
          toast.error(err.message || 'Failed to connect wallet');
        }
      } else {
        toast.error('Failed to connect wallet');
      }
    } finally {
      if (!noAccountError.show) {
        setSelectedWallet(null);
      }
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

  // Show the no account found error state
  if (noAccountError.show && mode === 'login') {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              No Account Found
            </DialogTitle>
            <DialogDescription>
              There's no account linked to this wallet stake address.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Detected stake address */}
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-sm font-medium mb-2">Detected Stake Address:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-background p-2 rounded border overflow-x-auto">
                  {noAccountError.stakeAddress || 'Unknown'}
                </code>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="shrink-0"
                  onClick={handleCopyStakeAddress}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Explanation */}
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
              <p className="text-sm text-orange-700 dark:text-orange-400">
                <strong>Why is this happening?</strong>
              </p>
              <ul className="text-sm text-orange-600 dark:text-orange-500 mt-2 space-y-1 list-disc list-inside">
                <li>Your wallet may have multiple accounts - try selecting a different one</li>
                <li>You may have linked a different wallet to your account</li>
                <li>This may be a new wallet that hasn't been registered yet</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                onClick={handleResetAndTryAgain}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Different Wallet Account
              </Button>
              <Button 
                onClick={handleGoToRegister}
                className="w-full"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Create New Account with This Wallet
              </Button>
            </div>

            {/* Help text */}
            <p className="text-xs text-muted-foreground text-center">
              If you previously linked this wallet to an email/Google account, 
              check your Profile page to see the linked stake address.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
                    <ScrollArea className="max-h-[200px]">
                      <div className="space-y-1 pr-2">
                        {notInstalledWallets.map((wallet) => (
                          <Button
                            key={wallet.key}
                            variant="ghost"
                            className="w-full justify-start gap-2 h-10 opacity-60"
                            asChild
                          >
                            <a 
                              href={wallet.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <div className="h-6 w-6 rounded-md overflow-hidden bg-muted flex items-center justify-center">
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
                                <span className="hidden items-center justify-center text-muted-foreground font-bold text-xs">
                                  {wallet.displayName.charAt(0)}
                                </span>
                              </div>
                              <span className="flex-1 text-left text-sm font-medium">
                                {wallet.displayName}
                              </span>
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </a>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
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

        {error && !noAccountError.show && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">
              {isWalletAuthError(error) ? error.message : (error instanceof Error ? error.message : 'An error occurred')}
            </p>
          </div>
        )}

        <div className="text-xs text-center text-muted-foreground">
          By connecting, you agree to verify wallet ownership via stake address. 
          No transaction will be made.
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-2 border-t">
          <span>Powered by</span>
          <a 
            href="https://ada-anvil.io" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Ada Anvil
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
