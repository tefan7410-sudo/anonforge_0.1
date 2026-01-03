import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentIntent {
  paymentId: string;
  address: string;
  amountLovelace: number;
  amountAda: number;
  displayAmount: string;
  credits: number;
  expiresAt: string;
}

export interface PendingPayment {
  id: string;
  tier_id: string;
  credits_amount: number;
  price_ada: number;
  expected_amount_lovelace: number;
  status: string;
  tx_hash: string | null;
  created_at: string;
  expires_at: string;
  completed_at: string | null;
}

export function useCreatePaymentIntent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tierId: string): Promise<PaymentIntent> => {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { tierId },
      });

      if (error) {
        console.error('Payment intent error:', error);
        throw new Error(error.message || 'Failed to create payment intent');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data as PaymentIntent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
    },
  });
}

export function usePaymentStatus(paymentId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['payment-status', paymentId],
    queryFn: async (): Promise<PendingPayment | null> => {
      if (!paymentId) return null;

      const { data, error } = await supabase
        .from('pending_credit_payments')
        .select('*')
        .eq('id', paymentId)
        .maybeSingle();

      if (error) {
        console.error('Payment status error:', error);
        throw error;
      }

      return data as PendingPayment | null;
    },
    enabled: enabled && !!paymentId,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Poll every 5 seconds while pending
      if (data?.status === 'pending') {
        return 5000;
      }
      // Stop polling when completed or expired
      return false;
    },
  });
}

export function usePendingPayments() {
  return useQuery({
    queryKey: ['pending-payments'],
    queryFn: async (): Promise<PendingPayment[]> => {
      const { data, error } = await supabase
        .from('pending_credit_payments')
        .select('*')
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Pending payments error:', error);
        throw error;
      }

      return (data || []) as PendingPayment[];
    },
  });
}

export function useCancelPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('pending_credit_payments')
        .update({ status: 'expired' })
        .eq('id', paymentId)
        .eq('status', 'pending');

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
    },
  });
}
