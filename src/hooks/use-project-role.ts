import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ProjectRole = 'owner' | 'editor' | 'viewer' | null;

export function useProjectRole(projectId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['project-role', projectId, user?.id],
    queryFn: async (): Promise<ProjectRole> => {
      if (!user) return null;

      // Check if user is owner
      const { data: project } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .maybeSingle();

      if (project?.owner_id === user.id) {
        return 'owner';
      }

      // Check if user is a team member
      const { data: member } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (member) {
        return member.role as 'editor' | 'viewer';
      }

      return null;
    },
    enabled: !!projectId && !!user,
  });
}

export function useCanEditProject(projectId: string) {
  const { data: role, isLoading } = useProjectRole(projectId);
  
  return {
    canEdit: role === 'owner' || role === 'editor',
    isLoading,
    role,
  };
}
