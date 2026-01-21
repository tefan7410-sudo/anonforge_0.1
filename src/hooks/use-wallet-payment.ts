import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@ada-anvil/weld/react';
import { STORAGE_KEYS } from '@ada-anvil/weld/server';
import { toast } from 'sonner';

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

// Get stored wallet key for reconnection
function getLastWalletKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEYS.connectedWallet);
}

export function useWalletPayment() {
  // Select wallet state using useWallet hook
  const handler = useWallet('handler');
  const changeAddress = useWallet('changeAddressBech32');
  const isConnected = useWallet('isConnected');
  const isConnectingWallet = useWallet('isConnectingTo');
  const connectAsync = useWallet('connectAsync');
  
  const [step, setStep] = useState<WalletPaymentStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [creditsAdded, setCreditsAdded] = useState<number>(0);

  // Auto-reconnect to last wallet
  useEffect(() => {
    const lastKey = getLastWalletKey();
    if (lastKey && !isConnected && !isConnectingWallet) {
      connectAsync(lastKey).catch(() => {
        // Silent fail - user can manually connect
      });
    }
  }, [isConnected, isConnectingWallet, connectAsync]);

  const payWithWallet = useCallback(async (tierId: string) => {
    setStep('idle');
    setError(null);
    setTxHash(null);
    setCreditsAdded(0);

    try {
      // TODO: Implement with Convex action
      // 1. Build transaction
      setStep('building');
      // const buildResult = await convex.action('payments.buildWalletTransaction', { tierId });
      
      // 2. Sign transaction
      setStep('signing');
      // const signedTx = await handler.signTx(buildResult.unsignedTx);
      
      // 3. Submit transaction
      setStep('submitting');
      // const submitResult = await convex.action('payments.submitWalletTransaction', { signedTx });
      
      setStep('complete');
      toast.success('Payment successful!');
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      setStep('error');
      toast.error(err.message || 'Payment failed');
    }
  }, [handler]);

  return {
    step,
    error,
    txHash,
    creditsAdded,
    isConnected,
    isConnectingWallet,
    changeAddress,
    payWithWallet,
    connectWallet: connectAsync,
  };
}
