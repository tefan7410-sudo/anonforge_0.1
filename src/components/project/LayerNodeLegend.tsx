import { Ban, Sparkles, ArrowLeftRight, MousePointer2, Trash2 } from 'lucide-react';

export function LayerNodeLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5 rounded-lg border border-border bg-card/95 p-3 backdrop-blur-sm shadow-lg">
      <span className="text-xs font-medium text-muted-foreground mb-1">Connections</span>
      <div className="flex items-center gap-2 text-xs">
        <div className="flex h-4 w-6 items-center justify-center">
          <div className="h-0.5 w-full rounded bg-destructive" style={{ backgroundImage: 'repeating-linear-gradient(90deg, hsl(0 72% 51%) 0, hsl(0 72% 51%) 4px, transparent 4px, transparent 8px)' }} />
        </div>
        <Ban className="h-3 w-3 text-destructive" />
        <span>Exclusion</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <div className="flex h-4 w-6 items-center justify-center">
          <div className="h-0.5 w-full rounded bg-purple-500" />
        </div>
        <Sparkles className="h-3 w-3 text-purple-500" />
        <span>Effect Layer</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <div className="flex h-4 w-6 items-center justify-center">
          <div className="h-0.5 w-full rounded bg-warning" />
        </div>
        <ArrowLeftRight className="h-3 w-3 text-warning" />
        <span>Switch Order</span>
      </div>
      
      <div className="mt-2 pt-2 border-t border-border">
        <span className="text-xs font-medium text-muted-foreground mb-1 block">Actions</span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MousePointer2 className="h-3 w-3" />
          <span>Drag from handles to connect layers</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Trash2 className="h-3 w-3" />
          <span>Click connection + Delete/Backspace</span>
        </div>
      </div>
    </div>
  );
}
