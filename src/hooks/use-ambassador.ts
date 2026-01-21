import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
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
  _creationTime: number;
}

// Check if user has ambassador role
export function useIsAmbassador(userId?: string) {
  const { user } = useAuth();
  const checkUserId = userId || user?.id;
  
  // Check user_roles for ambassador role
  // This would need a new Convex query, for now return false
  return {
    data: false,
    isLoading: false,
    error: null,
  };
}

// Get current user's ambassador request
export function useMyAmbassadorRequest() {
  const request = useQuery(api.ambassadors.getMyApplication);

  return {
    data: request as AmbassadorRequest | null | undefined,
    isLoading: request === undefined,
    error: null,
  };
}

// Submit a new ambassador request
export function useSubmitAmbassadorRequest() {
  const submit = useMutation(api.ambassadors.submitApplication);
  const { user } = useAuth();
  const profile = useQuery(
    api.profiles.get,
    user?.id ? { userId: user.id } : "skip"
  );

  return {
    mutateAsync: async ({ twitterLink }: { twitterLink: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const isVerified = profile?.is_verified_creator ?? false;

      await submit({
        twitterUrl: twitterLink,
      });

      if (isVerified) {
        toast.success('Ambassador role granted! You can now access the ambassador dashboard.');
      } else {
        toast.success('Ambassador request submitted successfully!');
      }

      return { isVerified };
    },
    mutate: () => {},
    isPending: false,
  };
}
