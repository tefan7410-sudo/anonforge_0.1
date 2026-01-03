import { BaseEdge, type EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';

export function EffectEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const renderOrder = (data as { renderOrder?: number })?.renderOrder;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: 'hsl(280 80% 55%)',
          strokeWidth: selected ? 3 : 2,
        }}
        markerEnd="url(#effect-marker)"
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan rounded bg-purple-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white"
        >
          Effect {renderOrder !== undefined ? `#${renderOrder}` : ''}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
