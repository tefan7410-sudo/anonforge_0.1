import { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCategories, useAllLayers, useAllExclusions, useAllEffects, useAllSwitches, type Layer } from '@/hooks/use-project';
import { LayerNode, type LayerNodeData, type LayerNodeType } from './nodes/LayerNode';
import { CategoryHeader, type CategoryHeaderData, type CategoryHeaderNodeType } from './nodes/CategoryHeader';
import { ExclusionEdge } from './edges/ExclusionEdge';
import { EffectEdge } from './edges/EffectEdge';
import { SwitchEdge } from './edges/SwitchEdge';
import { LayerNodeControls } from './LayerNodeControls';
import { LayerNodeLegend } from './LayerNodeLegend';
import { Skeleton } from '@/components/ui/skeleton';
import { isTutorialProject } from '@/hooks/use-tutorial';

interface LayerNodeEditorProps {
  projectId: string;
}

const nodeTypes = {
  layer: LayerNode,
  categoryHeader: CategoryHeader,
};

const edgeTypes = {
  exclusion: ExclusionEdge,
  effect: EffectEdge,
  switch: SwitchEdge,
};

// Layout constants
const COLUMN_WIDTH = 240;
const COLUMN_GAP = 80;
const NODE_HEIGHT = 200;
const NODE_GAP = 20;
const HEADER_HEIGHT = 60;
const HEADER_GAP = 30;

type AppNode = LayerNodeType | CategoryHeaderNodeType;

export function LayerNodeEditor({ projectId }: LayerNodeEditorProps) {
  const { data: categories, isLoading: categoriesLoading } = useCategories(projectId);
  const { data: allLayers, isLoading: layersLoading } = useAllLayers(projectId);
  const { data: exclusions } = useAllExclusions(projectId);
  const { data: effects } = useAllEffects(projectId);
  const { data: switches } = useAllSwitches(projectId);

  const isReadOnly = isTutorialProject(projectId);

  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Calculate total weight per category for rarity percentage
  const categoryWeights = useMemo(() => {
    const weights = new Map<string, number>();
    for (const layer of allLayers || []) {
      const current = weights.get(layer.category_id) || 0;
      weights.set(layer.category_id, current + (layer.rarity_weight || 1));
    }
    return weights;
  }, [allLayers]);

  // Group layers by category
  const layersByCategory = useMemo(() => {
    const grouped = new Map<string, Layer[]>();
    for (const layer of allLayers || []) {
      const layers = grouped.get(layer.category_id) || [];
      layers.push(layer);
      grouped.set(layer.category_id, layers);
    }
    return grouped;
  }, [allLayers]);

  // Build nodes and edges when data changes
  useEffect(() => {
    if (!categories || !allLayers) return;

    const newNodes: AppNode[] = [];
    const newEdges: Edge[] = [];

    // Sort categories by order_index
    const sortedCategories = [...categories].sort((a, b) => a.order_index - b.order_index);

    // Create category header nodes and layer nodes
    sortedCategories.forEach((category, colIndex) => {
      const x = colIndex * (COLUMN_WIDTH + COLUMN_GAP);
      const categoryLayers = layersByCategory.get(category.id) || [];
      const totalWeight = categoryWeights.get(category.id) || 0;

      // Category header node
      const headerNode: CategoryHeaderNodeType = {
        id: `category-${category.id}`,
        type: 'categoryHeader',
        position: { x, y: 0 },
        data: {
          categoryName: category.display_name,
          layerCount: categoryLayers.length,
          orderIndex: category.order_index,
        },
        draggable: false,
        selectable: false,
      };
      newNodes.push(headerNode);

      // Layer nodes for this category
      categoryLayers.forEach((layer, rowIndex) => {
        const y = HEADER_HEIGHT + HEADER_GAP + rowIndex * (NODE_HEIGHT + NODE_GAP);
        const layerNode: LayerNodeType = {
          id: layer.id,
          type: 'layer',
          position: { x, y },
          data: {
            layer: {
              id: layer.id,
              display_name: layer.display_name,
              storage_path: layer.storage_path,
              rarity_weight: layer.rarity_weight || 1,
              is_effect_layer: layer.is_effect_layer || false,
              category_id: layer.category_id,
            },
            categoryName: category.display_name,
            totalWeight,
            isReadOnly,
          },
          draggable: false,
        };
        newNodes.push(layerNode);
      });
    });

    // Create exclusion edges
    for (const exclusion of exclusions || []) {
      newEdges.push({
        id: `exclusion-${exclusion.id}`,
        source: exclusion.layer_id,
        target: exclusion.excluded_layer_id,
        type: 'exclusion',
      });
    }

    // Create effect edges
    for (const effect of effects || []) {
      newEdges.push({
        id: `effect-${effect.id}`,
        source: effect.parent_layer_id,
        target: effect.effect_layer_id,
        type: 'effect',
        data: { renderOrder: effect.render_order },
      });
    }

    // Create switch edges
    for (const switchRule of switches || []) {
      newEdges.push({
        id: `switch-${switchRule.id}`,
        source: switchRule.layer_a_id,
        target: switchRule.layer_b_id,
        type: 'switch',
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [categories, allLayers, exclusions, effects, switches, layersByCategory, categoryWeights, isReadOnly, setNodes, setEdges]);

  if (categoriesLoading || layersLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-lg border border-border bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
        <div className="text-center">
          <p className="text-muted-foreground">No categories yet</p>
          <p className="text-sm text-muted-foreground/70">Upload layers to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[600px] rounded-lg border border-border overflow-hidden bg-muted/20">
      {/* Custom SVG markers */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker
            id="exclusion-marker"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <circle cx="5" cy="5" r="3" fill="hsl(0 72% 51%)" />
          </marker>
          <marker
            id="effect-marker"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="hsl(280 80% 55%)" />
          </marker>
          <marker
            id="switch-marker"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="hsl(38 92% 50%)" />
          </marker>
        </defs>
      </svg>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        panOnScroll
        selectionOnDrag={false}
        nodesDraggable={false}
        nodesConnectable={!isReadOnly}
        elementsSelectable={!isReadOnly}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="hsl(var(--border))" />
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'categoryHeader') return 'hsl(133 90% 40%)';
            return 'hsl(var(--muted-foreground))';
          }}
          maskColor="hsl(var(--background) / 0.8)"
          className="!bg-card/80 !border-border rounded-lg"
        />
        <LayerNodeControls />
      </ReactFlow>
      <LayerNodeLegend />
    </div>
  );
}
