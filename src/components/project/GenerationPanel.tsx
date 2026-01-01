import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCategories, useAllLayers, type Project, type Layer, type Category } from '@/hooks/use-project';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import {
  useCreateGeneration,
  useCleanupGenerations,
  uploadGenerationImage,
} from '@/hooks/use-generations';
import {
  Sparkles,
  Shuffle,
  Loader2,
  Info,
  Wand2,
  Hand,
  FileJson,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react';

interface GenerationPanelProps {
  projectId: string;
  project: Project;
}

interface GeneratedCharacter {
  tokenId: string;
  metadata: Record<string, string>;
  layers: { category: Category; layer: Layer }[];
  imageData?: string;
}

export function GenerationPanel({ projectId, project }: GenerationPanelProps) {
  const { data: categories } = useCategories(projectId);
  const { data: allLayers } = useAllLayers(projectId);
  const { toast } = useToast();
  const createGeneration = useCreateGeneration();
  const cleanupGenerations = useCleanupGenerations();

  const [mode, setMode] = useState<'random' | 'manual'>('random');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedCharacter[]>([]);
  const [manualSelections, setManualSelections] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Group layers by category
  const layersByCategory = new Map<string, Layer[]>();
  for (const layer of allLayers || []) {
    const existing = layersByCategory.get(layer.category_id) || [];
    layersByCategory.set(layer.category_id, [...existing, layer]);
  }

  const hasLayers = allLayers && allLayers.length > 0 && categories && categories.length > 0;

  // Weighted random selection
  const selectRandomLayer = (layers: Layer[]): Layer => {
    const totalWeight = layers.reduce((sum, l) => sum + l.rarity_weight, 0);
    let random = Math.random() * totalWeight;
    for (const layer of layers) {
      random -= layer.rarity_weight;
      if (random <= 0) return layer;
    }
    return layers[layers.length - 1];
  };

  // Generate a single character
  const generateCharacter = async (tokenNumber: number): Promise<GeneratedCharacter> => {
    const selectedLayers: { category: Category; layer: Layer }[] = [];
    const metadata: Record<string, string> = {};

    for (const category of categories?.sort((a, b) => a.order_index - b.order_index) || []) {
      const categoryLayers = layersByCategory.get(category.id) || [];
      if (categoryLayers.length === 0) continue;

      let selectedLayer: Layer;
      if (mode === 'manual' && manualSelections[category.id]) {
        selectedLayer = categoryLayers.find((l) => l.id === manualSelections[category.id]) || categoryLayers[0];
      } else {
        selectedLayer = selectRandomLayer(categoryLayers);
      }

      selectedLayers.push({ category, layer: selectedLayer });
      metadata[category.display_name] = selectedLayer.display_name;
    }

    const tokenId = `${project.token_prefix}${String(tokenNumber).padStart(4, '0')}`;

    return {
      tokenId,
      metadata,
      layers: selectedLayers,
    };
  };

  // Compose layers onto canvas
  const composeLayers = async (layers: { category: Category; layer: Layer }[]): Promise<string> => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas not available');

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    // Set canvas size (using 512x512 for preview)
    canvas.width = 512;
    canvas.height = 512;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Load and draw each layer in order
    for (const { layer } of layers) {
      const { data: publicUrl } = supabase.storage.from('layers').getPublicUrl(layer.storage_path);
      
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve();
        };
        img.onerror = reject;
        img.src = publicUrl.publicUrl;
      });
    }

    return canvas.toDataURL('image/png');
  };

  // Generate single preview and save to history
  const handleGeneratePreview = async () => {
    if (!hasLayers) return;

    setGenerating(true);
    try {
      const character = await generateCharacter(project.token_start_number);
      character.imageData = await composeLayers(character.layers);
      setPreviewImage(character.imageData);
      setGenerated([character]);

      // Save to history
      setSaving(true);
      const generationId = crypto.randomUUID();
      const imagePath = await uploadGenerationImage(projectId, generationId, character.imageData);
      
      await createGeneration.mutateAsync({
        projectId,
        tokenId: character.tokenId,
        imagePath,
        layerCombination: character.layers.map((l) => l.layer.id),
        metadata: character.metadata,
        generationType: 'single',
      });

      // Cleanup old generations (keep only 25 non-favorites)
      await cleanupGenerations.mutateAsync(projectId);

      toast({ title: 'Preview generated and saved to history' });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
      setSaving(false);
    }
  };

  // Randomize manual selection for a category
  const randomizeCategory = (categoryId: string) => {
    const categoryLayers = layersByCategory.get(categoryId) || [];
    if (categoryLayers.length === 0) return;
    const randomLayer = selectRandomLayer(categoryLayers);
    setManualSelections((prev) => ({ ...prev, [categoryId]: randomLayer.id }));
  };

  // Randomize all categories
  const randomizeAll = () => {
    const newSelections: Record<string, string> = {};
    for (const category of categories || []) {
      const categoryLayers = layersByCategory.get(category.id) || [];
      if (categoryLayers.length > 0) {
        newSelections[category.id] = selectRandomLayer(categoryLayers).id;
      }
    }
    setManualSelections(newSelections);
  };

  // Download generated image (local copy)
  const handleDownload = () => {
    if (!previewImage) return;
    const link = document.createElement('a');
    link.download = `${generated[0]?.tokenId || 'preview'}.png`;
    link.href = previewImage;
    link.target = '_blank';
    link.click();
  };

  // Download metadata JSON
  const handleDownloadMetadata = () => {
    if (generated.length === 0) return;
    const metadata = generated.map((g) => ({
      token: g.tokenId,
      meta: g.metadata,
    }));
    const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'metadata.json';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };


  if (!hasLayers) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Sparkles className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="mb-1 font-display text-lg font-medium">Upload layers first</h3>
          <p className="text-sm text-muted-foreground">
            Add layers to your project before generating
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Hidden canvas for compositing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="space-y-6">
        {/* Mode toggle */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              Generation Mode
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Random mode uses weighted selection. Manual mode lets you pick specific traits.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'random' | 'manual')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="random" className="gap-2">
                  <Shuffle className="h-4 w-4" />
                  Random
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2">
                  <Hand className="h-4 w-4" />
                  Manual
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Manual selection */}
        {mode === 'manual' && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Select Traits</CardTitle>
                <Button variant="outline" size="sm" onClick={randomizeAll}>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Randomize All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-64">
                <div className="space-y-4">
                  {categories?.sort((a, b) => a.order_index - b.order_index).map((category) => {
                    const categoryLayers = layersByCategory.get(category.id) || [];
                    return (
                      <div key={category.id}>
                        <div className="mb-2 flex items-center justify-between">
                          <Label className="text-sm font-medium">{category.display_name}</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => randomizeCategory(category.id)}
                          >
                            <Shuffle className="mr-1 h-3 w-3" />
                            Random
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {categoryLayers.map((layer) => (
                            <button
                              key={layer.id}
                              onClick={() =>
                                setManualSelections((prev) => ({
                                  ...prev,
                                  [category.id]: layer.id,
                                }))
                              }
                              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                                manualSelections[category.id] === layer.id
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              {layer.display_name}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Generate button */}
        <Button
          onClick={handleGeneratePreview}
          disabled={generating || saving}
          className="w-full"
          size="lg"
        >
          {generating || saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          {saving ? 'Saving...' : 'Generate Preview'}
        </Button>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <Card className="overflow-hidden border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {previewImage ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-lg bg-muted">
                  <img
                    src={previewImage}
                    alt="Generated preview"
                    className="h-auto w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleDownload}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Download Image
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleDownloadMetadata}>
                    <FileJson className="mr-2 h-4 w-4" />
                    Download JSON
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex aspect-square flex-col items-center justify-center rounded-lg bg-muted">
                <Sparkles className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Click generate to preview</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata preview */}
        {generated.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileJson className="h-4 w-4" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs">
                {JSON.stringify(
                  {
                    token: generated[0].tokenId,
                    meta: generated[0].metadata,
                  },
                  null,
                  2
                )}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
