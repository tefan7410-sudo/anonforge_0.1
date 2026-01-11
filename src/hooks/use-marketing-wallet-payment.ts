import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@ada-anvil/weld/react';
import { STORAGE_KEYS } from '@ada-anvil/weld/server';
import { supabase } from '@/integrations/supabase/client';

export type MarketingWalletPaymentStep = 'idle' | 'building' | 'signing' | 'submitting' | 'complete' | 'error';

interface BuildMarketingTransactionResult {
  paymentId: string;
  unsignedTx: string;
  priceAda: number;
  startDate: string;
  endDate: string;
}

interface SubmitMarketingTransactionResult {
  success: boolean;
  txHash: string;
  startDate: string;
  endDate: string;
  message: string;
}

// Get stored wallet key for reconnection
function getLastWalletKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEYS.connectedWallet);
}

export function useMarketingWalletPayment() {
  const queryClient = useQueryClient();
  
  // Select wallet state using useWallet hook
  const handler = useWallet('handler');
  const changeAddress = useWallet('changeAddressBech32');
  const isConnected = useWallet('isConnected');
  const isConnectingWallet = useWallet('isConnectingTo');
  const connectAsync = useWallet('connectAsync');
  
  const [step, setStep] = useState<MarketingWalletPaymentStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Debug logging for wallet state changes
  useEffect(() => {
    console.log('[MarketingWalletPayment] State:', { 
      isConnected, 
      hasHandler: !!handler, 
      hasChangeAddress: !!changeAddress,
      isConnectingTo: isConnectingWallet 
    });
  }, [isConnected, handler, changeAddress, isConnectingWallet]);

  // Computed state - wallet is ready when connected AND has handler
  const isWalletReady = isConnected && !!handler;
  const lastWalletKey = getLastWalletKey();

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setTxHash(null);
    setStartDate(null);
    setEndDate(null);
  }, []);

  // Connect to a specific wallet (for reconnection)
  const connectWallet = useCallback(async (walletKey: string) => {
    console.log('[MarketingWalletPayment] Connecting to wallet:', walletKey);
    try {
      await connectAsync(walletKey);
      console.log('[MarketingWalletPayment] Connected successfully');
    } catch (err) {
      console.error('[MarketingWalletPayment] Connection failed:', err);
      throw err;
    }
  }, [connectAsync]);

  const buildTransaction = useMutation({
    mutationFn: async (marketingRequestId: string): Promise<BuildMarketingTransactionResult> => {
      if (!handler || !changeAddress) {
        throw new Error('Wallet not connected');
      }

      setStep('building');
      setError(null);

      // Get UTXOs from wallet
      console.log('Fetching UTXOs from wallet...');
      const utxos = await handler.getUtxos();
      
      if (!utxos || utxos.length === 0) {
        throw new Error('No UTXOs available in wallet');
      }

      console.log('Got UTXOs:', utxos.length);

      // Call edge function to build transaction
      const { data, error } = await supabase.functions.invoke('anvil-build-marketing-transaction', {
        body: { 
          marketingRequestId, 
          changeAddress, 
          utxos 
        },
      });

      if (error) {
        console.error('Build marketing transaction error:', error);
        throw new Error(error.message || 'Failed to build transaction');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onError: (err: Error) => {
      setStep('error');
      setError(err.message);
    },
  });

  const signAndSubmit = useMutation({
    mutationFn: async ({ paymentId, unsignedTx }: { paymentId: string; unsignedTx: string }): Promise<SubmitMarketingTransactionResult> => {
      if (!handler) {
        throw new Error('Wallet not connected');
      }

      // Sign transaction - returns witness set (signatures), NOT full signed tx
      setStep('signing');
      console.log('Requesting wallet signature (witness set)...');
      
      let signature: string;
      try {
        // Don't pass true - we want just the witness set, not a full signed tx
        signature = await handler.signTx(unsignedTx);
      } catch (signError: any) {
        console.error('Wallet signing error:', signError);
        if (signError.code === 2 || signError.message?.includes('declined') || signError.message?.includes('cancel')) {
          throw new Error('Transaction was cancelled by user');
        }
        throw new Error(signError.message || 'Failed to sign transaction');
      }

      console.log('Signature obtained, submitting to Anvil...');
      console.log('Signature CBOR prefix:', signature.substring(0, 10));
      setStep('submitting');

      // Submit unsigned transaction + signatures (Anvil-documented flow)
      const { data, error } = await supabase.functions.invoke('anvil-submit-marketing-transaction', {
        body: { 
          paymentId, 
          transaction: unsignedTx,
          signatures: [signature]
        },
      });

      if (error) {
        console.error('Submit marketing transaction error:', error);
        throw new Error(error.message || 'Failed to submit transaction');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: (data) => {
      setStep('complete');
      setTxHash(data.txHash);
      setStartDate(data.startDate);
      setEndDate(data.endDate);
      
      // Invalidate marketing queries to refresh state
      queryClient.invalidateQueries({ queryKey: ['marketing-request'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-bookings'] });
    },
    onError: (err: Error) => {
      setStep('error');
      setError(err.message);
    },
  });

  const purchaseMarketingWithWallet = async (marketingRequestId: string) => {
    try {
      reset();
      
      // Step 1: Build transaction
      const buildResult = await buildTransaction.mutateAsync(marketingRequestId);
      
      // Step 2: Sign and submit
      const submitResult = await signAndSubmit.mutateAsync({
        paymentId: buildResult.paymentId,
        unsignedTx: buildResult.unsignedTx,
      });

      return submitResult;
    } catch (err) {
      // Error is already handled in the mutations
      throw err;
    }
  };

  return {
    // State - use isWalletReady for UI decisions
    isWalletConnected: isWalletReady,
    hasHandler: !!handler,
    isConnected, // raw connected state for debugging
    lastWalletKey,
    step,
    error,
    txHash,
    startDate,
    endDate,
    
    // Actions
    purchaseMarketingWithWallet,
    connectWallet,
    reset,
    
    // Loading states
    isBuilding: buildTransaction.isPending,
    isSigning: step === 'signing',
    isSubmitting: signAndSubmit.isPending && step === 'submitting',
    isProcessing: step !== 'idle' && step !== 'complete' && step !== 'error',
    isConnecting: !!isConnectingWallet,
  };
}
