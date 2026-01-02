import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GenerationComment {
  id: string;
  generation_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export function useGenerationComments(generationId: string | null) {
  return useQuery({
    queryKey: ['generation-comments', generationId],
    queryFn: async () => {
      if (!generationId) return [];

      const { data: comments, error } = await supabase
        .from('generation_comments')
        .select('*')
        .eq('generation_id', generationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch user profiles for each comment
      const userIds = [...new Set(comments.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, email, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]));

      return comments.map((comment) => ({
        ...comment,
        user: profileMap.get(comment.user_id),
      })) as GenerationComment[];
    },
    enabled: !!generationId,
  });
}

// Hook to get comment counts for multiple generations
export function useGenerationCommentCounts(generationIds: string[]) {
  return useQuery({
    queryKey: ['generation-comment-counts', generationIds],
    queryFn: async () => {
      if (!generationIds.length) return new Map<string, number>();

      const { data, error } = await supabase
        .from('generation_comments')
        .select('generation_id')
        .in('generation_id', generationIds);

      if (error) throw error;

      const counts = new Map<string, number>();
      for (const comment of data || []) {
        counts.set(comment.generation_id, (counts.get(comment.generation_id) || 0) + 1);
      }
      return counts;
    },
    enabled: generationIds.length > 0,
  });
}

// Hook to check if current user has mentions in specific generations
export function useUserMentionsInGenerations(generationIds: string[], userId: string | undefined) {
  return useQuery({
    queryKey: ['user-mentions', generationIds, userId],
    queryFn: async () => {
      if (!generationIds.length || !userId) return new Set<string>();

      const { data, error } = await supabase
        .from('generation_comments')
        .select('generation_id, content')
        .in('generation_id', generationIds);

      if (error) throw error;

      const mentionedGenerations = new Set<string>();
      const mentionPattern = new RegExp(`@\\[[^\\]]+\\]\\(${userId}\\)`, 'g');
      
      for (const comment of data || []) {
        if (mentionPattern.test(comment.content)) {
          mentionedGenerations.add(comment.generation_id);
        }
      }
      return mentionedGenerations;
    },
    enabled: generationIds.length > 0 && !!userId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      generationId,
      userId,
      content,
    }: {
      generationId: string;
      userId: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from('generation_comments')
        .insert({
          generation_id: generationId,
          user_id: userId,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['generation-comments', variables.generationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['generation-comment-counts'],
      });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
    }: {
      commentId: string;
      generationId: string;
    }) => {
      const { error } = await supabase
        .from('generation_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['generation-comments', variables.generationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['generation-comment-counts'],
      });
    },
  });
}
