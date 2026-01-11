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

      // Check if user is a verified creator
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_verified_creator')
        .eq('id', user.id)
        .single();

      const isVerified = profile?.is_verified_creator ?? false;

      // Auto-approve if user is verified
      const status = isVerified ? 'approved' : 'pending';
      const reviewed_by = isVerified ? user.id : null;
      const reviewed_at = isVerified ? new Date().toISOString() : null;

      const { error } = await (supabase
        .from('ambassador_requests' as any)
        .upsert({
          user_id: user.id,
          twitter_link: twitterLink,
          status,
          rejection_reason: null,
          reviewed_by,
          reviewed_at,
        }, {
          onConflict: 'user_id'
        }));

      if (error) throw error;

      // If auto-approved, also add the ambassador role
      if (isVerified) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: user.id,
            role: 'ambassador' as any,
          }, {
            onConflict: 'user_id,role'
          });

      if (roleError) {
        console.error('Failed to add ambassador role:', roleError);
        throw new Error('Failed to grant ambassador role. Please try again.');
      }
      }

      return { isVerified };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-ambassador-request'] });
      queryClient.invalidateQueries({ queryKey: ['is-ambassador'] });
      if (data?.isVerified) {
        toast.success('Ambassador role granted! You can now access the ambassador dashboard.');
      } else {
        toast.success('Ambassador request submitted successfully!');
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit request: ${error.message}`);
    },
  });
}
