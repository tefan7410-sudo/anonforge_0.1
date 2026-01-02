import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CollectionStatus {
  isSoldOut: boolean;
  sold: number;
  free: number;
  total: number;
}

interface CollectionStatusMap {
  [projectId: string]: CollectionStatus | null;
}

export function useCollectionStatuses(projectIds: string[]) {
  return useQuery({
    queryKey: ['collection-statuses', projectIds],
    queryFn: async (): Promise<CollectionStatusMap> => {
      if (!projectIds.length) return {};

      // Fetch NMKR projects for all project IDs
      const { data: nmkrProjects, error } = await supabase
        .from('nmkr_projects')
        .select('project_id, nmkr_project_uid')
        .in('project_id', projectIds);

      if (error) throw error;

      const statusMap: CollectionStatusMap = {};
      
      // Initialize all as null
      projectIds.forEach(id => {
        statusMap[id] = null;
      });

      // Fetch counts for each NMKR project
      const fetchPromises = (nmkrProjects || []).map(async (np) => {
        if (!np.nmkr_project_uid) return;
        
        try {
          const response = await fetch(
            `https://studio-api.nmkr.io/v2/GetCounts/${np.nmkr_project_uid}`
          );
          
          if (response.ok) {
            const data = await response.json();
            statusMap[np.project_id] = {
              sold: data.sold || 0,
              free: data.free || 0,
              total: data.total || 0,
              isSoldOut: (data.free || 0) === 0 && (data.total || 0) > 0,
            };
          }
        } catch (err) {
          console.error(`Failed to fetch counts for ${np.nmkr_project_uid}:`, err);
        }
      });

      await Promise.all(fetchPromises);
      
      return statusMap;
    },
    enabled: projectIds.length > 0,
    staleTime: 60000, // Cache for 1 minute
  });
}
