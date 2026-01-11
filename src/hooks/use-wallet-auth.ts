import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet, useExtensions } from '@ada-anvil/weld/react';
import { supabase } from '@/integrations/supabase/client';

// Browser-compatible string to hex conversion (replaces Node.js Buffer)
function stringToHex(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export type WalletAuthMode = 'login' | 'register' | 'link';

interface WalletAuthResult {
  success: boolean;
  isNewUser?: boolean;
  message?: string;
}

export function useWalletAuth() {
  const [isConnecting, setIsConnecting] = useState(false);
  const queryClient = useQueryClient();
  
  const connectAsync = useWallet("connectAsync");
  const disconnect = useWallet("disconnect");
  const isConnected = useWallet("isConnected");
  const stakeAddress = useWallet("stakeAddressBech32");
  const changeAddress = useWallet("changeAddressBech32");
  
  const installedExtensions = useExtensions("supportedArr");
  const isExtensionsLoading = useExtensions("isLoading");

  // Authenticate with wallet signature
  const authenticate = useMutation({
    mutationFn: async ({ 
      mode, 
      walletKey 
    }: { 
      mode: WalletAuthMode; 
      walletKey: string;
    }): Promise<WalletAuthResult> => {
      setIsConnecting(true);
      
      try {
        // Step 1: Connect to wallet
        const wallet = await connectAsync(walletKey);
        
        // Get stake address (unique identifier for the wallet)
        const stakeAddr = wallet.stakeAddressBech32;
        
        if (!stakeAddr) {
          throw new Error('Could not retrieve stake address from wallet');
        }
        
        // Get payment address for display
        const paymentAddr = wallet.changeAddressBech32;
        
        // Step 2: Create authentication payload
        const payload = JSON.stringify({
          action: mode === 'link' ? 'link_wallet' : 'authenticate',
          uri: window.location.origin,
          timestamp: Date.now(),
          stake_address: stakeAddr,
        });
        
        // Convert payload to hex for CIP-8 signing
        const payloadHex = stringToHex(payload);
        
        // Step 3: Request signature from wallet (CIP-8)
        // signData returns different formats depending on wallet
        const signResult = await wallet.handler.signData(payloadHex);
        
        // Handle different signature return formats
        let signature: string;
        let key: string;
        
        if (typeof signResult === 'string') {
          // Some wallets return just the signature
          signature = signResult;
          key = stakeAddr; // Use stake address as key fallback
        } else if (signResult && typeof signResult === 'object') {
          // Most wallets return { signature, key }
          signature = (signResult as any).signature || signResult;
          key = (signResult as any).key || stakeAddr;
        } else {
          throw new Error('Invalid signature format from wallet');
        }
        
        // Step 4: Send to backend for verification
        const { data, error } = await supabase.functions.invoke('wallet-auth', {
          body: {
            mode,
            signature,
            key,
            stakeAddress: stakeAddr,
            paymentAddress: paymentAddr,
            payload,
          },
        });
        
        if (error) {
          throw new Error(error.message || 'Authentication failed');
        }
        
        if (data?.error) {
          throw new Error(data.error);
        }
        
        // Step 5: Handle different modes
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
