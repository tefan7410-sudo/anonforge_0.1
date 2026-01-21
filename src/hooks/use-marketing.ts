import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
import { Id } from '../../convex/_generated/dataModel';

export interface MarketingRequest {
  _id: Id<"marketing_requests">;
  project_id: Id<"projects">;
  user_id: string;
  status: string;
  duration_days: number;
  start_date?: string;
  end_date?: string;
  price_ada: number;
  message?: string;
  hero_image_url?: string;
  payment_status?: string;
  approved_at?: string;
  admin_notes?: string;
  _creationTime: number;
  project?: {
    _id: Id<"projects">;
    name: string;
  };
}

export function useActiveMarketing() {
  const marketing = useQuery(api.marketing.getActive);

  return {
    data: marketing,
    isLoading: marketing === undefined,
    error: null,
    refetch: () => {},
  };
}

export function useMarketingBookings() {
  const bookings = useQuery(api.marketing.getBookings);

  return {
    data: bookings as MarketingRequest[] | undefined,
    isLoading: bookings === undefined,
    error: null,
  };
}

export function useProjectMarketing(projectId: string | undefined) {
  const marketing = useQuery(
    api.marketing.getByProject,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  return {
    data: marketing as MarketingRequest | null | undefined,
    isLoading: marketing === undefined,
    error: null,
    refetch: () => {},
  };
}

export function useCreateMarketingRequest() {
  const { user } = useAuth();
  const createMarketing = useMutation(api.marketing.create);

  return {
    mutateAsync: async (data: {
      projectId: string;
      durationDays: number;
      startDate: string;
      endDate: string;
      priceAda: number;
      message?: string;
      heroImageUrl?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const id = await createMarketing({
        projectId: data.projectId as Id<"projects">,
        userId: user.id,
        durationDays: data.durationDays,
        startDate: data.startDate,
        endDate: data.endDate,
        priceAda: data.priceAda,
        message: data.message,
        heroImageUrl: data.heroImageUrl,
      });

      return { id };
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useApproveMarketing() {
  const approveMarketing = useMutation(api.marketing.approve);

  return {
    mutateAsync: async (requestId: string) => {
      await approveMarketing({ id: requestId as Id<"marketing_requests"> });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useRejectMarketing() {
  const rejectMarketing = useMutation(api.marketing.reject);

  return {
    mutateAsync: async (requestId: string, reason: string) => {
      await rejectMarketing({ id: requestId as Id<"marketing_requests">, reason });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useActivateMarketing() {
  const activateMarketing = useMutation(api.marketing.activate);

  return {
    mutateAsync: async (requestId: string) => {
      await activateMarketing({ id: requestId as Id<"marketing_requests"> });
    },
    mutate: () => {},
    isPending: false,
  };
}

// Payment intent types and hooks
export interface MarketingPaymentIntent {
  id: string;
  paymentAddress: string;
  amountAda: number;
  amountLovelace: number;
  expiresAt: string;
  startDate: string;
  endDate: string;
  status: string;
}

export function useMarketingPaymentStatus(paymentId: string | undefined) {
  // Placeholder - would poll for payment status
  return {
    data: null as MarketingPaymentIntent | null,
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}

export function useCancelMarketingPayment() {
  return {
    mutateAsync: async (paymentId: string) => {
      // TODO: Implement in Convex
    },
    mutate: () => {},
    isPending: false,
  };
}

// Admin marketing hooks
export function useActionableMarketingRequests() {
  const requests = useQuery(api.admin.getMarketingRequests);
  const actionable = requests?.filter(r => r.status === 'pending' || r.status === 'approved') || [];

  return {
    data: actionable,
    isLoading: requests === undefined,
    error: null,
    refetch: () => {},
  };
}

export function useAllMarketingRequests() {
  const requests = useQuery(api.admin.getMarketingRequests);

  return {
    data: requests || [],
    isLoading: requests === undefined,
    error: null,
    refetch: () => {},
  };
}

export function useApproveMarketingRequest() {
  const approve = useMutation(api.marketing.approve);

  return {
    mutateAsync: async (requestId: string) => {
      await approve({ id: requestId as Id<"marketing_requests"> });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useApproveFreeMarketingRequest() {
  const approve = useMutation(api.marketing.approve);
  const activate = useMutation(api.marketing.activate);

  return {
    mutateAsync: async (requestId: string) => {
      await approve({ id: requestId as Id<"marketing_requests"> });
      await activate({ id: requestId as Id<"marketing_requests"> });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useRejectMarketingRequest() {
  const reject = useMutation(api.marketing.reject);

  return {
    mutateAsync: async (requestId: string, reason: string) => {
      await reject({ id: requestId as Id<"marketing_requests">, reason });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useEndMarketingEarly() {
  return {
    mutateAsync: async (requestId: string) => {
      // TODO: Implement in Convex
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useCancelScheduledMarketing() {
  return {
    mutateAsync: async (requestId: string) => {
      // TODO: Implement in Convex
    },
    mutate: () => {},
    isPending: false,
  };
}

// Alias for project marketing
export function useProjectMarketingRequest(projectId: string | undefined) {
  return useProjectMarketing(projectId);
}

// Image upload for marketing
export function useUploadMarketingImage() {
  return {
    mutateAsync: async (file: File): Promise<string> => {
      // TODO: Implement with Convex file storage
      return URL.createObjectURL(file);
    },
    mutate: () => {},
    isPending: false,
  };
}

// Payment intent creation
export function useCreateMarketingPaymentIntent() {
  return {
    mutateAsync: async (data: {
      projectId: string;
      durationDays: number;
      startDate: string;
      endDate: string;
    }): Promise<MarketingPaymentIntent> => {
      // TODO: Implement in Convex
      return {
        id: 'mock-payment-id',
        paymentAddress: 'addr_mock...',
        amountAda: calculateMarketingPrice(data.durationDays),
        amountLovelace: calculateMarketingPrice(data.durationDays) * 1000000,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'pending',
      };
    },
    mutate: () => {},
    isPending: false,
  };
}

// Check for existing payment
export function useExistingMarketingPayment(projectId: string | undefined) {
  return {
    data: null as MarketingPaymentIntent | null,
    isLoading: false,
    error: null,
  };
}

// Price calculation
export function calculateMarketingPrice(days: number): number {
  // Base price: 25 ADA per day with volume discounts
  const basePrice = 25;
  if (days >= 30) return Math.round(days * basePrice * 0.7); // 30% off
  if (days >= 14) return Math.round(days * basePrice * 0.85); // 15% off
  if (days >= 7) return Math.round(days * basePrice * 0.9); // 10% off
  return days * basePrice;
}
