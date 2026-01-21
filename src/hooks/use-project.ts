import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
import { Id } from '../../convex/_generated/dataModel';

export interface Project {
  _id: Id<"projects">;
  id?: string;
  owner_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  token_prefix: string;
  token_start_number: number;
  settings?: Record<string, unknown>;
  nmkr_project_uid?: string;
  _creationTime: number;
}

export interface Category {
  _id: Id<"categories">;
  id?: string;
  project_id: Id<"projects">;
  name: string;
  display_name: string;
  order_index: number;
  _creationTime: number;
}

export interface Layer {
  _id: Id<"layers">;
  id?: string;
  category_id: Id<"categories">;
  filename: string;
  trait_name: string;
  display_name: string;
  storage_path: string;
  rarity_weight: number;
  order_index: number;
  is_effect_layer?: boolean;
  effect_type?: string;
  effect_blend_mode?: string;
  effect_opacity?: number;
  _creationTime: number;
}

export interface LayerExclusion {
  _id: Id<"layer_exclusions">;
  layer_id: Id<"layers">;
  excluded_layer_id: Id<"layers">;
}

export interface LayerEffect {
  _id: Id<"layer_effects">;
  layer_id: Id<"layers">;
  effect_layer_id: Id<"layers">;
}

// Project hooks
export function useProjects() {
  const { user } = useAuth();
  
  const ownedProjects = useQuery(
    api.projects.listByOwner,
    user?.id ? { ownerId: user.id } : "skip"
  );
  
  const sharedProjects = useQuery(
    api.projects.listSharedWith,
    user?.id ? { userId: user.id } : "skip"
  );

  const allProjects = [
    ...(ownedProjects || []),
    ...(sharedProjects || []),
  ];

  return {
    data: allProjects,
    isLoading: ownedProjects === undefined || sharedProjects === undefined,
    error: null,
  };
}

export function useProject(projectId: string | undefined) {
  const project = useQuery(
    api.projects.get,
    projectId ? { id: projectId as Id<"projects"> } : "skip"
  );

  return {
    data: project as Project | null | undefined,
    isLoading: project === undefined,
    error: null,
    refetch: () => {},
  };
}

export function useCreateProject() {
  const createProject = useMutation(api.projects.create);
  const { user } = useAuth();

  return {
    mutateAsync: async (data: {
      name: string;
      description?: string;
      tokenPrefix: string;
      tokenStartNumber?: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const projectId = await createProject({
        owner_id: user.id,
        name: data.name,
        description: data.description,
        token_prefix: data.tokenPrefix,
        token_start_number: data.tokenStartNumber || 1,
      });
      
      return { id: projectId };
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useUpdateProject() {
  const updateProject = useMutation(api.projects.update);

  return {
    mutateAsync: async (data: {
      projectId: string;
      name?: string;
      description?: string;
      isPublic?: boolean;
      tokenPrefix?: string;
      tokenStartNumber?: number;
      settings?: Record<string, unknown>;
    }) => {
      await updateProject({
        id: data.projectId as Id<"projects">,
        name: data.name,
        description: data.description,
        is_public: data.isPublic,
        token_prefix: data.tokenPrefix,
        token_start_number: data.tokenStartNumber,
        settings: data.settings,
      });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useDeleteProject() {
  const deleteProject = useMutation(api.projects.remove);

  return {
    mutateAsync: async (projectId: string) => {
      await deleteProject({ id: projectId as Id<"projects"> });
    },
    mutate: () => {},
    isPending: false,
  };
}

// Category hooks
export function useCategories(projectId: string | undefined) {
  const categories = useQuery(
    api.categories.listByProject,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  return {
    data: categories as Category[] | undefined,
    isLoading: categories === undefined,
    error: null,
    refetch: () => {},
  };
}

export function useCreateCategory() {
  const createCategory = useMutation(api.categories.create);

  return {
    mutateAsync: async (data: {
      projectId: string;
      name: string;
      displayName: string;
      orderIndex: number;
    }) => {
      const id = await createCategory({
        projectId: data.projectId as Id<"projects">,
        name: data.name,
        displayName: data.displayName,
        orderIndex: data.orderIndex,
      });
      return { id };
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useUpdateCategory() {
  const updateCategory = useMutation(api.categories.update);

  return {
    mutateAsync: async (data: {
      categoryId: string;
      displayName?: string;
      orderIndex?: number;
    }) => {
      await updateCategory({
        id: data.categoryId as Id<"categories">,
        displayName: data.displayName,
        orderIndex: data.orderIndex,
      });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useDeleteCategory() {
  const deleteCategory = useMutation(api.categories.remove);

  return {
    mutateAsync: async (categoryId: string) => {
      await deleteCategory({ id: categoryId as Id<"categories"> });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useReorderCategories() {
  const reorderCategories = useMutation(api.categories.reorder);

  return {
    mutateAsync: async (updates: Array<{ id: string; orderIndex: number }>) => {
      await reorderCategories({
        updates: updates.map(u => ({
          id: u.id as Id<"categories">,
          orderIndex: u.orderIndex,
        })),
      });
    },
    mutate: () => {},
    isPending: false,
  };
}

// Layer hooks
export function useLayers(categoryId: string | undefined) {
  const layers = useQuery(
    api.layers.listByCategory,
    categoryId ? { categoryId: categoryId as Id<"categories"> } : "skip"
  );

  return {
    data: layers as Layer[] | undefined,
    isLoading: layers === undefined,
    error: null,
    refetch: () => {},
  };
}

export function useAllLayers(projectId: string | undefined) {
  const layers = useQuery(
    api.layers.listByProject,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  return {
    data: layers as Layer[] | undefined,
    isLoading: layers === undefined,
    error: null,
    refetch: () => {},
  };
}

export function useCreateLayer() {
  const createLayer = useMutation(api.layers.create);

  return {
    mutateAsync: async (data: {
      categoryId: string;
      filename: string;
      traitName: string;
      displayName: string;
      storagePath: string;
      orderIndex: number;
    }) => {
      const id = await createLayer({
        categoryId: data.categoryId as Id<"categories">,
        filename: data.filename,
        traitName: data.traitName,
        displayName: data.displayName,
        storagePath: data.storagePath,
        orderIndex: data.orderIndex,
      });
      return { id };
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useUpdateLayerWeight() {
  const updateWeight = useMutation(api.layers.updateWeight);

  return {
    mutateAsync: async (layerId: string, weight: number) => {
      await updateWeight({
        id: layerId as Id<"layers">,
        rarityWeight: weight,
      });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useUpdateLayerName() {
  const updateName = useMutation(api.layers.updateName);

  return {
    mutateAsync: async (layerId: string, displayName: string) => {
      await updateName({
        id: layerId as Id<"layers">,
        displayName,
      });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useMarkAsEffectLayer() {
  const markAsEffect = useMutation(api.layers.markAsEffect);

  return {
    mutateAsync: async (layerId: string, isEffectLayer: boolean) => {
      await markAsEffect({
        id: layerId as Id<"layers">,
        isEffectLayer,
      });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useDeleteLayer() {
  const deleteLayer = useMutation(api.layers.remove);

  return {
    mutateAsync: async (layerId: string) => {
      await deleteLayer({ id: layerId as Id<"layers"> });
    },
    mutate: () => {},
    isPending: false,
  };
}

// Layer exclusions
export function useLayerExclusions(layerId: string | undefined) {
  const exclusions = useQuery(
    api.layers.getExclusions,
    layerId ? { layerId: layerId as Id<"layers"> } : "skip"
  );

  return {
    data: exclusions as LayerExclusion[] | undefined,
    isLoading: exclusions === undefined,
    error: null,
    refetch: () => {},
  };
}

export function useAllExclusions(projectId: string | undefined) {
  // For now, return empty - would need a new Convex function to get all exclusions for a project
  return {
    data: [] as LayerExclusion[],
    isLoading: false,
    error: null,
  };
}

export function useCreateExclusion() {
  const createExclusion = useMutation(api.layers.createExclusion);

  return {
    mutateAsync: async (layerId: string, excludedLayerId: string) => {
      await createExclusion({
        layerId: layerId as Id<"layers">,
        excludedLayerId: excludedLayerId as Id<"layers">,
      });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useDeleteExclusion() {
  const deleteExclusion = useMutation(api.layers.deleteExclusion);

  return {
    mutateAsync: async (layerId: string, excludedLayerId: string) => {
      await deleteExclusion({
        layerId: layerId as Id<"layers">,
        excludedLayerId: excludedLayerId as Id<"layers">,
      });
    },
    mutate: () => {},
    isPending: false,
  };
}

// Layer effects (placeholder - needs Convex implementation)
export function useLayerEffects(layerId: string | undefined) {
  return {
    data: [] as LayerEffect[],
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}

export function useAllEffects(projectId: string | undefined) {
  return {
    data: [] as LayerEffect[],
    isLoading: false,
    error: null,
  };
}

export function useCreateEffect() {
  return {
    mutateAsync: async (layerId: string, effectLayerId: string) => {
      // TODO: Implement in Convex
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useDeleteEffect() {
  return {
    mutateAsync: async (layerId: string, effectLayerId: string) => {
      // TODO: Implement in Convex
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useUpdateEffectOrder() {
  return {
    mutateAsync: async (layerId: string, effectLayerIds: string[]) => {
      // TODO: Implement in Convex
    },
    mutate: () => {},
    isPending: false,
  };
}

// Layer switches (placeholder - needs Convex implementation)
export interface LayerSwitch {
  _id: string;
  layer_id: string;
  switch_layer_id: string;
}

export function useLayerSwitches(layerId: string | undefined) {
  return {
    data: [] as LayerSwitch[],
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}

export function useAllSwitches(projectId: string | undefined) {
  return {
    data: [] as LayerSwitch[],
    isLoading: false,
    error: null,
  };
}

export function useCreateSwitch() {
  return {
    mutateAsync: async (layerId: string, switchLayerId: string) => {
      // TODO: Implement in Convex
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useDeleteSwitch() {
  return {
    mutateAsync: async (layerId: string, switchLayerId: string) => {
      // TODO: Implement in Convex
    },
    mutate: () => {},
    isPending: false,
  };
}
