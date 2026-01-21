import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { toast } from 'sonner';

export interface ProductPage {
  _id: Id<"product_pages">;
  project_id: Id<"projects">;
  slug?: string;
  tagline?: string;
  logo_url?: string;
  banner_url?: string;
  collection_type?: string;
  max_supply?: number;
  twitter_url?: string;
  discord_url?: string;
  website_url?: string;
  founder_name?: string;
  founder_bio?: string;
  founder_pfp_url?: string;
  founder_twitter?: string;
  buy_button_enabled?: boolean;
  buy_button_text?: string;
  buy_button_link?: string;
  is_live?: boolean;
  is_featured?: boolean;
  is_hidden?: boolean;
  featured_until?: string;
  admin_approved?: boolean;
  _creationTime: number;
  project?: {
    _id: Id<"projects">;
    name: string;
  };
}

export function useProductPage(projectId: string | undefined) {
  const productPage = useQuery(
    api.productPages.getByProject,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  return {
    data: productPage as ProductPage | null | undefined,
    isLoading: productPage === undefined,
    error: null,
    refetch: () => {},
  };
}

export function useProductPageBySlug(slug: string | undefined) {
  const productPage = useQuery(
    api.productPages.getBySlug,
    slug ? { slug } : "skip"
  );

  return {
    data: productPage as ProductPage | null | undefined,
    isLoading: productPage === undefined,
    error: null,
  };
}

export function useLiveProductPages() {
  const pages = useQuery(api.productPages.listLive);

  return {
    data: pages as ProductPage[] | undefined,
    isLoading: pages === undefined,
    error: null,
  };
}

export function useFeaturedProductPages() {
  const pages = useQuery(api.productPages.listFeatured);

  return {
    data: pages as ProductPage[] | undefined,
    isLoading: pages === undefined,
    error: null,
  };
}

export function useUpdateProductPage() {
  const upsertProductPage = useMutation(api.productPages.upsert);

  return {
    mutateAsync: async (data: {
      projectId: string;
      slug?: string;
      tagline?: string;
      logoUrl?: string;
      bannerUrl?: string;
      collectionType?: string;
      maxSupply?: number;
      twitterUrl?: string;
      discordUrl?: string;
      websiteUrl?: string;
      founderName?: string;
      founderBio?: string;
      founderPfpUrl?: string;
      founderTwitter?: string;
      buyButtonEnabled?: boolean;
      buyButtonText?: string;
      buyButtonLink?: string;
    }) => {
      await upsertProductPage({
        projectId: data.projectId as Id<"projects">,
        slug: data.slug,
        tagline: data.tagline,
        logoUrl: data.logoUrl,
        bannerUrl: data.bannerUrl,
        collectionType: data.collectionType,
        maxSupply: data.maxSupply,
        twitterUrl: data.twitterUrl,
        discordUrl: data.discordUrl,
        websiteUrl: data.websiteUrl,
        founderName: data.founderName,
        founderBio: data.founderBio,
        founderPfpUrl: data.founderPfpUrl,
        founderTwitter: data.founderTwitter,
        buyButtonEnabled: data.buyButtonEnabled,
        buyButtonText: data.buyButtonText,
        buyButtonLink: data.buyButtonLink,
      });

      toast.success('Product page updated');
    },
    mutate: () => {},
    isPending: false,
  };
}

export function usePublishProductPage() {
  const publishPage = useMutation(api.productPages.publish);

  return {
    mutateAsync: async (projectId: string) => {
      await publishPage({ projectId: projectId as Id<"projects"> });
      toast.success('Product page published');
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useUnpublishProductPage() {
  const unpublishPage = useMutation(api.productPages.unpublish);

  return {
    mutateAsync: async (projectId: string) => {
      await unpublishPage({ projectId: projectId as Id<"projects"> });
      toast.success('Product page unpublished');
    },
    mutate: () => {},
    isPending: false,
  };
}

// Additional types
export type CollectionType = 'pfp' | 'generative' | 'art' | 'utility' | 'other';

export interface PreviewImage {
  id: string;
  url: string;
  filename: string;
}

export interface ArtworkItem {
  id: string;
  url: string;
  filename: string;
  order: number;
}

// Image upload hooks
export function useUploadProductImage() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const uploadProductAsset = useMutation(api.files.uploadProductAsset);

  return {
    mutateAsync: async (data: {
      projectId: string;
      file: File;
      type: 'logo' | 'banner' | 'founder_pfp' | 'hero';
    }) => {
      const uploadUrl = await generateUploadUrl();
      
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": data.file.type },
        body: data.file,
      });
      
      const { storageId } = await response.json();
      
      const url = await uploadProductAsset({
        storageId,
        projectId: data.projectId as Id<"projects">,
        assetType: data.type,
      });
      
      toast.success('Image uploaded');
      return url;
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useDeleteProductImage() {
  const deleteFile = useMutation(api.files.deleteFile);

  return {
    mutateAsync: async (data: {
      projectId: string;
      type: 'logo' | 'banner' | 'founder_pfp' | 'hero';
    }) => {
      // TODO: Implement deletion
      toast.success('Image deleted');
    },
    mutate: () => {},
    isPending: false,
  };
}
