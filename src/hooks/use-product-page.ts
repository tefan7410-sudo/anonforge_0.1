import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateImageUpload, type ImageLimits } from '@/lib/image-validation';

export interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  link?: string;
}

export interface ProductPage {
  id: string;
  project_id: string;
  banner_url: string | null;
  logo_url: string | null;
  tagline: string | null;
  twitter_url: string | null;
  discord_url: string | null;
  website_url: string | null;
  founder_name: string | null;
  founder_pfp_url: string | null;
  founder_bio: string | null;
  founder_twitter: string | null;
  portfolio: PortfolioItem[];
  buy_button_enabled: boolean;
  buy_button_text: string | null;
  buy_button_link: string | null;
  is_live: boolean;
  secondary_market_url: string | null;
  max_supply: number | null;
  scheduled_launch_at: string | null;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductPageUpdate {
  banner_url?: string | null;
  logo_url?: string | null;
  tagline?: string | null;
  twitter_url?: string | null;
  discord_url?: string | null;
  website_url?: string | null;
  founder_name?: string | null;
  founder_pfp_url?: string | null;
  founder_bio?: string | null;
  founder_twitter?: string | null;
  portfolio?: PortfolioItem[];
  buy_button_enabled?: boolean;
  buy_button_text?: string | null;
  buy_button_link?: string | null;
  is_live?: boolean;
  secondary_market_url?: string | null;
  max_supply?: number | null;
  scheduled_launch_at?: string | null;
  is_hidden?: boolean;
}

// Fetch product page for a project
export function useProductPage(projectId: string) {
  return useQuery({
    queryKey: ['product-page', projectId],
    queryFn: async (): Promise<ProductPage | null> => {
      const { data, error } = await supabase
        .from('product_pages')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;
      
      // Parse portfolio JSON
      let portfolioItems: PortfolioItem[] = [];
      if (data.portfolio && Array.isArray(data.portfolio)) {
        portfolioItems = data.portfolio as unknown as PortfolioItem[];
      }
      
      return {
        ...data,
        portfolio: portfolioItems,
        buy_button_enabled: data.buy_button_enabled ?? false,
        buy_button_text: data.buy_button_text,
        buy_button_link: data.buy_button_link,
        is_live: data.is_live ?? false,
        scheduled_launch_at: data.scheduled_launch_at ?? null,
        is_hidden: data.is_hidden ?? false,
      } as ProductPage;
    },
    enabled: !!projectId,
  });
}

// Create or update product page
export function useUpdateProductPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      updates,
    }: {
      projectId: string;
      updates: ProductPageUpdate;
    }) => {
      // Convert portfolio to JSON-compatible format
      const dbUpdates = {
        ...updates,
        portfolio: updates.portfolio ? JSON.parse(JSON.stringify(updates.portfolio)) : undefined,
      };

      // Check if product page exists
      const { data: existing } = await supabase
        .from('product_pages')
        .select('id')
        .eq('project_id', projectId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('product_pages')
          .update(dbUpdates)
          .eq('project_id', projectId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('product_pages')
          .insert({
            project_id: projectId,
            ...dbUpdates,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-page', variables.projectId] });
      toast.success('Product page saved successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save product page: ${error.message}`);
    },
  });
}

// Map product image types to validation types
const imageTypeMap: Record<string, keyof typeof import('@/lib/image-validation').IMAGE_LIMITS> = {
  banner: 'banner',
  logo: 'logo',
  founder: 'founder',
  portfolio: 'portfolio',
};

// Upload image to product-assets bucket with validation
export function useUploadProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      file,
      type,
    }: {
      projectId: string;
      file: File;
      type: 'banner' | 'logo' | 'founder' | 'portfolio';
    }) => {
      // Validate image before upload
      const validationType = imageTypeMap[type] || 'banner';
      const validation = await validateImageUpload(file, validationType);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/${type}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-assets')
        .getPublicUrl(fileName);

      return publicUrl;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-page', variables.projectId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload image: ${error.message}`);
    },
  });
}

// Delete image from product-assets bucket
export function useDeleteProductImage() {
  return useMutation({
    mutationFn: async (url: string) => {
      // Extract path from URL
      const match = url.match(/product-assets\/(.+)$/);
      if (!match) return;
      
      const path = match[1];
      const { error } = await supabase.storage
        .from('product-assets')
        .remove([path]);

      if (error) throw error;
    },
    onError: (error: Error) => {
      console.error('Failed to delete image:', error.message);
    },
  });
}
