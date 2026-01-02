import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VerificationRequest {
  id: string;
  user_id: string;
  twitter_handle: string;
  bio: string | null;
  portfolio_links: string[];
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Get current user's verification request
export function useMyVerificationRequest() {
  return useQuery({
    queryKey: ['my-verification-request'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('creator_verification_requests')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching verification request:', error);
        throw error;
      }

      return data as VerificationRequest | null;
    },
  });
}

// Submit a new verification request
export function useSubmitVerificationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      twitterHandle, 
      bio, 
      portfolioLinks 
    }: { 
      twitterHandle: string; 
      bio?: string; 
      portfolioLinks?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('creator_verification_requests')
        .upsert({
          user_id: user.id,
          twitter_handle: twitterHandle,
          bio: bio || null,
          portfolio_links: portfolioLinks || [],
          status: 'pending',
          rejection_reason: null,
          reviewed_by: null,
          reviewed_at: null,
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-verification-request'] });
      toast.success('Verification request submitted!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit: ${error.message}`);
    },
  });
}

// Check if user is a verified creator (from profile)
export function useIsVerifiedCreator(userId?: string) {
  return useQuery({
    queryKey: ['is-verified-creator', userId],
    queryFn: async () => {
      if (!userId) return false;

      const { data, error } = await supabase
        .from('profiles')
        .select('is_verified_creator')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking verified status:', error);
        return false;
      }

      return data?.is_verified_creator ?? false;
    },
    enabled: !!userId,
  });
}
