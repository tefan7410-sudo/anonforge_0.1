import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HeroBackground {
  id: string;
  image_url: string;
  storage_path: string;
  display_order: number;
  is_active: boolean;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

// Fetch active hero backgrounds for the landing page
export function useHeroBackgrounds() {
  return useQuery({
    queryKey: ['hero-backgrounds', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_backgrounds')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as HeroBackground[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Fetch all hero backgrounds for admin panel
export function useAdminHeroBackgrounds() {
  return useQuery({
    queryKey: ['hero-backgrounds', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_backgrounds')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as HeroBackground[];
    },
  });
}

// Upload a new hero background
export function useUploadHeroBackground() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const storagePath = `hero-backgrounds/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-assets')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('product-assets')
        .getPublicUrl(storagePath);

      // Get the next display order
      const { data: existing } = await supabase
        .from('hero_backgrounds')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = existing && existing.length > 0 
        ? (existing[0].display_order || 0) + 1 
        : 0;

      // Create database record
      const { data, error } = await supabase
        .from('hero_backgrounds')
        .insert({
          image_url: urlData.publicUrl,
          storage_path: storagePath,
          display_order: nextOrder,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-backgrounds'] });
      toast.success('Background uploaded successfully');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Failed to upload background');
    },
  });
}

// Delete a hero background
export function useDeleteHeroBackground() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('product-assets')
        .remove([storagePath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        // Continue with DB delete even if storage fails
      }

      // Delete from database
      const { error } = await supabase
        .from('hero_backgrounds')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-backgrounds'] });
      toast.success('Background deleted');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete background');
    },
  });
}

// Toggle active status
export function useToggleHeroBackgroundActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('hero_backgrounds')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-backgrounds'] });
    },
    onError: (error) => {
      console.error('Toggle error:', error);
      toast.error('Failed to update background');
    },
  });
}

// Reorder backgrounds
export function useReorderHeroBackgrounds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({
        id,
        display_order: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('hero_backgrounds')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-backgrounds'] });
    },
    onError: (error) => {
      console.error('Reorder error:', error);
      toast.error('Failed to reorder backgrounds');
    },
  });
}
