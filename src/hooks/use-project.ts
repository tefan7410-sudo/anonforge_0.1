import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  token_prefix: string;
  token_start_number: number;
  settings: Record<string, unknown>;
  last_modified: string;
  created_at: string;
}

export interface Category {
  id: string;
  project_id: string;
  name: string;
  display_name: string;
  order_index: number;
  created_at: string;
}

export interface Layer {
  id: string;
  category_id: string;
  filename: string;
  trait_name: string;
  display_name: string;
  storage_path: string;
  thumbnail_path: string | null;
  rarity_weight: number;
  order_index: number;
  created_at: string;
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data as Project;
    },
    enabled: !!projectId,
  });
}

export function useCategories(projectId: string) {
  return useQuery({
    queryKey: ['categories', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index');

      if (error) throw error;
      return data as Category[];
    },
    enabled: !!projectId,
  });
}

export function useLayers(categoryId: string) {
  return useQuery({
    queryKey: ['layers', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('layers')
        .select('*')
        .eq('category_id', categoryId)
        .order('order_index');

      if (error) throw error;
      return data as Layer[];
    },
    enabled: !!categoryId,
  });
}

export function useAllLayers(projectId: string) {
  return useQuery({
    queryKey: ['all-layers', projectId],
    queryFn: async () => {
      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .eq('project_id', projectId);

      if (!categories || categories.length === 0) return [];

      const categoryIds = categories.map((c) => c.id);
      const { data, error } = await supabase
        .from('layers')
        .select('*')
        .in('category_id', categoryIds)
        .order('order_index');

      if (error) throw error;
      return data as Layer[];
    },
    enabled: !!projectId,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      projectId,
      name,
      displayName,
      orderIndex,
    }: {
      projectId: string;
      name: string;
      displayName: string;
      orderIndex: number;
    }) => {
      const { data, error } = await supabase
        .from('categories')
        .insert({ project_id: projectId, name, display_name: displayName, order_index: orderIndex })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories', variables.projectId] });
      toast({ title: 'Category created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create category', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      displayName,
      orderIndex,
    }: {
      id: string;
      projectId: string;
      displayName?: string;
      orderIndex?: number;
    }) => {
      const updates: Partial<Category> = {};
      if (displayName !== undefined) updates.display_name = displayName;
      if (orderIndex !== undefined) updates.order_index = orderIndex;

      const { error } = await supabase.from('categories').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories', variables.projectId] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update category', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories', variables.projectId] });
      toast({ title: 'Category deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete category', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCreateLayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      filename,
      traitName,
      displayName,
      storagePath,
      orderIndex,
    }: {
      categoryId: string;
      projectId: string;
      filename: string;
      traitName: string;
      displayName: string;
      storagePath: string;
      orderIndex: number;
    }) => {
      const { data, error } = await supabase
        .from('layers')
        .insert({
          category_id: categoryId,
          filename,
          trait_name: traitName,
          display_name: displayName,
          storage_path: storagePath,
          order_index: orderIndex,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['layers', variables.categoryId] });
      queryClient.invalidateQueries({ queryKey: ['all-layers', variables.projectId] });
    },
  });
}

export function useUpdateLayerWeight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      rarityWeight,
    }: {
      id: string;
      categoryId: string;
      projectId: string;
      rarityWeight: number;
    }) => {
      const { error } = await supabase
        .from('layers')
        .update({ rarity_weight: rarityWeight })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['layers', variables.categoryId] });
      queryClient.invalidateQueries({ queryKey: ['all-layers', variables.projectId] });
    },
  });
}

export function useDeleteLayer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; categoryId: string; projectId: string; storagePath: string }) => {
      // Delete from storage first
      await supabase.storage.from('layers').remove([storagePath]);
      
      // Then delete from database
      const { error } = await supabase.from('layers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['layers', variables.categoryId] });
      queryClient.invalidateQueries({ queryKey: ['all-layers', variables.projectId] });
      toast({ title: 'Layer deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete layer', description: error.message, variant: 'destructive' });
    },
  });
}
