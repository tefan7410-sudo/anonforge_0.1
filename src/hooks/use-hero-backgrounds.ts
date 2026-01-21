import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export interface HeroBackground {
  _id: Id<"hero_backgrounds">;
  image_url: string;
  storage_path: string;
  is_active: boolean;
  display_order: number;
  _creationTime: number;
}

export function useHeroBackgrounds() {
  const backgrounds = useQuery(api.admin.getHeroBackgrounds);

  return {
    data: backgrounds as HeroBackground[] | undefined,
    isLoading: backgrounds === undefined,
    error: null,
    refetch: () => {},
  };
}

export function useActiveHeroBackgrounds() {
  const backgrounds = useQuery(api.admin.getHeroBackgrounds);

  const activeBackgrounds = backgrounds?.filter(bg => bg.is_active) || [];

  return {
    data: activeBackgrounds as HeroBackground[],
    isLoading: backgrounds === undefined,
    error: null,
  };
}

export function useAddHeroBackground() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const uploadHeroBackground = useMutation(api.files.uploadHeroBackground);

  return {
    mutateAsync: async (file: File) => {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload file
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      const { storageId } = await response.json();
      
      // Save to database
      const result = await uploadHeroBackground({ storageId });
      return result;
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useToggleHeroBackground() {
  const toggleBackground = useMutation(api.admin.toggleHeroBackground);

  return {
    mutateAsync: async (id: string, isActive: boolean) => {
      await toggleBackground({ id: id as Id<"hero_backgrounds">, isActive });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useDeleteHeroBackground() {
  const deleteBackground = useMutation(api.admin.deleteHeroBackground);

  return {
    mutateAsync: async (id: string) => {
      await deleteBackground({ id: id as Id<"hero_backgrounds"> });
    },
    mutate: () => {},
    isPending: false,
  };
}

// Aliases for admin
export function useAdminHeroBackgrounds() {
  return useHeroBackgrounds();
}

export function useUploadHeroBackground() {
  return useAddHeroBackground();
}

export function useToggleHeroBackgroundActive() {
  return useToggleHeroBackground();
}
