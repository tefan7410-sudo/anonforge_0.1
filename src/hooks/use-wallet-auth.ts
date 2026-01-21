import { useState } from 'react';
import { useWallet, useExtensions } from '@ada-anvil/weld/react';
import { toast } from 'sonner';

export type WalletAuthMode = 'login' | 'register' | 'link';

interface WalletAuthResult {
  success: boolean;
  isNewUser?: boolean;
  message?: string;
}

interface WalletAuthError {
  code: string;
  message: string;
  attemptedStakeAddress?: string;
}

// Map backend error codes to user-friendly messages
function getErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    no_account_found: "No account found for this wallet. The wallet may be on a different account than when you linked it.",
    stake_address_already_linked: "This wallet is already linked to another account.",
    invalid_session: "Your session has expired. Please log in again.",
    not_authenticated: "Please log in to link your wallet.",
  };
  return errorMessages[errorCode] || errorCode;
}

export function useWalletAuth() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastAttemptedStake, setLastAttemptedStake] = useState<string | null>(null);
  
  const connectAsync = useWallet("connectAsync");
  const disconnect = useWallet("disconnect");
  const isConnected = useWallet("isConnected");
  const stakeAddress = useWallet("stakeAddressBech32");
  const changeAddress = useWallet("changeAddressBech32");
  
  const installedExtensions = useExtensions("supportedArr");
  const isExtensionsLoading = useExtensions("isLoading");

  // Authenticate with wallet
  const authenticate = async ({ 
    mode, 
    walletKey 
  }: { 
    mode: WalletAuthMode;
    walletKey: string;
  }): Promise<WalletAuthResult> => {
    setIsConnecting(true);
    setLastAttemptedStake(null);

    try {
      // Connect wallet
      await connectAsync(walletKey);
      
      if (!stakeAddress) {
        throw new Error("Failed to get stake address");
      }

      setLastAttemptedStake(stakeAddress);

      // TODO: Implement with Convex action
      // const result = await convex.action('auth.walletAuthenticate', {
      //   mode,
      //   stakeAddress,
      //   changeAddress,
      // });

      return {
        success: true,
        isNewUser: mode === 'register',
      };
    } catch (err: any) {
      const error: WalletAuthError = {
        code: err.code || 'unknown',
        message: getErrorMessage(err.code || 'unknown'),
        attemptedStakeAddress: lastAttemptedStake || undefined,
      };
      
      toast.error(error.message);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Link wallet to existing account
  const linkWallet = async (walletKey: string): Promise<WalletAuthResult> => {
    return authenticate({ mode: 'link', walletKey });
  };

  // Unlink wallet
  const unlinkWallet = async (): Promise<void> => {
    // TODO: Implement with Convex mutation
    // await convex.mutation('auth.unlinkWallet', {});
    toast.success('Wallet unlinked');
  };

  return {
    authenticate,
    linkWallet,
    unlinkWallet,
    disconnect,
    isConnected,
    isConnecting,
    stakeAddress,
    changeAddress,
    installedExtensions,
    isExtensionsLoading,
    lastAttemptedStake,
  };
}

// Type guard for wallet auth errors
export function isWalletAuthError(error: unknown): error is WalletAuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

// Format stake address for display
export function formatStakeAddress(address: string | null | undefined): string {
  if (!address) return '';
  if (address.length <= 20) return address;
  return `${address.slice(0, 10)}...${address.slice(-10)}`;
}
