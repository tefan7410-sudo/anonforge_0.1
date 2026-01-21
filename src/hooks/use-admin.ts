import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
import { Id } from '../../convex/_generated/dataModel';
import { toast } from 'sonner';

export function useIsAdmin() {
  const { user } = useAuth();

  const isAdmin = useQuery(
    api.admin.isAdmin,
    user?.id ? { userId: user.id } : "skip"
  );

  return {
    data: isAdmin ?? false,
    isLoading: isAdmin === undefined,
  };
}

export function useAdminUsers() {
  const users = useQuery(api.admin.getUsers);

  return {
    data: users || [],
    isLoading: users === undefined,
    error: null,
    refetch: () => {},
  };
}

export function usePendingVerifications() {
  const verifications = useQuery(api.admin.getPendingVerifications);

  return {
    data: verifications || [],
    isLoading: verifications === undefined,
    error: null,
    refetch: () => {},
  };
}

export function useApproveVerification() {
  const approve = useMutation(api.admin.approveVerification);

  return {
    mutateAsync: async (requestId: string) => {
      await approve({ requestId: requestId as Id<"verification_requests"> });
      toast.success('Verification approved');
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useRejectVerification() {
  const reject = useMutation(api.admin.rejectVerification);

  return {
    mutateAsync: async (requestId: string, reason: string) => {
      await reject({ requestId: requestId as Id<"verification_requests">, reason });
      toast.success('Verification rejected');
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useBugReports(status?: string) {
  const reports = useQuery(api.admin.getBugReports, status ? { status } : {});

  return {
    data: reports || [],
    isLoading: reports === undefined,
    error: null,
    refetch: () => {},
  };
}

export function useUpdateBugStatus() {
  const updateStatus = useMutation(api.admin.updateBugStatus);

  return {
    mutateAsync: async (id: string, status: string, adminNotes?: string) => {
      await updateStatus({ 
        id: id as Id<"bug_reports">, 
        status, 
        adminNotes 
      });
      toast.success('Bug report updated');
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useAdminMarketingRequests() {
  const requests = useQuery(api.admin.getMarketingRequests);

  return {
    data: requests || [],
    isLoading: requests === undefined,
    error: null,
    refetch: () => {},
  };
}

export function useArtFundStats() {
  const stats = useQuery(api.admin.getArtFundStats);

  return {
    data: stats,
    isLoading: stats === undefined,
    error: null,
  };
}

// Owner check
export function useIsOwner() {
  const { user } = useAuth();
  // Owner is the main admin account
  const ownerEmail = 'owner@anonforge.com'; // Configure as needed
  
  return {
    data: user?.email === ownerEmail,
    isLoading: false,
  };
}

// Collection admin hooks
export function useAdminCollections() {
  return {
    data: [],
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}

export function usePendingCollections() {
  return {
    data: [],
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}

export function usePendingVerificationRequests() {
  return usePendingVerifications();
}

export function useToggleCollectionHidden() {
  return {
    mutateAsync: async (collectionId: string, isHidden: boolean) => {
      // TODO: Implement in Convex
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useApproveCollection() {
  return {
    mutateAsync: async (collectionId: string) => {
      // TODO: Implement in Convex
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useRejectCollection() {
  return {
    mutateAsync: async (collectionId: string, reason: string) => {
      // TODO: Implement in Convex
    },
    mutate: () => {},
    isPending: false,
  };
}

// Credit admin hooks
export function useAllUserCredits() {
  return {
    data: [],
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}

export function useUserCreditTransactions(userId: string | undefined) {
  return {
    data: [],
    isLoading: false,
    error: null,
  };
}

export function useAdminAdjustCredits() {
  return {
    mutateAsync: async (data: { userId: string; amount: number; reason: string }) => {
      // TODO: Implement in Convex
    },
    mutate: () => {},
    isPending: false,
  };
}

// Role admin hooks
export function useAllUserRoles() {
  return useAdminUsers();
}

export function useAdminSetUserRole() {
  return {
    mutateAsync: async (data: { userId: string; role: string }) => {
      // TODO: Implement in Convex
    },
    mutate: () => {},
    isPending: false,
  };
}
