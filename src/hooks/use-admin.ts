import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminCollection {
  id: string;
  project_id: string;
  banner_url: string | null;
  logo_url: string | null;
  tagline: string | null;
  is_live: boolean;
  is_hidden: boolean;
  founder_verified: boolean;
  founder_name: string | null;
  founder_twitter: string | null;
  max_supply: number | null;
  created_at: string;
  scheduled_launch_at: string | null;
  admin_approved: boolean;
  rejection_reason: string | null;
  project: {
    id: string;
    name: string;
    owner_id: string;
  };
}

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
  profile?: {
    id: string;
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

// Check if current user is an admin
export function useIsAdmin() {
  return useQuery({
    queryKey: ['is-admin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }

      return !!data;
    },
  });
}

// Get all collections for admin dashboard
export function useAdminCollections() {
  return useQuery({
    queryKey: ['admin-collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_pages')
        .select(`
          id,
          project_id,
          banner_url,
          logo_url,
          tagline,
          is_live,
          is_hidden,
          founder_verified,
          founder_name,
          founder_twitter,
          max_supply,
          created_at,
          scheduled_launch_at,
          admin_approved,
          rejection_reason,
          project:projects!inner(id, name, owner_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as AdminCollection[];
    },
  });
}

// Get pending collections awaiting approval
export function usePendingCollections() {
  return useQuery({
    queryKey: ['pending-collections'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('product_pages')
        .select(`
          id,
          project_id,
          banner_url,
          logo_url,
          tagline,
          is_live,
          is_hidden,
          founder_verified,
          founder_name,
          founder_twitter,
          max_supply,
          created_at,
          scheduled_launch_at,
          admin_approved,
          rejection_reason,
          project:projects!inner(id, name, owner_id)
        `)
        .eq('is_live', true)
        .eq('admin_approved', false)
        .gt('scheduled_launch_at', now)
        .order('scheduled_launch_at', { ascending: true });

      if (error) throw error;
      return data as unknown as AdminCollection[];
    },
  });
}

// Get pending verification requests
export function usePendingVerificationRequests() {
  return useQuery({
    queryKey: ['pending-verification-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_verification_requests')
        .select(`
          *,
          profile:profiles!creator_verification_requests_user_id_fkey(id, display_name, email, avatar_url)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        // Fallback without join if the FK doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('creator_verification_requests')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: true });
        
        if (fallbackError) throw fallbackError;
        return fallbackData as unknown as VerificationRequest[];
      }
      return data as unknown as VerificationRequest[];
    },
  });
}

// Toggle collection hidden status
export function useToggleCollectionHidden() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productPageId, hidden }: { productPageId: string; hidden: boolean }) => {
      const { error } = await supabase
        .from('product_pages')
        .update({ is_hidden: hidden })
        .eq('id', productPageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      queryClient.invalidateQueries({ queryKey: ['pending-collections'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-collections'] });
      toast.success('Collection visibility updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}

// Approve a scheduled collection
export function useApproveCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productPageId }: { productPageId: string }) => {
      const { error } = await supabase
        .from('product_pages')
        .update({ 
          admin_approved: true,
          rejection_reason: null,
        })
        .eq('id', productPageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      queryClient.invalidateQueries({ queryKey: ['pending-collections'] });
      toast.success('Collection approved!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });
}

// Reject a scheduled collection
export function useRejectCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productPageId, reason }: { productPageId: string; reason: string }) => {
      const { error } = await supabase
        .from('product_pages')
        .update({ 
          is_live: false,
          admin_approved: false,
          scheduled_launch_at: null,
          rejection_reason: reason,
        })
        .eq('id', productPageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      queryClient.invalidateQueries({ queryKey: ['pending-collections'] });
      toast.success('Collection rejected');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject: ${error.message}`);
    },
  });
}

// Approve a creator verification request
export function useApproveVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, userId }: { requestId: string; userId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update the request status
      const { error: requestError } = await supabase
        .from('creator_verification_requests')
        .update({ 
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Update the profile to mark as verified creator
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_verified_creator: true })
        .eq('id', userId);

      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['is-verified-creator'] });
      toast.success('Creator verified!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to verify: ${error.message}`);
    },
  });
}

// Reject a creator verification request
export function useRejectVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('creator_verification_requests')
        .update({ 
          status: 'rejected',
          rejection_reason: reason,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-verification-request'] });
      toast.success('Verification request rejected');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject: ${error.message}`);
    },
  });
}

// Check if twitter handle is available
export async function checkTwitterHandleAvailable(handle: string, currentUserId: string): Promise<{ available: boolean; claimedBy?: string }> {
  const normalizedHandle = handle.replace('@', '').toLowerCase();
  
  const { data, error } = await supabase
    .from('verified_twitter_handles')
    .select('user_id')
    .eq('twitter_handle', normalizedHandle)
    .maybeSingle();

  if (error) {
    console.error('Error checking twitter handle:', error);
    return { available: true };
  }

  if (!data) {
    return { available: true };
  }

  // Handle is claimed - check if it's by the current user
  return { 
    available: data.user_id === currentUserId,
    claimedBy: data.user_id 
  };
}
