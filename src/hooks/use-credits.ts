import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CREDIT_COSTS, MONTHLY_FREE_CREDITS } from '@/lib/credit-constants';

interface UserCredits {
  free_credits: number;
  purchased_credits: number;
  next_reset_at: string;
}

interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  generation_type: string | null;
  description: string | null;
  created_at: string;
}

// Fetch and auto-reset credits if needed
export function useCredits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['credits', user?.id],
    queryFn: async (): Promise<UserCredits | null> => {
      if (!user?.id) return null;

      // Call the reset check function which also creates credits if missing
      const { data, error } = await supabase.rpc('check_and_reset_credits', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching credits:', error);
        throw error;
      }

      if (data && data.length > 0) {
        return {
          free_credits: Number(data[0].free_credits),
          purchased_credits: Number(data[0].purchased_credits),
          next_reset_at: data[0].next_reset_at,
        };
      }

      return null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minute
  });
}

// Compute derived credit values
export function useCreditBalance() {
  const { data: credits, isLoading, error } = useCredits();

  const totalCredits = credits 
    ? credits.free_credits + credits.purchased_credits 
    : 0;

  const fullResGenerationsRemaining = Math.floor(totalCredits / CREDIT_COSTS.FULL_RESOLUTION);
  const previewGenerationsRemaining = Math.floor(totalCredits / CREDIT_COSTS.PREVIEW);

  // Calculate days until reset
  const daysUntilReset = credits?.next_reset_at
    ? Math.max(0, Math.ceil((new Date(credits.next_reset_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    credits,
    isLoading,
    error,
    totalCredits,
    freeCredits: credits?.free_credits ?? 0,
    purchasedCredits: credits?.purchased_credits ?? 0,
    fullResGenerationsRemaining,
    previewGenerationsRemaining,
    nextResetAt: credits?.next_reset_at,
    daysUntilReset,
    isLowCredits: totalCredits < 10,
  };
}

// Deduct credits for generation
export function useDeductCredits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      amount,
      generationType,
      description,
      generationId,
    }: {
      amount: number;
      generationType: 'full_resolution' | 'preview';
      description?: string;
      generationId?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('deduct_credits', {
        p_user_id: user.id,
        p_amount: amount,
        p_generation_type: generationType,
        p_description: description || null,
        p_generation_id: generationId || null,
      });

      if (error) throw error;
      if (!data) throw new Error('Insufficient credits');

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['credit-transactions', user?.id] });
    },
  });
}

// Fetch transaction history
export function useCreditTransactions(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['credit-transactions', user?.id, limit],
    queryFn: async (): Promise<CreditTransaction[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}

// Check if user has enough credits for a generation
export function useHasEnoughCredits(batchSize: number, isFullResolution: boolean) {
  const { totalCredits } = useCreditBalance();
  const costPerImage = isFullResolution ? CREDIT_COSTS.FULL_RESOLUTION : CREDIT_COSTS.PREVIEW;
  const creditsNeeded = batchSize * costPerImage;
  return {
    hasEnough: totalCredits >= creditsNeeded,
    creditsNeeded,
    shortfall: Math.max(0, creditsNeeded - totalCredits),
  };
}
