import { BaseEdge, EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';

export function ExclusionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: 'hsl(0 72% 51%)',
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: '6 4',
        }}
        markerEnd="url(#exclusion-marker)"
        markerStart="url(#exclusion-marker)"
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan rounded bg-destructive/90 px-1.5 py-0.5 text-[10px] font-medium text-destructive-foreground"
        >
          Excludes
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
