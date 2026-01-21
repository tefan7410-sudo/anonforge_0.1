import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
import { Id } from '../../convex/_generated/dataModel';

export interface Profile {
  _id: Id<"profiles">;
  email: string;
  display_name?: string;
  avatar_url?: string;
  twitter_handle?: string;
  is_verified_creator?: boolean;
  stake_address?: string;
  wallet_address?: string;
  accepted_terms_at?: string;
  _creationTime: number;
}

export function useProfile(userId: string | undefined) {
  return useQuery(
    api.profiles.get,
    userId ? { userId } : "skip"
  );
}

export function useMyProfile() {
  return useQuery(api.profiles.me);
}

export function useUpdateProfile() {
  const updateProfile = useMutation(api.profiles.update);
  
  return {
    mutateAsync: async ({
      userId,
      displayName,
      avatarUrl,
    }: {
      userId: string;
      displayName?: string;
      avatarUrl?: string;
    }) => {
      // Get profile ID first
      // For now, we'll call the upsert which handles both create and update
      await updateProfile({
        id: userId as unknown as Id<"profiles">,
        display_name: displayName,
        avatar_url: avatarUrl,
      });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useUploadAvatar() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const uploadAvatar = useMutation(api.files.uploadAvatar);

  return {
    mutateAsync: async ({ userId, file }: { userId: string; file: File }) => {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload file
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      const { storageId } = await response.json();
      
      // Save to profile
      const url = await uploadAvatar({ storageId });
      return url;
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useSyncProfileToCollections() {
  // This will be a Convex action that updates all product pages
  return {
    mutateAsync: async (_params: { userId: string; avatarUrl?: string; displayName?: string }) => {
      // TODO: Implement as Convex action
      return { updated: 0 };
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useDeleteAccount() {
  const { signOut } = useAuth();
  
  return {
    mutateAsync: async () => {
      // TODO: Implement account deletion in Convex
      await signOut();
      return { success: true };
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useResetPassword() {
  return {
    mutateAsync: async ({ email }: { email: string }) => {
      // Clerk handles password reset
      // This is a no-op placeholder
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useIsProfileIncomplete(userId: string | undefined) {
  return useQuery(
    api.profiles.isIncomplete,
    userId ? { userId } : "skip"
  );
}
