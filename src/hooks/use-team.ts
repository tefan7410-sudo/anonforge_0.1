import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export interface TeamMember {
  _id: Id<"project_members">;
  id?: string;
  user_id: string;
  role: string;
  _creationTime: number;
  profile: {
    email: string;
    display_name?: string;
    avatar_url?: string;
  } | null;
}

export interface Invitation {
  _id: Id<"project_invitations">;
  id?: string;
  email: string;
  role: string;
  status: string;
  _creationTime: number;
  expires_at?: string;
}

export function useTeamMembers(projectId: string | undefined) {
  const members = useQuery(
    api.teams.listMembers,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  return {
    data: members as TeamMember[] | undefined,
    isLoading: members === undefined,
    error: null,
  };
}

export function useProjectInvitations(projectId: string | undefined) {
  const invitations = useQuery(
    api.teams.listInvitations,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  return {
    data: invitations as Invitation[] | undefined,
    isLoading: invitations === undefined,
    error: null,
  };
}

export function useInviteMember() {
  const invite = useMutation(api.teams.inviteMember);

  return {
    mutateAsync: async ({
      projectId,
      email,
      role,
    }: {
      projectId: string;
      email: string;
      role: string;
    }) => {
      await invite({
        projectId: projectId as Id<"projects">,
        email,
        role,
      });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useRemoveMember() {
  const remove = useMutation(api.teams.removeMember);

  return {
    mutateAsync: async ({ memberId, projectId }: { memberId: string; projectId: string }) => {
      await remove({
        memberId: memberId as Id<"project_members">,
        projectId: projectId as Id<"projects">,
      });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useUpdateMemberRole() {
  const updateRole = useMutation(api.teams.updateRole);

  return {
    mutateAsync: async ({
      memberId,
      role,
      projectId,
    }: {
      memberId: string;
      role: string;
      projectId: string;
    }) => {
      await updateRole({
        memberId: memberId as Id<"project_members">,
        role,
        projectId: projectId as Id<"projects">,
      });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useCancelInvitation() {
  const cancel = useMutation(api.teams.cancelInvitation);

  return {
    mutateAsync: async ({ invitationId, projectId }: { invitationId: string; projectId: string }) => {
      await cancel({
        invitationId: invitationId as Id<"project_invitations">,
        projectId: projectId as Id<"projects">,
      });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useAcceptInvitation() {
  const accept = useMutation(api.teams.acceptInvitation);

  return {
    mutateAsync: async ({ invitationId }: { invitationId: string }) => {
      await accept({ invitationId: invitationId as Id<"project_invitations"> });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useDeclineInvitation() {
  const decline = useMutation(api.teams.declineInvitation);

  return {
    mutateAsync: async ({ invitationId }: { invitationId: string }) => {
      await decline({ invitationId: invitationId as Id<"project_invitations"> });
    },
    mutate: () => {},
    isPending: false,
  };
}
