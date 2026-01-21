import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export interface MentionableUser {
  _id: Id<"profiles">;
  id?: string;
  display_name?: string;
  email: string;
  avatar_url?: string;
}

export function useMentionableUsers(projectId: string | undefined) {
  const project = useQuery(
    api.projects.get,
    projectId ? { id: projectId as Id<"projects"> } : "skip"
  );
  
  const members = useQuery(
    api.teams.listMembers,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  // Combine owner and members
  const userIds: string[] = [];
  if (project?.owner_id) {
    userIds.push(project.owner_id);
  }
  if (members) {
    members.forEach(m => {
      if (m.user_id && !userIds.includes(m.user_id)) {
        userIds.push(m.user_id);
      }
    });
  }

  // Fetch profiles for all users
  // Note: This would be more efficient with a batch query, but for now we'll get profiles from members
  const mentionableUsers: MentionableUser[] = [];
  
  if (project?.owner_id) {
    // Would need to fetch owner profile separately
    // For now, include from members if available
  }
  
  if (members) {
    members.forEach(member => {
      if (member.profile) {
        mentionableUsers.push({
          _id: member.profile.email as unknown as Id<"profiles">,
          email: member.profile.email,
          display_name: member.profile.display_name || undefined,
          avatar_url: member.profile.avatar_url || undefined,
        });
      }
    });
  }

  return {
    data: mentionableUsers,
    isLoading: project === undefined || members === undefined,
    error: null,
  };
}
