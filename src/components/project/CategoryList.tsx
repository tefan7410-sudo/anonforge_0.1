import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from 'lucide-react';
import {
  useCategories,
  useLayers,
  useUpdateCategory,
  useDeleteCategory,
  useUpdateLayerWeight,
  useDeleteLayer,
  type Category,
  type Layer,
} from '@/hooks/use-project';

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
  const deleteLayer = useDeleteLayer();
  const [weight, setWeight] = useState(layer.rarity_weight);

  const percentage = totalWeight > 0 ? ((weight / totalWeight) * 100).toFixed(1) : '0';

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

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3">
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
        <p className="truncate font-medium">{layer.display_name}</p>
        <p className="truncate text-xs text-muted-foreground">{layer.filename}</p>
      </div>

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
        <Badge variant="secondary" className="w-16 justify-center text-xs">
          {percentage}%
        </Badge>
      </div>

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
  );
}

function CategoryItem({
  category,
  projectId,
}: {
  category: Category;
  projectId: string;
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
      <Card className="border-border/50">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
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
          {categories.length} categories • Adjust weights to control rarity
        </p>
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>
              Weights determine how often each trait appears. Higher weight = more common. The
              percentage shows the probability of selection.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      {categories.map((category) => (
        <CategoryItem key={category.id} category={category} projectId={projectId} />
      ))}
    </div>
  );
}
