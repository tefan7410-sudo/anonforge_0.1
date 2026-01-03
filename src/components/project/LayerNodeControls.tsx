import { Panel, useReactFlow } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export function LayerNodeControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <Panel position="top-right" className="flex gap-1">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 bg-card/95 backdrop-blur-sm"
        onClick={() => zoomIn()}
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 bg-card/95 backdrop-blur-sm"
        onClick={() => zoomOut()}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 bg-card/95 backdrop-blur-sm"
        onClick={() => fitView({ padding: 0.2 })}
      >
        <Maximize className="h-4 w-4" />
      </Button>
    </Panel>
  );
}
