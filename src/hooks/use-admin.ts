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
  max_supply: number | null;
  created_at: string;
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
          max_supply,
          created_at,
          project:projects!inner(id, name, owner_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as AdminCollection[];
    },
  });
}

// Toggle founder verified status
export function useToggleFounderVerified() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productPageId, verified }: { productPageId: string; verified: boolean }) => {
      const { error } = await supabase
        .from('product_pages')
        .update({ founder_verified: verified })
        .eq('id', productPageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
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
      queryClient.invalidateQueries({ queryKey: ['marketplace-collections'] });
      toast.success('Collection visibility updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}
