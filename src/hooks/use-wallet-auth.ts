import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet, useExtensions } from '@ada-anvil/weld/react';
import { supabase } from '@/integrations/supabase/client';

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
  const queryClient = useQueryClient();
  
  const connectAsync = useWallet("connectAsync");
  const disconnect = useWallet("disconnect");
  const isConnected = useWallet("isConnected");
  const stakeAddress = useWallet("stakeAddressBech32");
  const changeAddress = useWallet("changeAddressBech32");
  
  const installedExtensions = useExtensions("supportedArr");
  const isExtensionsLoading = useExtensions("isLoading");

  // Authenticate with wallet - simplified flow (no signing required)
  const authenticate = useMutation({
    mutationFn: async ({ 
      mode, 
      walletKey 
    }: { 
      mode: WalletAuthMode; 
      walletKey: string;
    }): Promise<WalletAuthResult> => {
      setIsConnecting(true);
      setLastAttemptedStake(null);
      
      try {
        // Step 1: Connect to wallet
        const wallet = await connectAsync(walletKey);
        
        // Get stake address (unique identifier for the wallet)
        const stakeAddr = wallet.stakeAddressBech32;
        
        if (!stakeAddr) {
          throw new Error('Could not retrieve stake address from wallet');
        }
        
        // Save the attempted stake address for debugging
        setLastAttemptedStake(stakeAddr);
        
        // Get payment address for display
        const paymentAddr = wallet.changeAddressBech32;
        
        // Step 2: Send to backend (no signing required!)
        const { data, error } = await supabase.functions.invoke('wallet-auth', {
          body: {
            mode,
            stakeAddress: stakeAddr,
            paymentAddress: paymentAddr,
          },
        });
        
        if (error) {
          throw new Error(error.message || 'Authentication failed');
        }
        
        // Check for structured error responses (ok: false)
        if (data?.ok === false) {
          const walletError: WalletAuthError = {
            code: data.code || 'unknown_error',
            message: getErrorMessage(data.code || data.message),
            attemptedStakeAddress: data.attemptedStakeAddress || stakeAddr,
          };
          throw walletError;
        }
        
        // Legacy error format (for backwards compatibility)
        if (data?.error) {
          const walletError: WalletAuthError = {
            code: data.error,
            message: getErrorMessage(data.error),
            attemptedStakeAddress: stakeAddr,
          };
          throw walletError;
        }
        
        // Step 3: Handle different modes
        if (mode === 'link') {
          // Just linking wallet to existing account
          queryClient.invalidateQueries({ queryKey: ['profile'] });
          return { 
            success: true, 
            message: 'Wallet linked successfully' 
          };
        }
        
        // For login/register, set the session
        if (data?.access_token && data?.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          });
          
          if (sessionError) {
            throw new Error('Failed to establish session');
          }
        }
        
        return { 
          success: true, 
          isNewUser: data?.isNewUser,
          message: data?.isNewUser ? 'Account created successfully' : 'Logged in successfully'
        };
        
      } finally {
        setIsConnecting(false);
      }
    },
    onError: (error) => {
      console.error('Wallet auth error:', error);
      // Disconnect wallet on error
      disconnect();
    },
  });

  // Disconnect wallet from profile
  const unlinkWallet = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          stake_address: null,
          wallet_address: null,
          wallet_connected_at: null,
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Disconnect the wallet
      disconnect();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    // State
    isConnecting: isConnecting || authenticate.isPending,
    isConnected,
    stakeAddress,
    changeAddress,
    installedExtensions,
    isExtensionsLoading,
    lastAttemptedStake,
    
    // Actions
    authenticate: authenticate.mutateAsync,
    unlinkWallet: unlinkWallet.mutateAsync,
    disconnect,
    
    // Status
    error: authenticate.error,
    isError: authenticate.isError,
  };
}

// Helper to format stake address for display
export function formatStakeAddress(address: string | undefined): string {
  if (!address) return '';
  if (address.length <= 20) return address;
  return `${address.slice(0, 12)}...${address.slice(-8)}`;
}

// Helper to format payment address for display
export function formatPaymentAddress(address: string | undefined): string {
  if (!address) return '';
  if (address.length <= 20) return address;
  return `${address.slice(0, 12)}...${address.slice(-8)}`;
}

// Type guard to check if an error is a WalletAuthError
export function isWalletAuthError(error: unknown): error is WalletAuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}
