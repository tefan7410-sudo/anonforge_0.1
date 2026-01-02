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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trash2, Layers, Search, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  useLayerEffects,
  useCreateEffect,
  useDeleteEffect,
  useUpdateEffectOrder,
  useCategories,
  useAllLayers,
  type Layer,
} from '@/hooks/use-project';

interface LayerEffectsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layer: Layer;
  projectId: string;
}

export function LayerEffectsModal({
  open,
  onOpenChange,
  layer,
  projectId,
}: LayerEffectsModalProps) {
  const [search, setSearch] = useState('');
  const [selectedLayerId, setSelectedLayerId] = useState<string>('');
  const [renderOrder, setRenderOrder] = useState<number>(0);

  const { data: effects, isLoading } = useLayerEffects(layer.id);
  const { data: categories } = useCategories(projectId);
  const { data: allLayers } = useAllLayers(projectId, true);
  const createEffect = useCreateEffect();
  const deleteEffect = useDeleteEffect();
  const updateOrder = useUpdateEffectOrder();

  // Get IDs of layers already linked as effects
  const linkedEffectIds = useMemo(() => {
    return new Set(effects?.map((e) => e.effect_layer_id) || []);
  }, [effects]);

  // Available effect layers (marked as effect layers or not already linked)
  const availableEffectLayers = useMemo(() => {
    if (!allLayers) return [];
    return allLayers.filter(
      (l) => l.is_effect_layer && l.id !== layer.id && !linkedEffectIds.has(l.id)
    );
  }, [allLayers, layer.id, linkedEffectIds]);

  // Filtered by search
  const filteredLayers = useMemo(() => {
    if (!search.trim()) return availableEffectLayers;
    const searchLower = search.toLowerCase();
    return availableEffectLayers.filter(
      (l) =>
        l.display_name.toLowerCase().includes(searchLower) ||
        l.trait_name.toLowerCase().includes(searchLower)
    );
  }, [availableEffectLayers, search]);

  const handleAddEffect = async () => {
    if (!selectedLayerId) return;
    await createEffect.mutateAsync({
      parentLayerId: layer.id,
      effectLayerId: selectedLayerId,
      renderOrder,
      projectId,
    });
    setSelectedLayerId('');
    setRenderOrder(0);
  };

  const handleRemoveEffect = async (effectId: string) => {
    await deleteEffect.mutateAsync({ id: effectId, projectId });
  };

  const handleUpdateOrder = async (effectId: string, newOrder: number) => {
    await updateOrder.mutateAsync({ id: effectId, renderOrder: newOrder, projectId });
  };

  const { data: layerImageUrl } = supabase.storage.from('layers').getPublicUrl(layer.storage_path);

  // Get category name for display
  const getCategoryName = (categoryId: string) => {
    return categories?.find((c) => c.id === categoryId)?.display_name || 'Unknown';
  };

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
            <span>Effect Layers: {layer.display_name}</span>
          </DialogTitle>
          <DialogDescription>
            Link non-metadata layers that should render when this trait is used (e.g., shadows, glows).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Effects */}
          <div>
            <Label className="mb-2 block text-sm font-medium">Linked Effect Layers</Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : effects && effects.length > 0 ? (
              <div className="space-y-2">
                {effects.map((effect) => {
                  const { data: effectUrl } = supabase.storage
                    .from('layers')
                    .getPublicUrl(effect.effect_layer.storage_path);
                  return (
                    <div
                      key={effect.id}
                      className="flex items-center gap-3 rounded-md border border-border/50 bg-muted/30 p-2"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <img
                        src={effectUrl.publicUrl}
                        alt={effect.effect_layer.display_name}
                        className="h-10 w-10 rounded bg-muted object-contain"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{effect.effect_layer.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {getCategoryName(effect.effect_layer.category_id)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Z-Index:</Label>
                        <Input
                          type="number"
                          value={effect.render_order}
                          onChange={(e) =>
                            handleUpdateOrder(effect.id, parseInt(e.target.value) || 0)
                          }
                          className="h-8 w-16 text-center"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemoveEffect(effect.id)}
                        disabled={deleteEffect.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border/50 py-6 text-center text-sm text-muted-foreground">
                <Layers className="mx-auto mb-2 h-6 w-6" />
                No effect layers linked
              </div>
            )}
          </div>

          {/* Add New Effect */}
          <div className="rounded-md border border-border/50 p-4">
            <Label className="mb-3 block text-sm font-medium">Add Effect Layer</Label>
            
            {availableEffectLayers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No effect layers available. Upload layers and mark them as "Effect Layer" in the layer settings.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search effect layers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <ScrollArea className="h-32">
                  <div className="space-y-1">
                    {filteredLayers.map((effectLayer) => {
                      const { data: effectUrl } = supabase.storage
                        .from('layers')
                        .getPublicUrl(effectLayer.storage_path);
                      return (
                        <div
                          key={effectLayer.id}
                          onClick={() => setSelectedLayerId(effectLayer.id)}
                          className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 transition-colors ${
                            selectedLayerId === effectLayer.id
                              ? 'border-primary bg-primary/5'
                              : 'border-transparent hover:bg-muted/50'
                          }`}
                        >
                          <img
                            src={effectUrl.publicUrl}
                            alt={effectLayer.display_name}
                            className="h-8 w-8 rounded bg-muted object-contain"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{effectLayer.display_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {getCategoryName(effectLayer.category_id)}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Effect
                          </Badge>
                        </div>
                      );
                    })}
                    {filteredLayers.length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        {search ? 'No effect layers match your search' : 'No effect layers available'}
                      </p>
                    )}
                  </div>
                </ScrollArea>

                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label className="mb-1 text-xs text-muted-foreground">Render Order (Z-Index)</Label>
                    <Select
                      value={String(renderOrder)}
                      onValueChange={(v) => setRenderOrder(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-2">-2 (Below parent)</SelectItem>
                        <SelectItem value="-1">-1 (Just below parent)</SelectItem>
                        <SelectItem value="0">0 (Same as parent)</SelectItem>
                        <SelectItem value="1">1 (Just above parent)</SelectItem>
                        <SelectItem value="2">2 (Above parent)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleAddEffect}
                    disabled={!selectedLayerId || createEffect.isPending}
                  >
                    {createEffect.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Add Effect
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
