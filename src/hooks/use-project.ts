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
  is_effect_layer: boolean;
}

export interface LayerExclusion {
  id: string;
  layer_id: string;
  excluded_layer_id: string;
  created_at: string;
}

export interface LayerEffect {
  id: string;
  parent_layer_id: string;
  effect_layer_id: string;
  render_order: number;
  created_at: string;
}

export interface LayerSwitch {
  id: string;
  layer_a_id: string;
  layer_b_id: string;
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

export function useAllLayers(projectId: string, includeEffectLayers: boolean = false) {
  return useQuery({
    queryKey: ['all-layers', projectId, includeEffectLayers],
    queryFn: async () => {
      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .eq('project_id', projectId);

      if (!categories || categories.length === 0) return [];

      const categoryIds = categories.map((c) => c.id);
      let query = supabase
        .from('layers')
        .select('*')
        .in('category_id', categoryIds)
        .order('order_index');

      if (!includeEffectLayers) {
        query = query.eq('is_effect_layer', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Layer[];
    },
    enabled: !!projectId,
  });
}

// ==================== LAYER EXCLUSIONS ====================

export function useLayerExclusions(layerId: string) {
  return useQuery({
    queryKey: ['layer-exclusions', layerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('layer_exclusions')
        .select('*')
        .or(`layer_id.eq.${layerId},excluded_layer_id.eq.${layerId}`);

      if (error) throw error;
      return data as LayerExclusion[];
    },
    enabled: !!layerId,
  });
}

export function useAllExclusions(projectId: string) {
  return useQuery({
    queryKey: ['all-exclusions', projectId],
    queryFn: async () => {
      // Get all layers for this project first
      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .eq('project_id', projectId);

      if (!categories || categories.length === 0) return [];

      const categoryIds = categories.map((c) => c.id);
      const { data: layers } = await supabase
        .from('layers')
        .select('id')
        .in('category_id', categoryIds);

      if (!layers || layers.length === 0) return [];

      const layerIds = layers.map((l) => l.id);
      const { data, error } = await supabase
        .from('layer_exclusions')
        .select('*')
        .in('layer_id', layerIds);

      if (error) throw error;
      return data as LayerExclusion[];
    },
    enabled: !!projectId,
  });
}

export function useCreateExclusion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ layerId, excludedLayerId }: { layerId: string; excludedLayerId: string; projectId: string }) => {
      // Create bidirectional exclusion
      const { error } = await supabase.from('layer_exclusions').insert([
        { layer_id: layerId, excluded_layer_id: excludedLayerId },
        { layer_id: excludedLayerId, excluded_layer_id: layerId },
      ]);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['layer-exclusions'] });
      queryClient.invalidateQueries({ queryKey: ['all-exclusions', variables.projectId] });
      toast({ title: 'Exclusion rule added' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to add exclusion', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteExclusion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ layerId, excludedLayerId }: { layerId: string; excludedLayerId: string; projectId: string }) => {
      // Delete both directions
      const { error } = await supabase
        .from('layer_exclusions')
        .delete()
        .or(`and(layer_id.eq.${layerId},excluded_layer_id.eq.${excludedLayerId}),and(layer_id.eq.${excludedLayerId},excluded_layer_id.eq.${layerId})`);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['layer-exclusions'] });
      queryClient.invalidateQueries({ queryKey: ['all-exclusions', variables.projectId] });
      toast({ title: 'Exclusion rule removed' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to remove exclusion', description: error.message, variant: 'destructive' });
    },
  });
}

// ==================== LAYER EFFECTS ====================

export function useLayerEffects(layerId: string) {
  return useQuery({
    queryKey: ['layer-effects', layerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('layer_effects')
        .select('*, effect_layer:layers!layer_effects_effect_layer_id_fkey(*)')
        .eq('parent_layer_id', layerId)
        .order('render_order');

      if (error) throw error;
      return data as (LayerEffect & { effect_layer: Layer })[];
    },
    enabled: !!layerId,
  });
}

export function useAllEffects(projectId: string) {
  return useQuery({
    queryKey: ['all-effects', projectId],
    queryFn: async () => {
      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .eq('project_id', projectId);

      if (!categories || categories.length === 0) return [];

      const categoryIds = categories.map((c) => c.id);
      const { data: layers } = await supabase
        .from('layers')
        .select('id')
        .in('category_id', categoryIds);

      if (!layers || layers.length === 0) return [];

      const layerIds = layers.map((l) => l.id);
      const { data, error } = await supabase
        .from('layer_effects')
        .select('*, effect_layer:layers!layer_effects_effect_layer_id_fkey(*)')
        .in('parent_layer_id', layerIds)
        .order('render_order');

      if (error) throw error;
      return data as (LayerEffect & { effect_layer: Layer })[];
    },
    enabled: !!projectId,
  });
}

export function useCreateEffect() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      parentLayerId,
      effectLayerId,
      renderOrder,
    }: {
      parentLayerId: string;
      effectLayerId: string;
      renderOrder: number;
      projectId: string;
    }) => {
      const { error } = await supabase.from('layer_effects').insert({
        parent_layer_id: parentLayerId,
        effect_layer_id: effectLayerId,
        render_order: renderOrder,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['layer-effects'] });
      queryClient.invalidateQueries({ queryKey: ['all-effects', variables.projectId] });
      toast({ title: 'Effect layer linked' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to link effect', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateEffectOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, renderOrder }: { id: string; renderOrder: number; projectId: string }) => {
      const { error } = await supabase.from('layer_effects').update({ render_order: renderOrder }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['layer-effects'] });
      queryClient.invalidateQueries({ queryKey: ['all-effects', variables.projectId] });
    },
  });
}

export function useDeleteEffect() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('layer_effects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['layer-effects'] });
      queryClient.invalidateQueries({ queryKey: ['all-effects', variables.projectId] });
      toast({ title: 'Effect layer removed' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to remove effect', description: error.message, variant: 'destructive' });
    },
  });
}

export function useMarkAsEffectLayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isEffectLayer }: { id: string; isEffectLayer: boolean; projectId: string }) => {
      const { error } = await supabase.from('layers').update({ is_effect_layer: isEffectLayer }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['all-layers', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['layers'] });
    },
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

export function useReorderCategories() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      projectId,
      categories,
    }: {
      projectId: string;
      categories: { id: string; orderIndex: number }[];
    }) => {
      const updates = categories.map(({ id, orderIndex }) =>
        supabase.from('categories').update({ order_index: orderIndex }).eq('id', id)
      );
      const results = await Promise.all(updates);
      const error = results.find((r) => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories', variables.projectId] });
      toast({ title: 'Layer order updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update order', description: error.message, variant: 'destructive' });
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

export function useUpdateLayerName() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      displayName,
    }: {
      id: string;
      categoryId: string;
      projectId: string;
      displayName: string;
    }) => {
      const { error } = await supabase
        .from('layers')
        .update({ display_name: displayName })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['layers', variables.categoryId] });
      queryClient.invalidateQueries({ queryKey: ['all-layers', variables.projectId] });
      toast({ title: 'Trait renamed' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to rename trait', description: error.message, variant: 'destructive' });
    },
  });
}

// ==================== LAYER SWITCHES ====================

export function useLayerSwitches(layerId: string) {
  return useQuery({
    queryKey: ['layer-switches', layerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('layer_switches')
        .select('*')
        .or(`layer_a_id.eq.${layerId},layer_b_id.eq.${layerId}`);

      if (error) throw error;
      return data as LayerSwitch[];
    },
    enabled: !!layerId,
  });
}

export function useAllSwitches(projectId: string) {
  return useQuery({
    queryKey: ['all-switches', projectId],
    queryFn: async () => {
      // Get all layers for this project first
      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .eq('project_id', projectId);

      if (!categories || categories.length === 0) return [];

      const categoryIds = categories.map((c) => c.id);
      const { data: layers } = await supabase
        .from('layers')
        .select('id')
        .in('category_id', categoryIds);

      if (!layers || layers.length === 0) return [];

      const layerIds = layers.map((l) => l.id);
      const { data, error } = await supabase
        .from('layer_switches')
        .select('*')
        .in('layer_a_id', layerIds);

      if (error) throw error;
      return data as LayerSwitch[];
    },
    enabled: !!projectId,
  });
}

export function useCreateSwitch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ layerAId, layerBId }: { layerAId: string; layerBId: string; projectId: string }) => {
      // Normalize order to prevent duplicates (always store smaller UUID first)
      const [first, second] = layerAId < layerBId ? [layerAId, layerBId] : [layerBId, layerAId];
      
      const { error } = await supabase.from('layer_switches').insert({
        layer_a_id: first,
        layer_b_id: second,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['layer-switches'] });
      queryClient.invalidateQueries({ queryKey: ['all-switches', variables.projectId] });
      toast({ title: 'Layer switch rule added' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to add switch rule', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteSwitch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ layerAId, layerBId }: { layerAId: string; layerBId: string; projectId: string }) => {
      // Normalize order to match how it was stored
      const [first, second] = layerAId < layerBId ? [layerAId, layerBId] : [layerBId, layerAId];
      
      const { error } = await supabase
        .from('layer_switches')
        .delete()
        .eq('layer_a_id', first)
        .eq('layer_b_id', second);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['layer-switches'] });
      queryClient.invalidateQueries({ queryKey: ['all-switches', variables.projectId] });
      toast({ title: 'Layer switch rule removed' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to remove switch rule', description: error.message, variant: 'destructive' });
    },
  });
}
