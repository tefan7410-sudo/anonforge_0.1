import { useState, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCategories, useAllLayers, useAllExclusions, useAllEffects, type Project, type Layer, type Category } from '@/hooks/use-project';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import {
  useCreateGeneration,
  useCleanupGenerations,
  useGenerations,
  uploadGenerationImage,
  uploadGenerationZip,
  getGenerationFileUrl,
} from '@/hooks/use-generations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  Layers,
  AlertTriangle,
  CheckCircle,
  Download,
  History,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';

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
  const { data: allLayersWithEffects } = useAllLayers(projectId, true);
  const { data: generations } = useGenerations(projectId);
  const { data: exclusions } = useAllExclusions(projectId);
  const { data: effects } = useAllEffects(projectId);
  const { toast } = useToast();
  const createGeneration = useCreateGeneration();
  const cleanupGenerations = useCleanupGenerations();

  const [mode, setMode] = useState<'random' | 'manual'>('random');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedCharacter[]>([]);
  const [manualSelections, setManualSelections] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [batchSize, setBatchSize] = useState(1);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [generationWarnings, setGenerationWarnings] = useState<string[]>([]);
  const [isFullResolution, setIsFullResolution] = useState(false);
  const [showFullResWarning, setShowFullResWarning] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [lastBatchZipPath, setLastBatchZipPath] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Build exclusion map: layer_id -> Set of excluded layer IDs
  const exclusionMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    exclusions?.forEach((e) => {
      if (!map.has(e.layer_id)) map.set(e.layer_id, new Set());
      map.get(e.layer_id)!.add(e.excluded_layer_id);
    });
    return map;
  }, [exclusions]);

  // Build effect map: parent_layer_id -> effect layers with render order
  const effectMap = useMemo(() => {
    const map = new Map<string, { layer: Layer; renderOrder: number }[]>();
    effects?.forEach((e) => {
      if (!map.has(e.parent_layer_id)) map.set(e.parent_layer_id, []);
      map.get(e.parent_layer_id)!.push({ layer: e.effect_layer, renderOrder: e.render_order });
    });
    return map;
  }, [effects]);

  // Group layers by category (excluding effect layers)
  const layersByCategory = new Map<string, Layer[]>();
  for (const layer of allLayers || []) {
    const existing = layersByCategory.get(layer.category_id) || [];
    layersByCategory.set(layer.category_id, [...existing, layer]);
  }

  const hasLayers = allLayers && allLayers.length > 0 && categories && categories.length > 0;
  
  // Sort categories once for reuse
  const sortedCategories = useMemo(() => 
    categories?.sort((a, b) => a.order_index - b.order_index) || [], 
    [categories]
  );

  // Calculate total possible combinations
  const totalCombinations = useMemo(() => {
    if (!sortedCategories.length) return 0;
    return sortedCategories.reduce((total, category) => {
      const count = layersByCategory.get(category.id)?.length || 0;
      return count > 0 ? total * count : total;
    }, 1);
  }, [sortedCategories, layersByCategory]);

  // Track used combinations from existing generations
  const usedCombinations = useMemo(() => {
    const used = new Set<string>();
    generations?.forEach((g) => {
      if (g.layer_combination && g.layer_combination.length > 0) {
        // Sort layer IDs to create consistent hash
        used.add([...g.layer_combination].sort().join('|'));
      }
    });
    return used;
  }, [generations]);

  const remainingCombinations = totalCombinations - usedCombinations.size;

  // Compute the next token number based on existing generations
  const nextTokenNumber = useMemo(() => {
    if (!generations || generations.length === 0) {
      return project.token_start_number;
    }
    
    // Parse token numbers from existing generations
    const tokenNumbers = generations
      .map((g) => {
        const match = g.token_id.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => n > 0);
    
    if (tokenNumbers.length === 0) {
      return project.token_start_number;
    }
    
    return Math.max(...tokenNumbers) + 1;
  }, [generations, project.token_start_number]);

  // Helper to create a consistent hash from layer combination
  const getCombinationHash = (layers: { category: Category; layer: Layer }[]): string => {
    return layers.map((l) => l.layer.id).sort().join('|');
  };

  // Analyze generation conditions and return warnings
  const analyzeGenerationConditions = (): string[] => {
    const warnings: string[] = [];

    // Check if batch size uses a high percentage of remaining combinations
    const combinationRatio = remainingCombinations > 0 ? batchSize / remainingCombinations : 1;
    if (combinationRatio > 0.5 && batchSize > 1) {
      warnings.push(`Batch uses ${Math.round(combinationRatio * 100)}% of remaining ${remainingCombinations} unique combinations`);
    }

    // Check weight distribution per category for skewed weights
    for (const category of sortedCategories) {
      const layers = layersByCategory.get(category.id) || [];
      if (layers.length < 2) continue;

      const totalWeight = layers.reduce((sum, l) => sum + l.rarity_weight, 0);
      if (totalWeight === 0) {
        warnings.push(`"${category.display_name}" has no weighted traits (all at 0)`);
        continue;
      }

      for (const layer of layers) {
        const percentage = (layer.rarity_weight / totalWeight) * 100;
        if (percentage >= 90) {
          warnings.push(`"${layer.display_name}" in "${category.display_name}" has ${percentage.toFixed(0)}% drop rate`);
        }
      }

      // Check if any traits have 0 weight
      const zeroWeightCount = layers.filter((l) => l.rarity_weight === 0).length;
      if (zeroWeightCount > 0 && zeroWeightCount < layers.length) {
        warnings.push(`${zeroWeightCount} trait(s) in "${category.display_name}" won't appear (weight = 0)`);
      }
    }

    // Check if not enough unique combinations for the batch
    if (remainingCombinations < batchSize) {
      warnings.push(`Not enough unique combinations: ${remainingCombinations} available, but batch size is ${batchSize}`);
    }

    // Check if categories have very few traits
    const lowTraitCategories = sortedCategories.filter((c) => {
      const layers = layersByCategory.get(c.id) || [];
      return layers.length === 1;
    });
    if (lowTraitCategories.length > 0 && batchSize > 5) {
      warnings.push(`${lowTraitCategories.length} category(ies) have only 1 trait, limiting variety`);
    }

    return warnings;
  };

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

  // Generate a single character with duplicate prevention and exclusion rules
  const generateCharacter = async (
    tokenNumber: number,
    batchUsedCombinations: Set<string>
  ): Promise<GeneratedCharacter> => {
    const MAX_ATTEMPTS = 50;
    
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const selectedLayers: { category: Category; layer: Layer }[] = [];
      const metadata: Record<string, string> = {};
      const selectedLayerIds = new Set<string>();

      for (const category of sortedCategories) {
        const categoryLayers = layersByCategory.get(category.id) || [];
        if (categoryLayers.length === 0) continue;

        // Filter out layers excluded by already-selected layers
        const validLayers = categoryLayers.filter((layer) => {
          for (const selectedId of selectedLayerIds) {
            const excludedSet = exclusionMap.get(selectedId);
            if (excludedSet?.has(layer.id)) return false;
          }
          return true;
        });

        if (validLayers.length === 0) {
          // All layers in this category are excluded - retry from scratch
          if (mode === 'manual') {
            throw new Error(`No valid layers available for "${category.display_name}" due to exclusion rules.`);
          }
          break; // Break inner loop to retry
        }

        let selectedLayer: Layer;
        if (mode === 'manual' && manualSelections[category.id]) {
          const manualLayer = validLayers.find((l) => l.id === manualSelections[category.id]);
          if (!manualLayer) {
            throw new Error(`Selected trait for "${category.display_name}" is excluded by another selection.`);
          }
          selectedLayer = manualLayer;
        } else {
          selectedLayer = selectRandomLayer(validLayers);
        }

        selectedLayers.push({ category, layer: selectedLayer });
        selectedLayerIds.add(selectedLayer.id);
        metadata[category.display_name] = selectedLayer.display_name;
      }

      // Check if we got all categories
      if (selectedLayers.length !== sortedCategories.filter(c => (layersByCategory.get(c.id)?.length || 0) > 0).length) {
        continue; // Retry
      }

      const hash = getCombinationHash(selectedLayers);

      // Check if combination already used (in DB or current batch)
      if (!usedCombinations.has(hash) && !batchUsedCombinations.has(hash)) {
        // Mark as used in this batch
        batchUsedCombinations.add(hash);

        const tokenId = `${project.token_prefix}${String(tokenNumber).padStart(4, '0')}`;

        return {
          tokenId,
          metadata,
          layers: selectedLayers,
        };
      }
      
      // In manual mode, we can't retry with different selections
      if (mode === 'manual') {
        throw new Error('This exact combination already exists. Try selecting different traits.');
      }
    }

    throw new Error(`Could not generate unique combination after ${MAX_ATTEMPTS} attempts. You may have exhausted available combinations or exclusion rules are too restrictive.`);
  };

  // Compose layers onto canvas (including effect layers)
  const composeLayers = async (
    layers: { category: Category; layer: Layer }[],
    fullResolution: boolean = false
  ): Promise<string> => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas not available');

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    // Use 5000x5000 for full resolution, 512x512 for preview
    const size = fullResolution ? 5000 : 512;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Build render list with effect layers
    const renderList: { layer: Layer; order: number }[] = [];
    
    layers.forEach(({ layer }, index) => {
      // Add the main layer
      renderList.push({ layer, order: index * 10 }); // Base order

      // Add any effect layers for this layer
      const layerEffects = effectMap.get(layer.id) || [];
      layerEffects.forEach(({ layer: effectLayer, renderOrder }) => {
        renderList.push({ layer: effectLayer, order: index * 10 + renderOrder });
      });
    });

    // Sort by render order
    renderList.sort((a, b) => a.order - b.order);

    // Load and draw each layer in order
    for (const { layer } of renderList) {
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

  // Generate and save a single character with retry logic
  const generateAndSaveCharacter = async (
    tokenNumber: number,
    batchUsedCombinations: Set<string>
  ): Promise<{ character: GeneratedCharacter; savedTokenNumber: number }> => {
    const character = await generateCharacter(tokenNumber, batchUsedCombinations);
    character.imageData = await composeLayers(character.layers, isFullResolution);

    const generationId = crypto.randomUUID();
    const uploadedImagePath = await uploadGenerationImage(projectId, generationId, character.imageData);

    const MAX_RETRIES = 5;
    let attempt = 0;
    let saved = false;
    let currentTokenNumber = tokenNumber;

    while (!saved && attempt < MAX_RETRIES) {
      try {
        const currentTokenId = `${project.token_prefix}${String(currentTokenNumber).padStart(4, '0')}`;

        await createGeneration.mutateAsync({
          projectId,
          tokenId: currentTokenId,
          imagePath: uploadedImagePath,
          layerCombination: character.layers.map((l) => l.layer.id),
          metadata: character.metadata,
          generationType: batchSize > 1 ? 'batch' : 'single',
          batchSize: batchSize > 1 ? batchSize : undefined,
        });

        saved = true;
        character.tokenId = currentTokenId;
      } catch (insertError: unknown) {
        const pgError = insertError as { code?: string };
        if (pgError?.code === '23505') {
          attempt++;
          currentTokenNumber++;
          if (attempt < MAX_RETRIES) {
            console.log(`Token ID collision, retrying with token number ${currentTokenNumber}`);
          }
        } else {
          // Clean up orphaned image on non-duplicate error
          try {
            await supabase.storage.from('generations').remove([uploadedImagePath]);
          } catch (cleanupError) {
            console.error('Failed to cleanup orphaned image:', cleanupError);
          }
          throw insertError;
        }
      }
    }

    if (!saved) {
      try {
        await supabase.storage.from('generations').remove([uploadedImagePath]);
      } catch (cleanupError) {
        console.error('Failed to cleanup orphaned image:', cleanupError);
      }
      throw new Error('Could not save generation after multiple attempts.');
    }

    return { character, savedTokenNumber: currentTokenNumber };
  };

  // Check for warnings before generating
  const handleGenerateClick = () => {
    if (!hasLayers) return;

    // Reset completion state
    setGenerationComplete(false);
    setLastBatchZipPath(null);

    // Check if we have enough remaining combinations
    if (batchSize > remainingCombinations) {
      toast({
        title: 'Not enough unique combinations',
        description: `Only ${remainingCombinations} unique combinations remaining. Reduce batch size or add more layers.`,
        variant: 'destructive',
      });
      return;
    }

    // Check for full resolution warning first (higher priority)
    if (isFullResolution) {
      setShowFullResWarning(true);
      return;
    }

    // Analyze conditions and show warning if needed
    const warnings = analyzeGenerationConditions();
    if (warnings.length > 0) {
      setGenerationWarnings(warnings);
      setShowWarningDialog(true);
      return;
    }

    // No warnings, proceed directly
    handleGeneratePreview();
  };

  // Handle full resolution confirmation
  const handleFullResConfirm = () => {
    setShowFullResWarning(false);
    
    // Check for other warnings after full res confirmation
    const warnings = analyzeGenerationConditions();
    if (warnings.length > 0) {
      setGenerationWarnings(warnings);
      setShowWarningDialog(true);
      return;
    }
    
    handleGeneratePreview();
  };

  // Generate single or batch preview and save to history
  const handleGeneratePreview = async () => {
    if (!hasLayers) return;

    setShowWarningDialog(false);
    setGenerating(true);
    setGenerationComplete(false);
    setLastBatchZipPath(null);
    setPreviewImage(null); // Clear preview during batch generation
    setGenerationProgress({ current: 0, total: batchSize });
    const generatedCharacters: GeneratedCharacter[] = [];
    const batchUsedCombinations = new Set<string>();

    try {
      if (batchSize === 1) {
        // Single generation: use existing flow
        setGenerationProgress({ current: 1, total: 1 });
        const { character } = await generateAndSaveCharacter(nextTokenNumber, batchUsedCombinations);
        generatedCharacters.push(character);
        if (character.imageData) {
          setPreviewImage(character.imageData);
        }
      } else {
        // Batch generation: generate all in memory without updating preview
        let tokenNumber = nextTokenNumber;
        let firstImageData: string | undefined;
        
        for (let i = 0; i < batchSize; i++) {
          setGenerationProgress({ current: i + 1, total: batchSize });
          const character = await generateCharacter(tokenNumber, batchUsedCombinations);
          character.imageData = await composeLayers(character.layers, isFullResolution);
          generatedCharacters.push(character);
          tokenNumber++;
          
          // Store the first generated image for preview after completion
          if (i === 0 && character.imageData) {
            firstImageData = character.imageData;
          }
        }

        // Create ZIP with all images + metadata
        const zip = new JSZip();
        const metadata = generatedCharacters.map((c) => ({
          token: c.tokenId,
          attributes: c.metadata,
        }));

        for (const char of generatedCharacters) {
          if (char.imageData) {
            const response = await fetch(char.imageData);
            const blob = await response.blob();
            zip.file(`${char.tokenId}.png`, blob);
          }
        }
        zip.file('metadata.json', JSON.stringify(metadata, null, 2));

        // Generate ZIP blob and upload
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const generationId = crypto.randomUUID();
        const zipPath = await uploadGenerationZip(projectId, generationId, zipBlob);

        // Store zip path for download button
        setLastBatchZipPath(zipPath);

        // Create ONE database record for the batch
        const firstToken = generatedCharacters[0].tokenId;
        const lastToken = generatedCharacters[generatedCharacters.length - 1].tokenId;
        
        await createGeneration.mutateAsync({
          projectId,
          tokenId: `${firstToken}-${lastToken}`,
          imagePath: zipPath,
          layerCombination: [],
          metadata: { count: String(batchSize), type: 'batch', resolution: isFullResolution ? 'full' : 'preview' },
          generationType: 'batch',
          batchSize,
        });

        // Set preview to first image after batch completes
        if (firstImageData) {
          setPreviewImage(firstImageData);
        }
      }

      setGenerated(generatedCharacters);
      setGenerationComplete(true);

      // Cleanup old generations (keep only 25 non-favorites)
      await cleanupGenerations.mutateAsync(projectId);

      toast({
        title: batchSize > 1
          ? `${batchSize} ${isFullResolution ? 'full resolution' : ''} characters generated`
          : 'Preview generated and saved to history',
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
      setGenerationProgress({ current: 0, total: 0 });
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

        {/* Batch size selector */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4" />
              Batch Size
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Generate multiple characters at once with sequential token IDs.</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={batchSize}
                  onChange={(e) => setBatchSize(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">
                  Next: {project.token_prefix}{String(nextTokenNumber).padStart(4, '0')}
                  {batchSize > 1 && ` → ${project.token_prefix}${String(nextTokenNumber + batchSize - 1).padStart(4, '0')}`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {remainingCombinations.toLocaleString()} / {totalCombinations.toLocaleString()} unique combinations remaining
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Output Resolution Toggle */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4" />
              Output Resolution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="resolution-toggle" className="text-sm font-medium">
                  Full Resolution (5000×5000)
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isFullResolution 
                    ? "Production quality - larger files, slower generation" 
                    : "Preview mode - 512×512 for faster generation"}
                </p>
              </div>
              <Switch
                id="resolution-toggle"
                checked={isFullResolution}
                onCheckedChange={setIsFullResolution}
              />
            </div>
          </CardContent>
        </Card>

        {/* Warning Dialog */}
        <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Generation Warning
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>The following conditions may affect your generation results:</p>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    {generationWarnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                  <p className="text-sm">
                    Results may not reflect the ideal weight distribution. Do you want to continue?
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleGeneratePreview}>
                Generate Anyway
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Full Resolution Warning Dialog */}
        <AlertDialog open={showFullResWarning} onOpenChange={setShowFullResWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Full Resolution Generation
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>You are about to generate at full resolution (5000×5000 pixels).</p>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    <li>Each image will be approximately 10-20MB</li>
                    <li>Generation will take significantly longer</li>
                    {batchSize > 1 && (
                      <li>Batch of {batchSize} images may take several minutes</li>
                    )}
                    <li>Estimated total size: ~{(batchSize * 15).toFixed(0)}MB</li>
                  </ul>
                  <p className="text-sm font-medium text-amber-600">
                    This process is resource-intensive and may take a while to complete.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleFullResConfirm}>
                Generate Full Resolution
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Generate button */}
        <Button
          onClick={handleGenerateClick}
          disabled={generating || saving}
          className="w-full"
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {generationProgress.total > 1
                ? `Generating ${generationProgress.current}/${generationProgress.total}...`
                : 'Generating...'}
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              {batchSize > 1 
                ? `Generate ${batchSize} ${isFullResolution ? 'Full Res' : 'Previews'}`
                : isFullResolution ? 'Generate Full Resolution' : 'Generate Preview'}
            </>
          )}
        </Button>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <Card className="overflow-hidden border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Show progress during batch generation */}
            {generating && batchSize > 1 ? (
              <div className="flex aspect-square flex-col items-center justify-center rounded-lg bg-muted">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
                <p className="text-lg font-medium">
                  Generating {generationProgress.current} / {generationProgress.total}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isFullResolution ? 'Creating full resolution images...' : 'Creating preview images...'}
                </p>
                <Progress 
                  value={(generationProgress.current / generationProgress.total) * 100} 
                  className="mt-4 w-48" 
                />
              </div>
            ) : generationComplete && batchSize > 1 && lastBatchZipPath ? (
              /* Show completion state for batch generation */
              <div className="space-y-4">
                {previewImage && (
                  <div className="overflow-hidden rounded-lg bg-muted">
                    <img
                      src={previewImage}
                      alt="Generated preview"
                      className="h-auto w-full"
                    />
                  </div>
                )}
                <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center">
                  <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
                  <p className="font-medium">Batch generation complete!</p>
                  <p className="text-sm text-muted-foreground">
                    {generated.length} {isFullResolution ? 'full resolution' : 'preview'} characters generated
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => {
                      if (lastBatchZipPath) {
                        const url = getGenerationFileUrl(lastBatchZipPath);
                        window.open(url, '_blank');
                      }
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download ZIP
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <History className="mr-2 h-4 w-4" />
                    View in History
                  </Button>
                </div>
              </div>
            ) : previewImage ? (
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
                Metadata {generated.length > 1 && `(${generated.length} items)`}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className={generated.length > 1 ? 'h-64' : ''}>
                <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs">
                  {JSON.stringify(
                    generated.map((g) => ({
                      token: g.tokenId,
                      meta: g.metadata,
                    })),
                    null,
                    2
                  )}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
