import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LayerNodeData = {
  layer: {
    id: string;
    display_name: string;
    storage_path: string;
    rarity_weight: number;
    is_effect_layer: boolean;
    category_id: string;
  };
  categoryName: string;
  totalWeight: number;
  isReadOnly?: boolean;
  [key: string]: unknown;
};

export type LayerNodeType = Node<LayerNodeData, 'layer'>;

function LayerNodeComponent({ data, selected }: NodeProps<LayerNodeType>) {
  const { layer, totalWeight, isReadOnly } = data;
  const rarityPercent = totalWeight > 0 
    ? ((layer.rarity_weight / totalWeight) * 100).toFixed(1) 
    : '0';

  // Get public URL for storage path
  const imageUrl = layer.storage_path.startsWith('http') 
    ? layer.storage_path 
    : `https://tyrsrwmwwfqdzsmogjwb.supabase.co/storage/v1/object/public/${layer.storage_path}`;

  return (
    <div
      className={cn(
        'relative w-48 rounded-lg border bg-card p-2 shadow-sm transition-all',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border',
        layer.is_effect_layer && 'border-purple-500/50 bg-purple-500/5'
      )}
    >
      {/* Connection Handles */}
      {!isReadOnly && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            className="!h-4 !w-4 !-left-2 !border-2 !border-background !bg-primary hover:!bg-primary/80 hover:!scale-125 transition-transform cursor-crosshair"
            title="Drop connection here"
          />
          <Handle
            type="source"
            position={Position.Right}
            className="!h-4 !w-4 !-right-2 !border-2 !border-background !bg-primary hover:!bg-primary/80 hover:!scale-125 transition-transform cursor-crosshair"
            title="Drag to create connection"
          />
        </>
      )}

      {/* Layer Image */}
      <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-md bg-muted/50">
        <img
          src={imageUrl}
          alt={layer.display_name}
          className="h-full w-full object-contain"
          draggable={false}
        />
        {layer.is_effect_layer && (
          <Badge className="absolute right-1 top-1 bg-purple-500 text-[10px] px-1.5 py-0.5">
            <Sparkles className="mr-0.5 h-2.5 w-2.5" />
            Effect
          </Badge>
        )}
      </div>

      {/* Layer Info */}
      <div className="space-y-1">
        <p className="truncate text-sm font-medium leading-tight">
          {layer.display_name}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Rarity</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {rarityPercent}%
          </Badge>
        </div>
      </div>
    </div>
  );
}

export const LayerNode = memo(LayerNodeComponent);
