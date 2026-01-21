import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
import { Id } from '../../convex/_generated/dataModel';

export type ProjectRole = 'owner' | 'editor' | 'viewer' | null;

export function useProjectRole(projectId: string | undefined) {
  const { user } = useAuth();
  const project = useQuery(
    api.projects.get,
    projectId && user?.id ? { id: projectId as Id<"projects"> } : "skip"
  );
  
  const members = useQuery(
    api.teams.listMembers,
    projectId && user?.id ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  // Determine role
  const role: ProjectRole = 
    project && user?.id && project.owner_id === user.id
      ? 'owner'
      : members?.find(m => m.user_id === user?.id)?.role as 'editor' | 'viewer' || null;

  return {
    data: role,
    isLoading: project === undefined || members === undefined,
    error: null,
  };
}

export function useCanEditProject(projectId: string | undefined) {
  const { data: role, isLoading } = useProjectRole(projectId);
  
  return {
    canEdit: role === 'owner' || role === 'editor',
    isLoading,
    role,
  };
}
