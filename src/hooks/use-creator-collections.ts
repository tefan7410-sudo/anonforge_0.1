import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CreatorCollection {
  id: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  logo_url: string | null;
  is_live: boolean;
}

export function useCreatorCollections(ownerId: string | undefined, excludeProjectId?: string) {
  return useQuery({
    queryKey: ['creator-collections', ownerId, excludeProjectId],
    queryFn: async (): Promise<CreatorCollection[]> => {
      if (!ownerId) return [];

      // Get all projects by this owner
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('owner_id', ownerId)
        .neq('id', excludeProjectId || '');

      if (projectsError) throw projectsError;
      if (!projects || projects.length === 0) return [];

      // Get product pages for these projects that are live
      const { data: productPages, error: pagesError } = await supabase
        .from('product_pages')
        .select('project_id, banner_url, logo_url, is_live')
        .in('project_id', projects.map(p => p.id))
        .eq('is_live', true);

      if (pagesError) throw pagesError;

      // Combine the data
      const collections: CreatorCollection[] = [];
      for (const project of projects) {
        const productPage = productPages?.find(pp => pp.project_id === project.id);
        if (productPage?.is_live) {
          collections.push({
            id: project.id,
            name: project.name,
            description: project.description,
            banner_url: productPage.banner_url,
            logo_url: productPage.logo_url,
            is_live: true,
          });
        }
      }

      return collections;
    },
    enabled: !!ownerId,
  });
}
