import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
import { CREDIT_COSTS } from '@/lib/credit-constants';

interface UserCredits {
  free_credits: number;
  purchased_credits: number;
  next_reset_at: string;
}

export function useCredits() {
  const { user } = useAuth();

  const credits = useQuery(
    api.credits.get,
    user?.id ? { userId: user.id } : "skip"
  );

  return {
    data: credits as UserCredits | null | undefined,
    isLoading: credits === undefined,
    error: null,
  };
}

export function useCreditBalance() {
  const { data: credits, isLoading, error } = useCredits();

  const totalCredits = credits 
    ? credits.free_credits + credits.purchased_credits 
    : 0;

  const fullResGenerationsRemaining = Math.floor(totalCredits / CREDIT_COSTS.FULL_RESOLUTION);
  const previewGenerationsRemaining = Math.floor(totalCredits / CREDIT_COSTS.PREVIEW);

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

export function useDeductCredits() {
  const { user } = useAuth();
  const deductCredits = useMutation(api.credits.deduct);

  return {
    mutateAsync: async ({
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

      await deductCredits({
        userId: user.id,
        amount,
        generationType,
        description,
        generationId,
      });

      return true;
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useCreditTransactions(limit = 20) {
  const { user } = useAuth();

  const transactions = useQuery(
    api.credits.getTransactions,
    user?.id ? { userId: user.id } : "skip"
  );

  return {
    data: transactions || [],
    isLoading: transactions === undefined,
    error: null,
  };
}

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
