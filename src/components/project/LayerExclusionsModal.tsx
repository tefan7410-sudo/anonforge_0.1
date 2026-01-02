import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Ban, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import {
  useLayerExclusions,
  useCreateExclusion,
  useDeleteExclusion,
  useCategories,
  useAllLayers,
  type Layer,
} from '@/hooks/use-project';

interface LayerExclusionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layer: Layer;
  projectId: string;
}

export function LayerExclusionsModal({
  open,
  onOpenChange,
  layer,
  projectId,
}: LayerExclusionsModalProps) {
  const [search, setSearch] = useState('');
  const { data: exclusions, isLoading: loadingExclusions } = useLayerExclusions(layer.id);
  const { data: categories } = useCategories(projectId);
  const { data: allLayers } = useAllLayers(projectId, true);
  const createExclusion = useCreateExclusion();
  const deleteExclusion = useDeleteExclusion();

  // Get all excluded layer IDs for this layer
  const excludedLayerIds = useMemo(() => {
    const ids = new Set<string>();
    exclusions?.forEach((e) => {
      if (e.layer_id === layer.id) {
        ids.add(e.excluded_layer_id);
      } else {
        ids.add(e.layer_id);
      }
    });
    return ids;
  }, [exclusions, layer.id]);

  // Filter layers: only show layers from OTHER categories (same category doesn't make sense)
  const availableLayers = useMemo(() => {
    if (!allLayers || !categories) return [];
    return allLayers.filter(
      (l) => l.category_id !== layer.category_id && l.id !== layer.id && !l.is_effect_layer
    );
  }, [allLayers, layer.category_id, layer.id, categories]);

  // Group by category for display
  const groupedLayers = useMemo(() => {
    const grouped = new Map<string, { category: string; layers: Layer[] }>();
    availableLayers.forEach((l) => {
      const category = categories?.find((c) => c.id === l.category_id);
      const categoryName = category?.display_name || 'Unknown';
      if (!grouped.has(l.category_id)) {
        grouped.set(l.category_id, { category: categoryName, layers: [] });
      }
      grouped.get(l.category_id)!.layers.push(l);
    });
    return Array.from(grouped.values());
  }, [availableLayers, categories]);

  // Filter by search
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groupedLayers;
    const searchLower = search.toLowerCase();
    return groupedLayers
      .map((group) => ({
        ...group,
        layers: group.layers.filter(
          (l) =>
            l.display_name.toLowerCase().includes(searchLower) ||
            l.trait_name.toLowerCase().includes(searchLower)
        ),
      }))
      .filter((group) => group.layers.length > 0);
  }, [groupedLayers, search]);

  const handleToggle = async (targetLayer: Layer) => {
    const isExcluded = excludedLayerIds.has(targetLayer.id);
    if (isExcluded) {
      await deleteExclusion.mutateAsync({
        layerId: layer.id,
        excludedLayerId: targetLayer.id,
        projectId,
      });
    } else {
      await createExclusion.mutateAsync({
        layerId: layer.id,
        excludedLayerId: targetLayer.id,
        projectId,
      });
    }
  };

  const { data: layerImageUrl } = supabase.storage.from('layers').getPublicUrl(layer.storage_path);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <img
              src={layerImageUrl.publicUrl}
              alt={layer.display_name}
              className="h-10 w-10 rounded-md bg-muted object-contain"
            />
            <span>Exclusion Rules: {layer.display_name}</span>
          </DialogTitle>
          <DialogDescription>
            Select layers that should never appear together with this trait during generation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search layers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loadingExclusions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {filteredGroups.map((group) => (
                  <div key={group.category}>
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="secondary">{group.category}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {group.layers.filter((l) => excludedLayerIds.has(l.id)).length} excluded
                      </span>
                    </div>
                    <div className="space-y-1">
                      {group.layers.map((targetLayer) => {
                        const isExcluded = excludedLayerIds.has(targetLayer.id);
                        const { data: targetUrl } = supabase.storage
                          .from('layers')
                          .getPublicUrl(targetLayer.storage_path);
                        return (
                          <div
                            key={targetLayer.id}
                            className={`flex items-center gap-3 rounded-md border p-2 transition-colors ${
                              isExcluded
                                ? 'border-destructive/30 bg-destructive/5'
                                : 'border-border/50 hover:bg-muted/50'
                            }`}
                          >
                            <Checkbox
                              id={targetLayer.id}
                              checked={isExcluded}
                              onCheckedChange={() => handleToggle(targetLayer)}
                              disabled={createExclusion.isPending || deleteExclusion.isPending}
                            />
                            <img
                              src={targetUrl.publicUrl}
                              alt={targetLayer.display_name}
                              className="h-8 w-8 rounded bg-muted object-contain"
                            />
                            <label
                              htmlFor={targetLayer.id}
                              className="flex-1 cursor-pointer text-sm font-medium"
                            >
                              {targetLayer.display_name}
                            </label>
                            {isExcluded && (
                              <Ban className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {filteredGroups.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    {search ? 'No layers match your search' : 'No other layers available'}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">
              {excludedLayerIds.size} exclusion{excludedLayerIds.size !== 1 ? 's' : ''} set
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
