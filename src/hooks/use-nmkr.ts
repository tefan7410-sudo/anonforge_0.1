import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { toast } from 'sonner';

export interface NmkrProject {
  _id: Id<"nmkr_projects">;
  id?: string;
  project_id: Id<"projects">;
  nmkr_project_uid: string;
  nmkr_policy_id: string | null;
  status: string;
  network: string;
  price_in_lovelace: number | null;
  settings: Record<string, unknown>;
  _creationTime: number;
}

export interface NmkrUpload {
  _id: Id<"nmkr_uploads">;
  id?: string;
  nmkr_project_id: Id<"nmkr_projects">;
  generation_id: Id<"generations">;
  nmkr_nft_uid: string | null;
  token_name: string;
  upload_status: string;
  error_message: string | null;
  _creationTime: number;
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

// Get user's NMKR credentials status
export function useNmkrCredentials() {
  // TODO: Implement with Convex action
  return {
    data: {
      hasCredentials: false,
      isValid: false,
      lastValidated: null,
    } as NmkrCredentials,
    isLoading: false,
    error: null,
  };
}

// Save NMKR API key
export function useSaveNmkrApiKey() {
  return {
    mutateAsync: async (apiKey: string) => {
      // TODO: Implement with Convex action
      toast.success('API key saved');
    },
    mutate: () => {},
    isPending: false,
  };
}

// Get NMKR project for a project
export function useNmkrProject(projectId: string | undefined) {
  // TODO: Implement query in Convex
  return {
    data: null as NmkrProject | null | undefined,
    isLoading: false,
    error: null,
  };
}

// Create NMKR project
export function useCreateNmkrProject() {
  return {
    mutateAsync: async (projectId: string, settings: Record<string, unknown>) => {
      // TODO: Implement with Convex action
      toast.success('NMKR project created');
      return { nmkr_project_uid: 'mock-uid' };
    },
    mutate: () => {},
    isPending: false,
  };
}

// Update NMKR project
export function useUpdateNmkrProject() {
  return {
    mutateAsync: async (projectId: string, updates: Record<string, unknown>) => {
      // TODO: Implement with Convex action
      toast.success('NMKR project updated');
    },
    mutate: () => {},
    isPending: false,
  };
}

// Upload NFT to NMKR
export function useUploadToNmkr() {
  return {
    mutateAsync: async (data: {
      projectId: string;
      generationId: string;
      images: Array<{ filename: string; url: string; traits: Record<string, unknown> }>;
    }) => {
      // TODO: Implement with Convex action
      toast.success('Uploading to NMKR...');
    },
    mutate: () => {},
    isPending: false,
  };
}

// Get NMKR counts
export function useNmkrCounts(nmkrProjectUid: string | undefined) {
  // TODO: Implement with Convex action
  return {
    data: {
      sold: 0,
      reserved: 0,
      free: 0,
      total: 0,
    } as NmkrCounts,
    isLoading: false,
    error: null,
  };
}

// Get NMKR pay link
export function useGetNmkrPayLink() {
  return {
    mutateAsync: async (nmkrProjectUid: string) => {
      // TODO: Implement with Convex action
      return { payLink: 'https://mock-pay-link.nmkr.io' };
    },
    mutate: () => {},
    isPending: false,
  };
}

// Mint royalty token
export function useMintRoyaltyToken() {
  return {
    mutateAsync: async (data: {
      projectId: string;
      nmkrProjectUid: string;
    }) => {
      // TODO: Implement with Convex action
      toast.success('Royalty token minted');
    },
    mutate: () => {},
    isPending: false,
  };
}

// Delete NMKR credentials
export function useDeleteNmkrCredentials() {
  return {
    mutateAsync: async () => {
      // TODO: Implement with Convex mutation
      toast.success('API key removed');
    },
    mutate: () => {},
    isPending: false,
  };
}

// Validate NMKR API key
export function useValidateNmkrKey() {
  return {
    mutateAsync: async (apiKey?: string) => {
      // TODO: Implement with Convex action
      return { valid: true };
    },
    mutate: () => {},
    isPending: false,
  };
}

// Get NMKR uploads
export function useNmkrUploads(nmkrProjectId: string | undefined) {
  // TODO: Implement query in Convex
  return {
    data: [] as NmkrUpload[],
    isLoading: false,
    error: null,
  };
}

// Get NMKR project details
export function useNmkrProjectDetails(nmkrProjectUid: string | undefined) {
  // TODO: Implement with Convex action
  return {
    data: null as any,
    isLoading: false,
    error: null,
  };
}

// Upload NFT to NMKR
export function useUploadNft() {
  return {
    mutateAsync: async (data: {
      nmkrProjectId: string;
      generationId: string;
      images: Array<{ filename: string; url: string; traits: Record<string, unknown> }>;
    }) => {
      // TODO: Implement with Convex action
      toast.success('Uploading to NMKR...');
    },
    mutate: () => {},
    isPending: false,
  };
}

// Update NMKR price
export function useUpdateNmkrPrice() {
  return {
    mutateAsync: async (data: {
      projectId: string;
      priceLovelace: number;
    }) => {
      // TODO: Implement with Convex action
      toast.success('Price updated');
    },
    mutate: () => {},
    isPending: false,
  };
}

// Get pricelist
export function useGetPricelist() {
  // TODO: Implement query
  return {
    data: [] as any[],
    isLoading: false,
    error: null,
  };
}

// Update royalty warning dismissed
export function useUpdateRoyaltyWarningDismissed() {
  return {
    mutateAsync: async (projectId: string) => {
      // TODO: Implement with Convex mutation
    },
    mutate: () => {},
    isPending: false,
  };
}

// Update NMKR project settings
export function useUpdateNmkrProjectSettings() {
  return {
    mutateAsync: async (data: {
      projectId: string;
      settings: Record<string, unknown>;
    }) => {
      // TODO: Implement with Convex mutation
      toast.success('Settings updated');
    },
    mutate: () => {},
    isPending: false,
  };
}

// Delete NMKR project
export function useDeleteNmkrProject() {
  return {
    mutateAsync: async (projectId: string) => {
      // TODO: Implement with Convex mutation
      toast.success('NMKR project deleted');
    },
    mutate: () => {},
    isPending: false,
  };
}
