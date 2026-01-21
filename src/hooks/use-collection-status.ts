import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

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
  // This would need a Convex action to call NMKR API
  // For now, return empty status map
  return {
    data: {} as CollectionStatusMap,
    isLoading: false,
    error: null,
  };
}
