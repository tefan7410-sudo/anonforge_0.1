import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@ada-anvil/weld/react';
import { supabase } from '@/integrations/supabase/client';

export type WalletPaymentStep = 'idle' | 'building' | 'signing' | 'submitting' | 'complete' | 'error';

interface BuildTransactionResult {
  paymentId: string;
  unsignedTx: string;
  tier: {
    id: string;
    credits: number;
    priceAda: number;
  };
}

interface SubmitTransactionResult {
  success: boolean;
  txHash: string;
  credits: number;
  message: string;
}

export function useWalletPayment() {
  const queryClient = useQueryClient();
  const handler = useWallet('handler');
  const changeAddress = useWallet('changeAddressBech32');
  const isConnected = useWallet('isConnected');
  
  const [step, setStep] = useState<WalletPaymentStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [creditsAdded, setCreditsAdded] = useState<number>(0);

  const reset = () => {
    setStep('idle');
    setError(null);
    setTxHash(null);
    setCreditsAdded(0);
  };

  const buildTransaction = useMutation({
    mutationFn: async (tierId: string): Promise<BuildTransactionResult> => {
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
      const { data, error } = await supabase.functions.invoke('anvil-build-transaction', {
        body: { 
          tierId, 
          changeAddress, 
          utxos 
        },
      });

      if (error) {
        console.error('Build transaction error:', error);
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
    mutationFn: async ({ paymentId, unsignedTx }: { paymentId: string; unsignedTx: string }): Promise<SubmitTransactionResult> => {
      if (!handler) {
        throw new Error('Wallet not connected');
      }

      // Sign transaction
      setStep('signing');
      console.log('Requesting wallet signature...');
      
      let signedTx: string;
      try {
        signedTx = await handler.signTx(unsignedTx, true);
      } catch (signError: any) {
        console.error('Wallet signing error:', signError);
        if (signError.code === 2 || signError.message?.includes('declined') || signError.message?.includes('cancel')) {
          throw new Error('Transaction was cancelled by user');
        }
        throw new Error(signError.message || 'Failed to sign transaction');
      }

      console.log('Transaction signed, submitting...');
      setStep('submitting');

      // Submit signed transaction
      const { data, error } = await supabase.functions.invoke('anvil-submit-transaction', {
        body: { 
          paymentId, 
          signedTransaction: signedTx 
        },
      });

      if (error) {
        console.error('Submit transaction error:', error);
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
      setCreditsAdded(data.credits);
      
      // Invalidate credit queries to refresh balance
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      queryClient.invalidateQueries({ queryKey: ['credit-transactions'] });
    },
    onError: (err: Error) => {
      setStep('error');
      setError(err.message);
    },
  });

  const purchaseWithWallet = async (tierId: string) => {
    try {
      reset();
      
      // Step 1: Build transaction
      const buildResult = await buildTransaction.mutateAsync(tierId);
      
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
    // State
    isWalletConnected: isConnected,
    hasWallet: !!handler,
    step,
    error,
    txHash,
    creditsAdded,
    
    // Actions
    purchaseWithWallet,
    reset,
    
    // Loading states
    isBuilding: buildTransaction.isPending,
    isSigning: step === 'signing',
    isSubmitting: signAndSubmit.isPending && step === 'submitting',
    isProcessing: step !== 'idle' && step !== 'complete' && step !== 'error',
  };
}
