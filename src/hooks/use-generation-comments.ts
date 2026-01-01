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
    },
  });
}
