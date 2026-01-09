import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AmbassadorRequest {
  id: string;
  user_id: string;
  reason: string | null;
  portfolio_links: string[];
  twitter_link: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Check if user has ambassador role
export function useIsAmbassador(userId?: string) {
  return useQuery({
    queryKey: ['is-ambassador', userId],
    queryFn: async () => {
      if (!userId) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'ambassador')
        .maybeSingle();

      if (error) {
        console.error('Error checking ambassador status:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!userId,
  });
}

// Get current user's ambassador request
export function useMyAmbassadorRequest() {
  return useQuery({
    queryKey: ['my-ambassador-request'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await (supabase
        .from('ambassador_requests' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle());

      if (error) {
        console.error('Error fetching ambassador request:', error);
        return null;
      }

      return data as unknown as AmbassadorRequest | null;
    },
  });
}

// Submit a new ambassador request
export function useSubmitAmbassadorRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ twitterLink }: { twitterLink: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase
        .from('ambassador_requests' as any)
        .upsert({
          user_id: user.id,
          twitter_link: twitterLink,
          status: 'pending',
          rejection_reason: null,
          reviewed_by: null,
          reviewed_at: null,
        }, {
          onConflict: 'user_id'
        }));

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-ambassador-request'] });
      toast.success('Ambassador request submitted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit request: ${error.message}`);
    },
  });
}
