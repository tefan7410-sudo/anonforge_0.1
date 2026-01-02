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

// Toggle founder verified status
export function useToggleFounderVerified() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      productPageId, 
      verified, 
      founderTwitter,
      ownerId 
    }: { 
      productPageId: string; 
      verified: boolean; 
      founderTwitter?: string | null;
      ownerId: string;
    }) => {
      // Update verification status
      const { error } = await supabase
        .from('product_pages')
        .update({ founder_verified: verified })
        .eq('id', productPageId);

      if (error) throw error;

      // Handle verified twitter handle claim/release
      if (founderTwitter) {
        const handle = founderTwitter.replace('@', '').toLowerCase();
        if (verified) {
          // Claim the twitter handle
          const { data: { user } } = await supabase.auth.getUser();
          await supabase
            .from('verified_twitter_handles')
            .upsert({
              twitter_handle: handle,
              user_id: ownerId,
              verified_by: user?.id,
            }, { onConflict: 'twitter_handle' });
        } else {
          // Release the twitter handle
          await supabase
            .from('verified_twitter_handles')
            .delete()
            .eq('twitter_handle', handle);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      queryClient.invalidateQueries({ queryKey: ['pending-collections'] });
      toast.success('Verification status updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
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
