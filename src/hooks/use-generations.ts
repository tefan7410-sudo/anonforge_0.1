import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Generation {
  id: string;
  project_id: string;
  token_id: string;
  image_path: string | null;
  layer_combination: string[];
  metadata: Record<string, string>;
  created_at: string;
  is_favorite: boolean;
  generation_type: 'single' | 'batch';
  batch_size: number | null;
}

const MAX_PREVIEW_GENERATIONS = 25;
const RETENTION_DAYS = 15;

export function useGenerations(projectId: string) {
  return useQuery({
    queryKey: ['generations', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('project_id', projectId)
        .order('is_favorite', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Generation[];
    },
    enabled: !!projectId,
  });
}

export function useCreateGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      tokenId,
      imagePath,
      layerCombination,
      metadata,
      generationType,
      batchSize,
    }: {
      projectId: string;
      tokenId: string;
      imagePath: string;
      layerCombination: string[];
      metadata: Record<string, string>;
      generationType: 'single' | 'batch';
      batchSize?: number;
    }) => {
      const { data, error } = await supabase
        .from('generations')
        .insert({
          project_id: projectId,
          token_id: tokenId,
          image_path: imagePath,
          layer_combination: layerCombination,
          metadata,
          generation_type: generationType,
          batch_size: batchSize || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Generation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['generations', variables.projectId] });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      generationId,
      isFavorite,
    }: {
      generationId: string;
      isFavorite: boolean;
      projectId: string;
    }) => {
      const { data, error } = await supabase
        .from('generations')
        .update({ is_favorite: isFavorite })
        .eq('id', generationId)
        .select()
        .single();

      if (error) throw error;
      return data as Generation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['generations', variables.projectId] });
    },
  });
}

export function useDeleteGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      generation,
    }: {
      generation: Generation;
      projectId: string;
    }) => {
      // Delete from storage first
      if (generation.image_path) {
        await supabase.storage.from('generations').remove([generation.image_path]);
      }

      // Delete from database
      const { error } = await supabase
        .from('generations')
        .delete()
        .eq('id', generation.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['generations', variables.projectId] });
    },
  });
}

export function useCleanupGenerations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      // Get all non-favorite single generations, ordered by date desc
      const { data: generations, error } = await supabase
        .from('generations')
        .select('*')
        .eq('project_id', projectId)
        .eq('generation_type', 'single')
        .eq('is_favorite', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Keep first 25, delete the rest
      const toDelete = (generations || []).slice(MAX_PREVIEW_GENERATIONS) as Generation[];

      for (const gen of toDelete) {
        // Delete from storage
        if (gen.image_path) {
          await supabase.storage.from('generations').remove([gen.image_path]);
        }
        // Delete from database
        await supabase.from('generations').delete().eq('id', gen.id);
      }

      return toDelete.length;
    },
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['generations', projectId] });
    },
  });
}

// Upload image to generations storage bucket
export async function uploadGenerationImage(
  projectId: string,
  generationId: string,
  imageData: string,
  fileExtension: 'jpg' | 'zip' = 'jpg'
): Promise<string> {
  // Convert base64 to blob
  const response = await fetch(imageData);
  const blob = await response.blob();

  const filePath = `${projectId}/${generationId}.${fileExtension}`;

  const { error } = await supabase.storage
    .from('generations')
    .upload(filePath, blob, {
      contentType: fileExtension === 'jpg' ? 'image/jpeg' : 'application/zip',
      upsert: true,
    });

  if (error) throw error;
  return filePath;
}

// Upload zip file for batch generation
export async function uploadGenerationZip(
  projectId: string,
  generationId: string,
  zipBlob: Blob
): Promise<string> {
  const filePath = `${projectId}/${generationId}.zip`;

  const { error } = await supabase.storage
    .from('generations')
    .upload(filePath, zipBlob, {
      contentType: 'application/zip',
      upsert: true,
    });

  if (error) throw error;
  return filePath;
}

// Get public URL for generation file
export function getGenerationFileUrl(imagePath: string): string {
  const { data } = supabase.storage.from('generations').getPublicUrl(imagePath);
  return data.publicUrl;
}

// Clear all generations for a project
export function useClearAllGenerations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      // Get all generations for project
      const { data: generations, error } = await supabase
        .from('generations')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;

      // Delete all files from storage
      const filesToDelete = (generations || [])
        .filter((g) => g.image_path)
        .map((g) => g.image_path as string);

      if (filesToDelete.length > 0) {
        await supabase.storage.from('generations').remove(filesToDelete);
      }

      // Delete all records
      const { error: deleteError } = await supabase
        .from('generations')
        .delete()
        .eq('project_id', projectId);

      if (deleteError) throw deleteError;

      return (generations || []).length;
    },
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['generations', projectId] });
    },
  });
}

// Auto-cleanup old generations (non-favorites older than 15 days)
export function useAutoCleanupOldGenerations(projectId: string) {
  const queryClient = useQueryClient();
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (!projectId || hasRunRef.current) return;
    hasRunRef.current = true;

    const cleanup = async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

      // Get old non-favorite generations
      const { data: oldGenerations, error } = await supabase
        .from('generations')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_favorite', false)
        .lt('created_at', cutoffDate.toISOString());

      if (error || !oldGenerations || oldGenerations.length === 0) return;

      // Delete from storage
      const filesToDelete = oldGenerations
        .filter((g) => g.image_path)
        .map((g) => g.image_path as string);

      if (filesToDelete.length > 0) {
        await supabase.storage.from('generations').remove(filesToDelete);
      }

      // Delete from database
      const idsToDelete = oldGenerations.map((g) => g.id);
      await supabase
        .from('generations')
        .delete()
        .in('id', idsToDelete);

      // Refresh the list
      queryClient.invalidateQueries({ queryKey: ['generations', projectId] });
    };

    cleanup();
  }, [projectId, queryClient]);
}
