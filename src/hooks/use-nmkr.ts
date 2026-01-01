import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NmkrProject {
  id: string;
  project_id: string;
  nmkr_project_uid: string;
  nmkr_policy_id: string | null;
  status: string;
  network: string;
  price_in_lovelace: number | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NmkrUpload {
  id: string;
  nmkr_project_id: string;
  generation_id: string;
  nmkr_nft_uid: string | null;
  token_name: string;
  upload_status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface NmkrCounts {
  sold: number;
  reserved: number;
  free: number;
  total: number;
}

export interface NmkrCredentials {
  hasCredentials: boolean;
  isValid: boolean;
  lastValidated: string | null;
}

// Simplified helper function to call NMKR proxy
// Gateway JWT verification is disabled; the edge function validates auth internally
// and returns { success: false, error: "..." } for auth issues (HTTP 200)
async function callNmkrProxy(action: string, params: Record<string, unknown> = {}) {
  console.log(`[NMKR] Calling action: ${action}`);

  // Let the SDK handle auth - it will attach the current session token automatically
  const { data, error } = await supabase.functions.invoke('nmkr-proxy', {
    body: { action, ...params },
  });

  // Handle invoke-level errors (network issues, function not found, etc.)
  if (error) {
    console.log(`[NMKR] Invoke error: ${error.message}`);
    throw new Error(error.message || 'Failed to call NMKR service');
  }

  // Handle application-level errors (success: false from our edge function)
  if (data && data.success === false) {
    // Build a meaningful error message from the response
    let errorMessage = data.error || 'NMKR API returned an error';
    if (data.nmkrStatus) {
      errorMessage = `NMKR API error (${data.nmkrStatus}): ${data.error}`;
    }
    if (data.details && typeof data.details === 'string') {
      // Append first 100 chars of details for context
      const shortDetails = data.details.substring(0, 100);
      errorMessage += ` - ${shortDetails}`;
    }
    console.log(`[NMKR] Action ${action} returned error:`, errorMessage);
    throw new Error(errorMessage);
  }

  console.log(`[NMKR] Action ${action} succeeded`);
  return data;
}

// Get user's NMKR credentials status
export function useNmkrCredentials() {
  return useQuery({
    queryKey: ['nmkr-credentials'],
    queryFn: async (): Promise<NmkrCredentials> => {
      const result = await callNmkrProxy('get-credentials');
      return {
        hasCredentials: result.hasCredentials,
        isValid: result.isValid,
        lastValidated: result.lastValidated,
      };
    },
  });
}

// Save NMKR API key
export function useSaveNmkrApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (apiKey: string) => {
      const result = await callNmkrProxy('store-api-key', { apiKey });
      if (!result.valid) {
        throw new Error('Invalid API key');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nmkr-credentials'] });
    },
  });
}

// Delete NMKR credentials
export function useDeleteNmkrCredentials() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await callNmkrProxy('delete-credentials');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nmkr-credentials'] });
      toast.success('API key removed');
    },
  });
}

// Validate NMKR API key (for testing provided key)
export function useValidateNmkrKey() {
  return useMutation({
    mutationFn: async (apiKey?: string) => {
      return await callNmkrProxy('validate-api-key', apiKey ? { apiKey } : {});
    },
    onError: (error: Error) => {
      toast.error(`API key validation failed: ${error.message}`);
    },
  });
}

// Get NMKR project for a local project
export function useNmkrProject(projectId: string) {
  return useQuery({
    queryKey: ['nmkr-project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nmkr_projects')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;
      return data as NmkrProject | null;
    },
    enabled: !!projectId,
  });
}

// Get NMKR uploads for a project
export function useNmkrUploads(nmkrProjectId: string | undefined) {
  return useQuery({
    queryKey: ['nmkr-uploads', nmkrProjectId],
    queryFn: async () => {
      if (!nmkrProjectId) return [];
      const { data, error } = await supabase
        .from('nmkr_uploads')
        .select('*')
        .eq('nmkr_project_id', nmkrProjectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as NmkrUpload[];
    },
    enabled: !!nmkrProjectId,
  });
}

// Create NMKR project
export function useCreateNmkrProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      projectName,
      description,
      maxNftSupply,
    }: {
      projectId: string;
      projectName: string;
      description?: string;
      maxNftSupply: number;
    }) => {
      // Create project on NMKR
      const result = await callNmkrProxy('create-project', {
        projectName,
        description,
        maxNftSupply,
      });
      const nmkrResult = result.data;

      // Store reference in our database
      const { data, error } = await supabase
        .from('nmkr_projects')
        .insert({
          project_id: projectId,
          nmkr_project_uid: nmkrResult.uid,
          nmkr_policy_id: nmkrResult.policyId || null,
          status: 'draft',
          settings: { nmkrProjectName: projectName },
        })
        .select()
        .single();

      if (error) throw error;
      return data as NmkrProject;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['nmkr-project', variables.projectId] });
      toast.success('NMKR project created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create NMKR project: ${error.message}`);
    },
  });
}

// Get NMKR project details from API
export function useNmkrProjectDetails(nmkrProjectUid: string | undefined) {
  return useQuery({
    queryKey: ['nmkr-project-details', nmkrProjectUid],
    queryFn: async () => {
      if (!nmkrProjectUid) return null;
      const result = await callNmkrProxy('get-project-details', { projectUid: nmkrProjectUid });
      return result.data;
    },
    enabled: !!nmkrProjectUid,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Get NMKR counts (sold, reserved, free)
export function useNmkrCounts(nmkrProjectUid: string | undefined) {
  return useQuery({
    queryKey: ['nmkr-counts', nmkrProjectUid],
    queryFn: async (): Promise<NmkrCounts | null> => {
      if (!nmkrProjectUid) return null;
      const response = await callNmkrProxy('get-counts', { projectUid: nmkrProjectUid });
      const result = response.data;
      return {
        sold: result.sold || 0,
        reserved: result.reserved || 0,
        free: result.free || 0,
        total: (result.sold || 0) + (result.reserved || 0) + (result.free || 0),
      };
    },
    enabled: !!nmkrProjectUid,
    refetchInterval: 30000,
  });
}

// Upload NFT to NMKR
export function useUploadNft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nmkrProjectId,
      nmkrProjectUid,
      generationId,
      tokenName,
      displayName,
      description,
      imageBase64,
    }: {
      nmkrProjectId: string;
      nmkrProjectUid: string;
      generationId: string;
      tokenName: string;
      displayName: string;
      description?: string;
      imageBase64: string;
    }) => {
      // Create upload record
      const { data: uploadRecord, error: insertError } = await supabase
        .from('nmkr_uploads')
        .insert({
          nmkr_project_id: nmkrProjectId,
          generation_id: generationId,
          token_name: tokenName,
          upload_status: 'uploading',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      try {
        // Upload to NMKR
        const response = await callNmkrProxy('upload-nft', {
          projectUid: nmkrProjectUid,
          tokenName,
          displayName,
          description,
          previewImage: {
            mimetype: 'image/png',
            base64: imageBase64,
          },
        });
        const result = response.data;

        // Update record with success
        const { error: updateError } = await supabase
          .from('nmkr_uploads')
          .update({
            nmkr_nft_uid: result.nftUid || result.uid,
            upload_status: 'uploaded',
          })
          .eq('id', uploadRecord.id);

        if (updateError) throw updateError;

        return { ...uploadRecord, nmkr_nft_uid: result.nftUid || result.uid, upload_status: 'uploaded' };
      } catch (error) {
        // Update record with failure
        await supabase
          .from('nmkr_uploads')
          .update({
            upload_status: 'failed',
            error_message: error instanceof Error ? error.message : 'Upload failed',
          })
          .eq('id', uploadRecord.id);

        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['nmkr-uploads', variables.nmkrProjectId] });
      queryClient.invalidateQueries({ queryKey: ['nmkr-counts', variables.nmkrProjectUid] });
    },
  });
}

// Update NMKR pricelist
export function useUpdateNmkrPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nmkrProjectId,
      nmkrProjectUid,
      priceInLovelace,
    }: {
      nmkrProjectId: string;
      nmkrProjectUid: string;
      priceInLovelace: number;
    }) => {
      await callNmkrProxy('update-pricelist', {
        projectUid: nmkrProjectUid,
        priceInLovelace,
      });

      // Update local record
      const { error } = await supabase
        .from('nmkr_projects')
        .update({ price_in_lovelace: priceInLovelace, status: 'ready' })
        .eq('id', nmkrProjectId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['nmkr-project'] });
      queryClient.invalidateQueries({ queryKey: ['nmkr-project-details', variables.nmkrProjectUid] });
      toast.success('Price updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update price: ${error.message}`);
    },
  });
}

// Get NMKR Pay link
export function useGetNmkrPayLink() {
  return useMutation({
    mutationFn: async ({ projectUid }: { projectUid: string }) => {
      const result = await callNmkrProxy('get-nmkr-pay-link', { projectUid });
      return result.data;
    },
    onError: (error: Error) => {
      toast.error(`Failed to get payment link: ${error.message}`);
    },
  });
}
