import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { toast } from 'sonner';

export interface AmbassadorRequest {
  _id: Id<"ambassador_applications">;
  id?: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  twitter_url?: string;
  twitter_link?: string;
  experience?: string;
  motivation?: string;
  reason?: string;
  portfolio_links?: string[];
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  admin_notes?: string;
  _creationTime: number;
  profile?: {
    _id: Id<"profiles">;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface AmbassadorWithProfile {
  _id: Id<"user_roles">;
  id?: string;
  user_id: string;
  role: string;
  profile?: {
    _id: Id<"profiles">;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
}

// Get pending ambassador requests
export function usePendingAmbassadorRequests() {
  const requests = useQuery(api.ambassadors.listApplications, { status: 'pending' });

  return {
    data: requests as AmbassadorRequest[] | undefined,
    isLoading: requests === undefined,
    error: null,
    refetch: () => {},
  };
}

// Get all users with ambassador role
export function useAllAmbassadors() {
  const ambassadors = useQuery(api.ambassadors.listAmbassadors);

  return {
    data: ambassadors as AmbassadorWithProfile[] | undefined,
    isLoading: ambassadors === undefined,
    error: null,
    refetch: () => {},
  };
}

// Approve an ambassador request
export function useApproveAmbassadorRequest() {
  const approve = useMutation(api.ambassadors.approveApplication);

  return {
    mutateAsync: async ({ requestId }: { requestId: string; userId: string }) => {
      await approve({ applicationId: requestId as Id<"ambassador_applications"> });
      toast.success('Ambassador approved!');
    },
    mutate: () => {},
    isPending: false,
  };
}

// Reject an ambassador request
export function useRejectAmbassadorRequest() {
  const reject = useMutation(api.ambassadors.rejectApplication);

  return {
    mutateAsync: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      await reject({ 
        applicationId: requestId as Id<"ambassador_applications">, 
        reason 
      });
      toast.success('Ambassador request rejected');
    },
    mutate: () => {},
    isPending: false,
  };
}

// Remove ambassador role from a user
export function useRemoveAmbassadorRole() {
  const remove = useMutation(api.ambassadors.removeAmbassadorRole);

  return {
    mutateAsync: async ({ userId }: { userId: string }) => {
      await remove({ userId });
      toast.success('Ambassador role removed');
    },
    mutate: () => {},
    isPending: false,
  };
}
