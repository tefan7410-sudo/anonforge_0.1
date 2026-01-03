import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MarketingRequest {
  id: string;
  project_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed';
  duration_days: number;
  price_ada: number;
  message: string | null;
  admin_notes: string | null;
  hero_image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  payment_status: 'pending' | 'completed';
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

const PRICE_PER_DAY = 25;

export const calculateMarketingPrice = (days: number) => days * PRICE_PER_DAY;

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

// Fetch pending marketing requests (admin)
export function usePendingMarketingRequests() {
  return useQuery({
    queryKey: ['pending-marketing-requests'],
    queryFn: async () => {
      const { data: requests, error } = await supabase
        .from('marketing_requests')
        .select(`
          *,
          project:projects!inner(id, name)
        `)
        .eq('status', 'pending')
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

// Create a new marketing request
export function useCreateMarketingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      userId,
      durationDays,
      message,
      heroImageUrl,
    }: {
      projectId: string;
      userId: string;
      durationDays: number;
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

// Admin: Approve marketing request
export function useApproveMarketingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId }: { requestId: string }) => {
      const now = new Date();
      
      // Get the request first to calculate end date
      const { data: request, error: fetchError } = await supabase
        .from('marketing_requests')
        .select('duration_days, project_id')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + request.duration_days);

      // Update the request to active
      const { error: updateError } = await supabase
        .from('marketing_requests')
        .update({
          status: 'active',
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Update product_pages to mark as featured
      const { error: productError } = await supabase
        .from('product_pages')
        .update({
          is_featured: true,
          featured_until: endDate.toISOString(),
        })
        .eq('project_id', request.project_id);

      if (productError) throw productError;

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-marketing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-marketing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['active-marketing'] });
      toast.success('Marketing request approved!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve request');
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
      queryClient.invalidateQueries({ queryKey: ['active-marketing'] });
      toast.success('Marketing ended');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to end marketing');
    },
  });
}
