import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface VerificationRequest {
  _id: string;
  id?: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  twitter_url?: string;
  portfolio_url?: string;
  description?: string;
  reviewed_at?: string;
  admin_notes?: string;
  _creationTime: number;
}

// Get current user's verification request
export function useMyVerificationRequest() {
  const request = useQuery(api.verifications.getMyRequest);

  return {
    data: request as VerificationRequest | null | undefined,
    isLoading: request === undefined,
    error: null,
  };
}

// Submit a new verification request
export function useSubmitVerificationRequest() {
  const submit = useMutation(api.verifications.submitRequest);

  return {
    mutateAsync: async ({
      twitterHandle,
      bio,
      portfolioLinks,
    }: {
      twitterHandle?: string;
      bio?: string;
      portfolioLinks?: string[];
    }) => {
      await submit({
        twitterHandle,
        bio,
        portfolioLinks,
      });

      toast.success('Verification request submitted successfully!');
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useIsVerifiedCreator() {
  const { user } = useAuth();
  const profile = useQuery(
    api.profiles.get,
    user?.id ? { userId: user.id } : "skip"
  );

  return {
    data: profile?.is_verified_creator ?? false,
    isLoading: profile === undefined,
  };
}
