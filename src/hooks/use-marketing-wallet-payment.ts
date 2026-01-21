import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@ada-anvil/weld/react';
import { STORAGE_KEYS } from '@ada-anvil/weld/server';
import { toast } from 'sonner';

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

  // Auto-reconnect to last wallet
  useEffect(() => {
    const lastKey = getLastWalletKey();
    if (lastKey && !isConnected && !isConnectingWallet) {
      connectAsync(lastKey).catch(() => {
        // Silent fail - user can manually connect
      });
    }
  }, [isConnected, isConnectingWallet, connectAsync]);

  const payWithWallet = useCallback(async (data: {
    projectId: string;
    durationDays: number;
    startDate: string;
    endDate: string;
    priceAda: number;
  }) => {
    setStep('idle');
    setError(null);
    setTxHash(null);
    setStartDate(null);
    setEndDate(null);

    try {
      // TODO: Implement with Convex action
      // 1. Build transaction
      setStep('building');
      // const buildResult = await convex.action('marketing.buildWalletTransaction', data);
      
      // 2. Sign transaction
      setStep('signing');
      // const signedTx = await handler.signTx(buildResult.unsignedTx);
      
      // 3. Submit transaction
      setStep('submitting');
      // const submitResult = await convex.action('marketing.submitWalletTransaction', { signedTx });
      
      setStep('complete');
      setStartDate(data.startDate);
      setEndDate(data.endDate);
      toast.success('Marketing payment successful!');
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
    startDate,
    endDate,
    isConnected,
    isConnectingWallet,
    changeAddress,
    payWithWallet,
    connectWallet: connectAsync,
  };
}
