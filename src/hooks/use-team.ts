import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile: {
    email: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export function useTeamMembers(projectId: string) {
  return useQuery({
    queryKey: ['team-members', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          id,
          user_id,
          role,
          created_at,
          profile:profiles!project_members_user_id_fkey(email, display_name, avatar_url)
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      return data as unknown as TeamMember[];
    },
    enabled: !!projectId,
  });
}

export function useProjectInvitations(projectId: string) {
  return useQuery({
    queryKey: ['project-invitations', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_invitations')
        .select('id, email, role, status, created_at, expires_at')
        .eq('project_id', projectId)
        .eq('status', 'pending');

      if (error) throw error;
      return data as Invitation[];
    },
    enabled: !!projectId,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      email,
      role,
    }: {
      projectId: string;
      email: string;
      role: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check for existing pending invitation
      const { data: existing } = await supabase
        .from('project_invitations')
        .select('id')
        .eq('project_id', projectId)
        .eq('email', email)
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) {
        throw new Error('An invitation is already pending for this email');
      }

      // Check if user is already a member
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (profile) {
        const { data: existingMember } = await supabase
          .from('project_members')
          .select('id')
          .eq('project_id', projectId)
          .eq('user_id', profile.id)
          .maybeSingle();

        if (existingMember) {
          throw new Error('This user is already a member of this project');
        }
      }

      const { error } = await supabase.from('project_invitations').insert({
        project_id: projectId,
        email,
        role,
        invited_by: user.id,
      });

      if (error) {
        // Handle unique constraint violation gracefully
        if (error.code === '23505') {
          throw new Error('An invitation is already pending for this email');
        }
        throw error;
      }
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-invitations', projectId] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, projectId }: { memberId: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', projectId] });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      role,
      projectId,
    }: {
      memberId: string;
      role: string;
      projectId: string;
    }) => {
      const { error } = await supabase
        .from('project_members')
        .update({ role })
        .eq('id', memberId);

      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', projectId] });
    },
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invitationId, projectId }: { invitationId: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project-invitations', projectId] });
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invitationId }: { invitationId: string }) => {
      const { error } = await supabase.rpc('accept_project_invitation', {
        invitation_id: invitationId,
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['shared-projects'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}

export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invitationId }: { invitationId: string }) => {
      const { error } = await supabase.rpc('decline_project_invitation', {
        invitation_id: invitationId,
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}
