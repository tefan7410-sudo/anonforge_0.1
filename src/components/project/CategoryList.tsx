import { useState, DragEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Check,
  X,
  Info,
  Ban,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  useCategories,
  useLayers,
  useUpdateCategory,
  useDeleteCategory,
  useUpdateLayerWeight,
  useUpdateLayerName,
  useDeleteLayer,
  useReorderCategories,
  useLayerExclusions,
  useLayerEffects,
  useMarkAsEffectLayer,
  type Category,
  type Layer,
} from '@/hooks/use-project';
import { LayerExclusionsModal } from './LayerExclusionsModal';
import { LayerEffectsModal } from './LayerEffectsModal';

interface CategoryListProps {
  projectId: string;
}

function LayerItem({
  layer,
  categoryId,
  projectId,
  totalWeight,
}: {
  layer: Layer;
  categoryId: string;
  projectId: string;
  totalWeight: number;
}) {
  const updateWeight = useUpdateLayerWeight();
  const updateName = useUpdateLayerName();
  const deleteLayer = useDeleteLayer();
  const markAsEffect = useMarkAsEffectLayer();
  const [weight, setWeight] = useState(layer.rarity_weight);
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(layer.display_name);
  const [showExclusionsModal, setShowExclusionsModal] = useState(false);
  const [showEffectsModal, setShowEffectsModal] = useState(false);

  const { data: exclusions } = useLayerExclusions(layer.id);
  const { data: effects } = useLayerEffects(layer.id);

  const exclusionCount = exclusions?.length ? Math.floor(exclusions.length / 2) : 0; // Bidirectional, so divide by 2
  const effectCount = effects?.length || 0;

  const percentage = totalWeight > 0 ? ((weight / totalWeight) * 100).toFixed(1) : '0';
  const isZeroWeight = weight === 0;
  const isEffectLayer = layer.is_effect_layer;

  const { data: publicUrl } = supabase.storage.from('layers').getPublicUrl(layer.storage_path);

  const handleWeightChange = (value: number[]) => {
    setWeight(value[0]);
  };

  const handleWeightCommit = () => {
    if (weight !== layer.rarity_weight) {
      updateWeight.mutate({
        id: layer.id,
        categoryId,
        projectId,
        rarityWeight: weight,
      });
    }
  };

  const handleSaveName = () => {
    if (displayName.trim() && displayName !== layer.display_name) {
      updateName.mutate({
        id: layer.id,
        categoryId,
        projectId,
        displayName: displayName.trim(),
      });
    }
    setIsEditingName(false);
  };

  const handleCancelName = () => {
    setDisplayName(layer.display_name);
    setIsEditingName(false);
  };

  const handleToggleEffectLayer = () => {
    markAsEffect.mutate({
      id: layer.id,
      isEffectLayer: !isEffectLayer,
      projectId,
    });
  };

  return (
    <>
      <div className={`group flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3 ${isZeroWeight || isEffectLayer ? 'opacity-60' : ''} ${isEffectLayer ? 'border-dashed border-primary/30' : ''}`}>
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
          <img
            src={publicUrl.publicUrl}
            alt={layer.display_name}
            className="h-full w-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '';
              (e.target as HTMLImageElement).classList.add('hidden');
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-7"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') handleCancelName();
                }}
              />
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleSaveName}>
                <Check className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleCancelName}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group/name">
              <p className="truncate font-medium">{layer.display_name}</p>
              {isEffectLayer && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/50 text-primary">
                  Effect
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0 opacity-0 group-hover/name:opacity-100 transition-opacity"
                onClick={() => setIsEditingName(true)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          )}
          <p className="truncate text-xs text-muted-foreground">{layer.filename}</p>
        </div>

        {/* Exclusions & Effects buttons */}
        {!isEffectLayer && (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${exclusionCount > 0 ? 'text-destructive' : 'opacity-0 group-hover:opacity-100'}`}
                  onClick={() => setShowExclusionsModal(true)}
                >
                  <Ban className="h-3.5 w-3.5" />
                  {exclusionCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[9px] text-destructive-foreground">
                      {exclusionCount}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {exclusionCount > 0 ? `${exclusionCount} exclusion${exclusionCount !== 1 ? 's' : ''}` : 'Set exclusions'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${effectCount > 0 ? 'text-primary' : 'opacity-0 group-hover:opacity-100'}`}
                  onClick={() => setShowEffectsModal(true)}
                >
                  <Layers className="h-3.5 w-3.5" />
                  {effectCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
                      {effectCount}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {effectCount > 0 ? `${effectCount} effect layer${effectCount !== 1 ? 's' : ''}` : 'Link effect layers'}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Effect layer toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100">
              <Switch
                id={`effect-${layer.id}`}
                checked={isEffectLayer}
                onCheckedChange={handleToggleEffectLayer}
                className="scale-75"
              />
              <Label htmlFor={`effect-${layer.id}`} className="text-[10px] text-muted-foreground cursor-pointer">
                <Sparkles className="h-3 w-3" />
              </Label>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {isEffectLayer ? 'This is an effect layer (not in metadata)' : 'Mark as effect layer'}
          </TooltipContent>
        </Tooltip>

        {/* Rarity slider - only for non-effect layers */}
        {!isEffectLayer && (
          <div className="flex w-48 items-center gap-2">
            <Slider
              value={[weight]}
              onValueChange={handleWeightChange}
              onValueCommit={handleWeightCommit}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center gap-0.5">
                  <Badge variant="outline" className="w-12 justify-center text-[10px] cursor-help">
                    {weight}
                  </Badge>
                  <span className={`text-[9px] ${isZeroWeight ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {isZeroWeight ? "won't appear" : `${percentage}%`}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">Weight: {weight}/100 points</p>
                <p className="text-xs text-muted-foreground">
                  {isZeroWeight 
                    ? 'This trait will never appear in generation' 
                    : `Drop rate: ${percentage}% (based on total category weight)`}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete layer?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{layer.display_name}" and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deleteLayer.mutate({
                    id: layer.id,
                    categoryId,
                    projectId,
                    storagePath: layer.storage_path,
                  })
                }
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Modals */}
      <LayerExclusionsModal
        open={showExclusionsModal}
        onOpenChange={setShowExclusionsModal}
        layer={layer}
        projectId={projectId}
      />
      <LayerEffectsModal
        open={showEffectsModal}
        onOpenChange={setShowEffectsModal}
        layer={layer}
        projectId={projectId}
      />
    </>
  );
}

function CategoryItem({
  category,
  projectId,
  index,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: {
  category: Category;
  projectId: string;
  index: number;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (e: DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>, index: number) => void;
  onDragEnd: () => void;
  onDrop: (e: DragEvent<HTMLDivElement>, index: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(category.display_name);
  
  const { data: layers, isLoading } = useLayers(category.id);
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const totalWeight = layers?.reduce((sum, l) => sum + l.rarity_weight, 0) || 0;

  const handleSave = () => {
    if (displayName.trim() && displayName !== category.display_name) {
      updateCategory.mutate({
        id: category.id,
        projectId,
        displayName: displayName.trim(),
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDisplayName(category.display_name);
    setIsEditing(false);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card 
        className={`border-border/50 transition-all ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'ring-2 ring-primary' : ''}`}
        draggable
        onDragStart={(e) => onDragStart(e, index)}
        onDragOver={(e) => onDragOver(e, index)}
        onDragEnd={onDragEnd}
        onDrop={(e) => onDrop(e, index)}
      >
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="cursor-grab text-muted-foreground hover:text-foreground" title="Drag to reorder">
                <GripVertical className="h-4 w-4" />
              </div>
              <Badge variant="outline" className="h-5 w-5 justify-center p-0 text-xs font-mono">
                {index}
              </Badge>
              <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {isEditing ? (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="h-7 w-40"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') handleCancel();
                      }}
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSave}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancel}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <CardTitle className="text-base font-medium">{category.display_name}</CardTitle>
                )}
              </CollapsibleTrigger>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {layers?.length || 0} traits
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rename category</TooltipContent>
              </Tooltip>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete category?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{category.display_name}" and all its layers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteCategory.mutate({ id: category.id, projectId })}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : layers && layers.length > 0 ? (
              <div className="space-y-2">
                {layers.map((layer) => (
                  <LayerItem
                    key={layer.id}
                    layer={layer}
                    categoryId={category.id}
                    projectId={projectId}
                    totalWeight={totalWeight}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No layers in this category</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function CategoryList({ projectId }: CategoryListProps) {
  const { data: categories, isLoading } = useCategories(projectId);
  const reorderCategories = useReorderCategories();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex || !categories) return;

    const reordered = [...categories];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, removed);

    const updates = reordered.map((cat, idx) => ({ id: cat.id, orderIndex: idx }));
    reorderCategories.mutate({ projectId, categories: updates });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 py-16">
        <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="mb-1 font-display text-lg font-medium">No layers yet</h3>
        <p className="text-sm text-muted-foreground">Upload layers to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {categories.length} categories • Drag to reorder (0 = bottom layer)
        </p>
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>
              Drag categories to set layer order. Layer 0 is rendered first (bottom), higher numbers on top.
              Weights determine trait rarity within each category.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      {categories.map((category, index) => (
        <CategoryItem
          key={category.id}
          category={category}
          projectId={projectId}
          index={index}
          isDragging={draggedIndex === index}
          isDragOver={dragOverIndex === index}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}
