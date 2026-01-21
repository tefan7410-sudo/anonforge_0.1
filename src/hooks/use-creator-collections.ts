import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface CreatorCollection {
  id: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  logo_url: string | null;
  slug: string | null;
  is_live: boolean;
}

export function useCreatorCollections(ownerId: string | undefined, excludeProjectId?: string) {
  // Get all projects by this owner
  const projects = useQuery(
    api.projects.listByOwner,
    ownerId ? { ownerId } : "skip"
  );

  // Get product pages for these projects
  const productPages = useQuery(
    api.productPages.listLive,
    projects ? {} : "skip"
  );

  // Combine the data
  const collections: CreatorCollection[] = [];
  
  if (projects && productPages) {
    for (const project of projects) {
      if (excludeProjectId && project._id === excludeProjectId) continue;
      
      const productPage = productPages.find(pp => pp.project_id === project._id);
      if (productPage?.is_live) {
        collections.push({
          id: project._id,
          name: project.name,
          description: project.description || null,
          banner_url: productPage.banner_url || null,
          logo_url: productPage.logo_url || null,
          slug: productPage.slug || null,
          is_live: true,
        });
      }
    }
  }

  return {
    data: collections,
    isLoading: projects === undefined || productPages === undefined,
    error: null,
  };
}
