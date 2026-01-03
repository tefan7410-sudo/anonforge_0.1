import { memo } from 'react';
import { type Node, type NodeProps } from '@xyflow/react';
import { Layers } from 'lucide-react';

export type CategoryHeaderData = {
  categoryName: string;
  layerCount: number;
  orderIndex: number;
  [key: string]: unknown;
};

export type CategoryHeaderNodeType = Node<CategoryHeaderData, 'categoryHeader'>;

function CategoryHeaderComponent({ data }: NodeProps<CategoryHeaderNodeType>) {
  const { categoryName, layerCount, orderIndex } = data;

  return (
    <div className="flex w-48 flex-col items-center rounded-lg border border-primary/30 bg-primary/10 px-3 py-2">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">{categoryName}</span>
      </div>
      <span className="text-xs text-muted-foreground">
        {layerCount} layer{layerCount !== 1 ? 's' : ''} • Order {orderIndex + 1}
      </span>
    </div>
  );
}

export const CategoryHeader = memo(CategoryHeaderComponent);
