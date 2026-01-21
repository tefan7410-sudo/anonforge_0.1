import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
import { Id } from '../../convex/_generated/dataModel';

export interface GenerationComment {
  _id: Id<"generation_comments">;
  id?: string;
  generation_id: Id<"generations">;
  user_id: string;
  content: string;
  _creationTime: number;
  user?: {
    display_name?: string;
    email: string;
    avatar_url?: string;
  } | null;
}

export function useGenerationComments(generationId: string | null) {
  const comments = useQuery(
    api.comments.listByGeneration,
    generationId ? { generationId: generationId as Id<"generations"> } : "skip"
  );

  return {
    data: comments as GenerationComment[] | undefined,
    isLoading: comments === undefined,
    error: null,
  };
}

// Hook to get comment counts for multiple generations
export function useGenerationCommentCounts(generationIds: string[]) {
  const counts = useQuery(
    api.comments.getCommentCounts,
    generationIds.length > 0 ? { generationIds: generationIds as Id<"generations">[] } : "skip"
  );

  // Convert to Map for compatibility
  const countsMap = new Map<string, number>();
  if (counts) {
    Object.entries(counts).forEach(([id, count]) => {
      countsMap.set(id, count);
    });
  }

  return {
    data: countsMap,
    isLoading: counts === undefined,
    error: null,
  };
}

// Hook to check if current user has mentions in specific generations
export function useUserMentionsInGenerations(generationIds: string[], userId: string | undefined) {
  // This would need a new Convex function to search comments for mentions
  // For now, return empty set
  return {
    data: new Set<string>(),
    isLoading: false,
    error: null,
  };
}

export function useAddComment() {
  const addComment = useMutation(api.comments.addComment);
  const { user } = useAuth();

  return {
    mutateAsync: async ({
      generationId,
      content,
    }: {
      generationId: string;
      userId: string;
      content: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      await addComment({
        generationId: generationId as Id<"generations">,
        content,
      });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useDeleteComment() {
  const deleteComment = useMutation(api.comments.deleteComment);

  return {
    mutateAsync: async ({
      commentId,
    }: {
      commentId: string;
      generationId: string;
    }) => {
      await deleteComment({ commentId: commentId as Id<"generation_comments"> });
    },
    mutate: () => {},
    isPending: false,
  };
}
