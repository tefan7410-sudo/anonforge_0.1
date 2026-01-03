import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { validateImageUpload } from '@/lib/image-validation';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  twitter_handle: string | null;
  is_verified_creator: boolean;
  created_at: string;
  updated_at: string;
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      
      // If profile doesn't exist, create one
      if (!data) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const newProfile = {
            id: userId,
            email: userData.user.email || '',
            display_name: userData.user.email?.split('@')[0] || null,
          };
          
          const { data: created, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();
            
          if (createError) throw createError;
          return created as Profile;
        }
        throw new Error('Could not create profile');
      }
      
      return data as Profile;
    },
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      displayName,
      avatarUrl,
    }: {
      userId: string;
      displayName?: string;
      avatarUrl?: string;
    }) => {
      const updates: { display_name?: string; avatar_url?: string; updated_at: string } = {
        updated_at: new Date().toISOString(),
      };
      
      if (displayName !== undefined) updates.display_name = displayName;
      if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}

export function useUploadAvatar() {
  return useMutation({
    mutationFn: async ({ userId, file }: { userId: string; file: File }) => {
      // Validate image
      const validation = await validateImageUpload(file, 'avatar');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('layers')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('layers').getPublicUrl(fileName);
      return data.publicUrl;
    },
  });
}

/**
 * Sync profile avatar to all owned collections
 */
export function useSyncProfileToCollections() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, avatarUrl, displayName }: { 
      userId: string; 
      avatarUrl?: string; 
      displayName?: string;
    }) => {
      // Get all projects owned by user
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('owner_id', userId);

      if (projectsError) throw projectsError;
      if (!projects || projects.length === 0) return { updated: 0 };

      const projectIds = projects.map(p => p.id);

      // Update all product pages for these projects
      const updates: Record<string, unknown> = {};
      if (avatarUrl !== undefined) updates.founder_pfp_url = avatarUrl;
      if (displayName !== undefined) updates.founder_name = displayName;

      if (Object.keys(updates).length === 0) return { updated: 0 };

      const { data, error } = await supabase
        .from('product_pages')
        .update(updates)
        .in('project_id', projectIds)
        .select('id');

      if (error) throw error;
      return { updated: data?.length || 0 };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-page'] });
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      // Call the delete-account edge function for proper server-side deletion
      const { data, error } = await supabase.functions.invoke('delete-account', {
        method: 'POST',
      });

      if (error) {
        throw new Error(error.message || 'Failed to delete account');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Sign out after successful deletion
      await supabase.auth.signOut();
      
      return data;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
    },
  });
}
