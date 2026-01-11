import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MarketingRequest {
  id: string;
  project_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'expired' | 'paid' | 'cancelled';
  duration_days: number;
  price_ada: number;
  message: string | null;
  admin_notes: string | null;
  hero_image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  payment_status: 'pending' | 'completed';
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketingRequestWithProject extends MarketingRequest {
  project: {
    id: string;
    name: string;
  };
  product_page?: {
    logo_url: string | null;
    banner_url: string | null;
    tagline: string | null;
  };
}

export interface MarketingBooking {
  id: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
}

export interface MarketingPaymentIntent {
  paymentId: string;
  address: string;
  amountAda: string;
  amountLovelace: number;
  priceAda: number;
  dustAmount: number;
  expiresAt: string;
  startDate: string | null;
  endDate: string | null;
}

const PRICE_PER_DAY = 25;

export const calculateMarketingPrice = (days: number) => days * PRICE_PER_DAY;

// Fetch marketing bookings for calendar availability
export function useMarketingBookings() {
  return useQuery({
    queryKey: ['marketing-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_requests')
        .select('id, start_date, end_date, status')
        .in('status', ['pending', 'approved', 'active', 'paid'])
        .gte('end_date', new Date().toISOString());

      if (error) throw error;
      return (data || []) as MarketingBooking[];
    },
  });
}

// Create marketing payment intent (for Blockfrost webhook flow)
export function useCreateMarketingPaymentIntent() {
  return useMutation({
    mutationFn: async (marketingRequestId: string) => {
      const { data, error } = await supabase.functions.invoke(
        'create-marketing-payment-intent',
        { body: { marketingRequestId } }
      );
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data as MarketingPaymentIntent;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create payment');
    },
  });
}

// Check marketing payment status
export function useMarketingPaymentStatus(paymentId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['marketing-payment-status', paymentId],
    queryFn: async () => {
      if (!paymentId) return null;
      
      const { data, error } = await supabase
        .from('pending_marketing_payments')
        .select('status, tx_hash, completed_at, expires_at')
        .eq('id', paymentId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!paymentId && enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Poll every 5 seconds if payment is still pending
      if (data?.status === 'pending') {
        return 5000;
      }
      return false;
    },
  });
}

// Cancel a pending marketing payment
export function useCancelMarketingPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('pending_marketing_payments')
        .update({ status: 'expired' })
        .eq('id', paymentId)
        .eq('status', 'pending');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-payment-status'] });
      queryClient.invalidateQueries({ queryKey: ['existing-marketing-payment'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-request'] });
    },
  });
}

// Fetch existing pending payment for a marketing request (for session persistence)
export function useExistingMarketingPayment(marketingRequestId: string | null) {
  return useQuery({
    queryKey: ['existing-marketing-payment', marketingRequestId],
    queryFn: async () => {
      if (!marketingRequestId) return null;
      
      const { data, error } = await supabase
        .from('pending_marketing_payments')
        .select('*')
        .eq('marketing_request_id', marketingRequestId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!marketingRequestId,
  });
}

// Fetch marketing request for a specific project
export function useProjectMarketingRequest(projectId: string) {
  return useQuery({
    queryKey: ['marketing-request', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_requests')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as MarketingRequest | null;
    },
    enabled: !!projectId,
  });
}

// Fetch active marketing (for landing page / marketplace display)
export function useActiveMarketing() {
  return useQuery({
    queryKey: ['active-marketing'],
    queryFn: async () => {
      // First get the active marketing request
      const { data: request, error: requestError } = await supabase
        .from('marketing_requests')
        .select(`
          *,
          project:projects!inner(id, name)
        `)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (requestError) throw requestError;
      if (!request) return null;

      // Then fetch the product page separately
      const { data: productPage } = await supabase
        .from('product_pages')
        .select('logo_url, banner_url, tagline')
        .eq('project_id', request.project_id)
        .maybeSingle();

      return {
        ...request,
        product_page: productPage,
      } as MarketingRequestWithProject;
    },
  });
}

// Fetch demo featured collection (first live collection for preview)
export function useFeaturedPreview() {
  return useQuery({
    queryKey: ['featured-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_pages')
        .select(`
          project_id,
          logo_url,
          banner_url,
          tagline,
          project:projects!inner(id, name)
        `)
        .eq('is_live', true)
        .eq('is_hidden', false)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        project_id: data.project_id,
        project: data.project,
        product_page: {
          logo_url: data.logo_url,
          banner_url: data.banner_url,
          tagline: data.tagline,
        },
        hero_image_url: '/images/demo-hero.png',
      };
    },
  });
}

// Fetch all marketing requests (admin)
export function useAllMarketingRequests() {
  return useQuery({
    queryKey: ['all-marketing-requests'],
    queryFn: async () => {
      const { data: requests, error } = await supabase
        .from('marketing_requests')
        .select(`
          *,
          project:projects!inner(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch product pages for each request
      const projectIds = requests?.map(r => r.project_id) || [];
      const { data: productPages } = await supabase
        .from('product_pages')
        .select('project_id, logo_url, banner_url, tagline')
        .in('project_id', projectIds);

      const productPageMap = new Map(productPages?.map(pp => [pp.project_id, pp]) || []);

      return (requests || []).map(req => ({
        ...req,
        product_page: productPageMap.get(req.project_id),
      })) as MarketingRequestWithProject[];
    },
  });
}

// Fetch actionable marketing requests (admin) - pending, approved, paid
export function useActionableMarketingRequests() {
  return useQuery({
    queryKey: ['actionable-marketing-requests'],
    queryFn: async () => {
      const { data: requests, error } = await supabase
        .from('marketing_requests')
        .select(`
          *,
          project:projects!inner(id, name)
        `)
        .in('status', ['pending', 'approved', 'paid'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch product pages for each request
      const projectIds = requests?.map(r => r.project_id) || [];
      const { data: productPages } = await supabase
        .from('product_pages')
        .select('project_id, logo_url, banner_url, tagline')
        .in('project_id', projectIds);

      const productPageMap = new Map(productPages?.map(pp => [pp.project_id, pp]) || []);

      return (requests || []).map(req => ({
        ...req,
        product_page: productPageMap.get(req.project_id),
      })) as MarketingRequestWithProject[];
    },
  });
}

// Keep old hook name for compatibility (deprecated)
export function usePendingMarketingRequests() {
  return useActionableMarketingRequests();
}

// Create a new marketing request
export function useCreateMarketingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      userId,
      durationDays,
      startDate,
      endDate,
      message,
      heroImageUrl,
    }: {
      projectId: string;
      userId: string;
      durationDays: number;
      startDate: string;
      endDate: string;
      message?: string;
      heroImageUrl?: string;
    }) => {
      const priceAda = calculateMarketingPrice(durationDays);

      const { data, error } = await supabase
        .from('marketing_requests')
        .insert({
          project_id: projectId,
          user_id: userId,
          duration_days: durationDays,
          price_ada: priceAda,
          start_date: startDate,
          end_date: endDate,
          message: message || null,
          hero_image_url: heroImageUrl || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-request', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['pending-marketing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-bookings'] });
      toast.success('Marketing request submitted!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit marketing request');
    },
  });
}

// Upload hero image for marketing
export function useUploadMarketingImage() {
  return useMutation({
    mutationFn: async ({ file, projectId }: { file: File; projectId: string }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `marketing/${projectId}/hero-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('product-assets')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload image');
    },
  });
}

// Admin: Approve marketing request (sets to 'approved', user must pay within 24h)
export function useApproveMarketingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId }: { requestId: string }) => {
      // Get the request first
      const { data: request, error: fetchError } = await supabase
        .from('marketing_requests')
        .select('user_id, project_id')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Update the request to approved (NOT active - user must pay first)
      const { error: updateError } = await supabase
        .from('marketing_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create notification for user to pay
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: request.user_id,
          type: 'marketing_approved',
          title: 'Marketing Approved!',
          message: 'Your marketing request has been approved. Complete payment within 24 hours to activate your spotlight.',
          link: `/project/${request.project_id}?tab=marketing`,
        });

      if (notifError) console.error('Failed to create notification:', notifError);

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-marketing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-marketing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-request'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-bookings'] });
      toast.success('Marketing request approved! User notified to complete payment.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve request');
    },
  });
}

// Admin: Approve marketing request as FREE promo (no payment required)
export function useApproveFreeMarketingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId }: { requestId: string }) => {
      // Get the request first
      const { data: request, error: fetchError } = await supabase
        .from('marketing_requests')
        .select('user_id, project_id, start_date, end_date')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Update the request to paid with is_free_promo = true (skips payment)
      const { error: updateError } = await supabase
        .from('marketing_requests')
        .update({
          status: 'paid',
          payment_status: 'completed',
          is_free_promo: true,
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create notification for user
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: request.user_id,
          type: 'marketing_approved',
          title: 'Congratulations! Free Spotlight Granted!',
          message: 'Your marketing request has been approved as a complimentary promotional spotlight! No payment required.',
          link: `/project/${request.project_id}?tab=marketing`,
        });

      if (notifError) console.error('Failed to create notification:', notifError);

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-marketing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-marketing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['actionable-marketing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-request'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-bookings'] });
      toast.success('Free promo granted! User has been notified.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve free promo');
    },
  });
}

// Pay for approved marketing (activates the marketing)
export function usePayForMarketing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId }: { requestId: string }) => {
      // Get the request first
      const { data: request, error: fetchError } = await supabase
        .from('marketing_requests')
        .select('project_id, start_date, end_date, approved_at')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Check if within 24h window
      if (request.approved_at) {
        const approvedAt = new Date(request.approved_at);
        const now = new Date();
        const hoursSinceApproval = (now.getTime() - approvedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceApproval > 24) {
          throw new Error('Payment window has expired (24 hours)');
        }
      }

      // Update the request to active
      const { error: updateError } = await supabase
        .from('marketing_requests')
        .update({
          status: 'active',
          payment_status: 'completed',
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Update product_pages to mark as featured
      const { error: productError } = await supabase
        .from('product_pages')
        .update({
          is_featured: true,
          featured_until: request.end_date,
        })
        .eq('project_id', request.project_id);

      if (productError) throw productError;

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-request'] });
      queryClient.invalidateQueries({ queryKey: ['all-marketing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['active-marketing'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-bookings'] });
      toast.success('Payment confirmed! Your marketing is now active.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to activate marketing');
    },
  });
}

// Admin: Reject marketing request
export function useRejectMarketingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const { error } = await supabase
        .from('marketing_requests')
        .update({
          status: 'rejected',
          admin_notes: reason,
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-marketing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-marketing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-bookings'] });
      toast.success('Marketing request rejected');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject request');
    },
  });
}

// Admin: End marketing early
export function useEndMarketingEarly() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, projectId }: { requestId: string; projectId: string }) => {
      // Update request to completed
      const { error: requestError } = await supabase
        .from('marketing_requests')
        .update({
          status: 'completed',
          end_date: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Remove featured status
      const { error: productError } = await supabase
        .from('product_pages')
        .update({
          is_featured: false,
          featured_until: null,
        })
        .eq('project_id', projectId);

      if (productError) throw productError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-marketing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['actionable-marketing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['active-marketing'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-bookings'] });
      toast.success('Marketing ended');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to end marketing');
    },
  });
}

// Admin: Cancel scheduled (paid) marketing before start date
export function useCancelScheduledMarketing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId }: { requestId: string }) => {
      const { error } = await supabase
        .from('marketing_requests')
        .update({
          status: 'cancelled',
          admin_notes: 'Cancelled by admin before campaign start',
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-marketing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['actionable-marketing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-bookings'] });
      toast.success('Marketing campaign cancelled');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel campaign');
    },
  });
}
