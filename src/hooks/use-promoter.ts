import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PromoterRequest {
  id: string;
  user_id: string;
  reason: string | null;
  portfolio_links: string[];
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Check if user has promoter role
export function useIsPromoter(userId?: string) {
  return useQuery({
    queryKey: ['is-promoter', userId],
    queryFn: async () => {
      if (!userId) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'promoter')
        .maybeSingle();

      if (error) {
        console.error('Error checking promoter status:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!userId,
  });
}

// Get current user's promoter request
export function useMyPromoterRequest() {
  return useQuery({
    queryKey: ['my-promoter-request'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('promoter_requests')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching promoter request:', error);
        return null;
      }

      return data as PromoterRequest | null;
    },
  });
}

// Submit a new promoter request
export function useSubmitPromoterRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reason, portfolioLinks }: { reason: string; portfolioLinks?: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('promoter_requests')
        .upsert({
          user_id: user.id,
          reason,
          portfolio_links: portfolioLinks || [],
          status: 'pending',
          rejection_reason: null,
          reviewed_by: null,
          reviewed_at: null,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-promoter-request'] });
      toast.success('Promoter request submitted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit request: ${error.message}`);
    },
  });
}
