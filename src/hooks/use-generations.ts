import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
import { Id } from '../../convex/_generated/dataModel';
import { toast } from 'sonner';

export interface Generation {
  _id: Id<"generations">;
  project_id: Id<"projects">;
  user_id: string;
  name: string;
  count: number;
  settings?: Record<string, unknown>;
  status: string;
  progress: number;
  error_message?: string;
  output_zip_url?: string;
  generated_images?: Array<{
    filename: string;
    url: string;
    traits: Record<string, unknown>;
  }>;
  completed_at?: string;
  _creationTime: number;
}

export function useGenerations(projectId: string | undefined, limit = 50) {
  const generations = useQuery(
    api.generations.listByProject,
    projectId ? { projectId: projectId as Id<"projects">, limit } : "skip"
  );

  return {
    data: generations as Generation[] | undefined,
    isLoading: generations === undefined,
    error: null,
    refetch: () => {},
  };
}

export function useGeneration(generationId: string | undefined) {
  const generation = useQuery(
    api.generations.get,
    generationId ? { id: generationId as Id<"generations"> } : "skip"
  );

  return {
    data: generation as Generation | null | undefined,
    isLoading: generation === undefined,
    error: null,
  };
}

export function useCreateGeneration() {
  const { user } = useAuth();
  const createGeneration = useMutation(api.generations.create);

  return {
    mutateAsync: async (data: {
      projectId: string;
      name: string;
      count: number;
      settings?: Record<string, unknown>;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const id = await createGeneration({
        projectId: data.projectId as Id<"projects">,
        userId: user.id,
        name: data.name,
        count: data.count,
        settings: data.settings,
      });

      toast.success('Generation started');
      return { id };
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useUpdateGenerationStatus() {
  const updateStatus = useMutation(api.generations.updateStatus);

  return {
    mutateAsync: async (data: {
      generationId: string;
      status: string;
      progress?: number;
      errorMessage?: string;
      outputZipUrl?: string;
    }) => {
      await updateStatus({
        id: data.generationId as Id<"generations">,
        status: data.status,
        progress: data.progress,
        errorMessage: data.errorMessage,
        outputZipUrl: data.outputZipUrl,
      });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useDeleteGeneration() {
  const deleteGeneration = useMutation(api.generations.remove);

  return {
    mutateAsync: async (generationId: string) => {
      await deleteGeneration({ id: generationId as Id<"generations"> });
      toast.success('Generation deleted');
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useGenerationComments(generationId: string | undefined) {
  const comments = useQuery(
    api.generations.getComments,
    generationId ? { generationId: generationId as Id<"generations"> } : "skip"
  );

  return {
    data: comments || [],
    isLoading: comments === undefined,
    error: null,
    refetch: () => {},
  };
}

export function useAddGenerationComment() {
  const { user } = useAuth();
  const addComment = useMutation(api.generations.addComment);

  return {
    mutateAsync: async (data: {
      generationId: string;
      content: string;
      parentId?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      await addComment({
        generationId: data.generationId as Id<"generations">,
        userId: user.id,
        content: data.content,
        parentId: data.parentId as Id<"generation_comments"> | undefined,
      });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useCleanupGenerations() {
  const deleteGeneration = useMutation(api.generations.remove);

  return {
    mutateAsync: async (projectId: string) => {
      // Cleanup old/failed generations - placeholder
      // TODO: Implement batch cleanup in Convex
    },
    mutate: () => {},
    isPending: false,
  };
}

// Utility functions for file handling
export async function uploadGenerationImage(
  projectId: string,
  generationId: string,
  filename: string,
  blob: Blob
): Promise<string> {
  // For now, return a placeholder URL
  // TODO: Implement with Convex file storage
  const url = URL.createObjectURL(blob);
  return url;
}

export async function uploadGenerationZip(
  projectId: string,
  generationId: string,
  blob: Blob
): Promise<string> {
  // For now, return a placeholder URL
  // TODO: Implement with Convex file storage
  const url = URL.createObjectURL(blob);
  return url;
}

export function getGenerationFileUrl(
  projectId: string,
  generationId: string,
  filename: string
): string {
  // Return placeholder URL
  // TODO: Implement with Convex file storage
  return `/placeholder.svg`;
}

export function useToggleFavorite() {
  return {
    mutateAsync: async (generationId: string) => {
      // TODO: Implement favorite toggle in Convex
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useClearAllGenerations() {
  return {
    mutateAsync: async (projectId: string) => {
      // TODO: Implement clear all in Convex
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useAutoCleanupOldGenerations() {
  return {
    mutateAsync: async (projectId: string, daysOld: number) => {
      // TODO: Implement auto cleanup in Convex
    },
    mutate: () => {},
    isPending: false,
  };
}
