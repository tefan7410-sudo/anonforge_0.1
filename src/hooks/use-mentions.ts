import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MentionableUser {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

export function useMentionableUsers(projectId: string | undefined) {
  return useQuery({
    queryKey: ['mentionable-users', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      // Get project owner
      const { data: project } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single();

      // Get project members
      const { data: members } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId);

      const userIds = [
        project?.owner_id,
        ...(members?.map((m) => m.user_id) || []),
      ].filter(Boolean) as string[];

      if (userIds.length === 0) return [];

      // Get profiles for all users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, email, avatar_url')
        .in('id', userIds);

      return (profiles || []) as MentionableUser[];
    },
    enabled: !!projectId,
  });
}
