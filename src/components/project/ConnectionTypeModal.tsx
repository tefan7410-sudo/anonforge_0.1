import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Ban, Sparkles, ArrowLeftRight } from 'lucide-react';

export type ConnectionType = 'exclusion' | 'effect' | 'switch';

interface LayerInfo {
  id: string;
  display_name: string;
  storage_path: string;
  is_effect_layer: boolean;
  category_id: string;
}

interface ConnectionTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceLayer: LayerInfo | null;
  targetLayer: LayerInfo | null;
  onConfirm: (type: ConnectionType) => void;
}

export function ConnectionTypeModal({
  open,
  onOpenChange,
  sourceLayer,
  targetLayer,
  onConfirm,
}: ConnectionTypeModalProps) {
  const [selectedType, setSelectedType] = useState<ConnectionType>('exclusion');

  if (!sourceLayer || !targetLayer) return null;

  const getImageUrl = (storagePath: string) => {
    return storagePath.startsWith('http')
      ? storagePath
      : `https://tyrsrwmwwfqdzsmogjwb.supabase.co/storage/v1/object/public/layers/${storagePath}`;
  };

  // Check if layers are from different categories (required for exclusions and switches)
  const sameCategory = sourceLayer.category_id === targetLayer.category_id;
  
  // Check if target is an effect layer (required for effect connection)
  const targetIsEffectLayer = targetLayer.is_effect_layer;

  const handleConfirm = () => {
    onConfirm(selectedType);
    onOpenChange(false);
    setSelectedType('exclusion');
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedType('exclusion');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Connection</DialogTitle>
          <DialogDescription>
            Choose the type of relationship between these layers
          </DialogDescription>
        </DialogHeader>

        {/* Layer Preview */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="flex flex-col items-center gap-1">
            <div className="h-16 w-16 overflow-hidden rounded-md border border-border bg-muted">
              <img
                src={getImageUrl(sourceLayer.storage_path)}
                alt={sourceLayer.display_name}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="max-w-[80px] truncate text-xs text-muted-foreground">
              {sourceLayer.display_name}
            </span>
          </div>
          <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
          <div className="flex flex-col items-center gap-1">
            <div className="h-16 w-16 overflow-hidden rounded-md border border-border bg-muted">
              <img
                src={getImageUrl(targetLayer.storage_path)}
                alt={targetLayer.display_name}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="max-w-[80px] truncate text-xs text-muted-foreground">
              {targetLayer.display_name}
            </span>
          </div>
        </div>

        {/* Connection Type Selection */}
        <RadioGroup
          value={selectedType}
          onValueChange={(value) => setSelectedType(value as ConnectionType)}
          className="gap-3"
        >
          {/* Exclusion Option */}
          <div className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-muted/50">
            <RadioGroupItem 
              value="exclusion" 
              id="exclusion" 
              disabled={sameCategory}
            />
            <Label 
              htmlFor="exclusion" 
              className={`flex flex-1 cursor-pointer items-center gap-3 ${sameCategory ? 'opacity-50' : ''}`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                <Ban className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Exclusion</p>
                <p className="text-xs text-muted-foreground">
                  {sameCategory 
                    ? 'Layers must be from different categories' 
                    : 'These layers cannot appear together'}
                </p>
              </div>
            </Label>
          </div>

          {/* Layer Switch Option */}
          <div className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-muted/50">
            <RadioGroupItem 
              value="switch" 
              id="switch"
              disabled={sameCategory}
            />
            <Label 
              htmlFor="switch" 
              className={`flex flex-1 cursor-pointer items-center gap-3 ${sameCategory ? 'opacity-50' : ''}`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/10">
                <ArrowLeftRight className="h-4 w-4 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Layer Switch</p>
                <p className="text-xs text-muted-foreground">
                  {sameCategory 
                    ? 'Layers must be from different categories' 
                    : 'Swap rendering order when combined'}
                </p>
              </div>
            </Label>
          </div>

          {/* Effect Link Option */}
          <div className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-muted/50">
            <RadioGroupItem 
              value="effect" 
              id="effect"
              disabled={!targetIsEffectLayer}
            />
            <Label 
              htmlFor="effect" 
              className={`flex flex-1 cursor-pointer items-center gap-3 ${!targetIsEffectLayer ? 'opacity-50' : ''}`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Effect Link</p>
                <p className="text-xs text-muted-foreground">
                  {!targetIsEffectLayer 
                    ? 'Target must be an effect layer' 
                    : 'Apply effect layer when parent is selected'}
                </p>
              </div>
            </Label>
          </div>
        </RadioGroup>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Create Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
