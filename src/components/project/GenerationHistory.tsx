import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useGenerations,
  useToggleFavorite,
  useDeleteGeneration,
  useClearAllGenerations,
  useAutoCleanupOldGenerations,
  getGenerationFileUrl,
  type Generation,
} from '@/hooks/use-generations';
import {
  useGenerationCommentCounts,
  useUserMentionsInGenerations,
} from '@/hooks/use-generation-comments';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Heart,
  Download,
  Trash2,
  Package,
  Image as ImageIcon,
  Clock,
  Loader2,
  MessageSquare,
  AtSign,
  Info,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { GenerationDetailModal } from './GenerationDetailModal';

interface GenerationHistoryProps {
  projectId: string;
}

export function GenerationHistory({ projectId }: GenerationHistoryProps) {
  const { user } = useAuth();
  const { data: generations, isLoading } = useGenerations(projectId);
  const toggleFavorite = useToggleFavorite();
  const deleteGeneration = useDeleteGeneration();
  const clearAllGenerations = useClearAllGenerations();
  const { toast } = useToast();

  // Auto-cleanup old generations on mount
  useAutoCleanupOldGenerations(projectId);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Get generation IDs for comment queries
  const generationIds = useMemo(() => 
    generations?.filter(g => g.generation_type === 'single').map(g => g.id) || [],
    [generations]
  );

  // Fetch comment counts and user mentions
  const { data: commentCounts } = useGenerationCommentCounts(generationIds);
  const { data: userMentions } = useUserMentionsInGenerations(generationIds, user?.id);

  const handleToggleFavorite = async (generation: Generation) => {
    try {
      await toggleFavorite.mutateAsync({
        generationId: generation.id,
        isFavorite: !generation.is_favorite,
        projectId,
      });
      toast({
        title: generation.is_favorite ? 'Removed from favorites' : 'Added to favorites',
      });
    } catch (error) {
      toast({
        title: 'Failed to update favorite',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (generation: Generation) => {
    setDeletingId(generation.id);
    try {
      await deleteGeneration.mutateAsync({ generation, projectId });
      toast({ title: 'Generation deleted' });
    } catch (error) {
      toast({
        title: 'Failed to delete generation',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    try {
      const count = await clearAllGenerations.mutateAsync(projectId);
      toast({ title: `Cleared ${count} generations` });
    } catch (error) {
      toast({
        title: 'Failed to clear history',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = (generation: Generation) => {
    if (!generation.image_path) return;
    const url = getGenerationFileUrl(generation.image_path);
    const link = document.createElement('a');
    link.href = url;
    link.download = generation.generation_type === 'batch'
      ? `batch-${generation.token_id}.zip`
      : `${generation.token_id}.png`;
    link.click();
  };

  const handleImageClick = (generation: Generation) => {
    setSelectedGeneration(generation);
    setDetailModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (!generations || generations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 py-16">
        <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="mb-1 font-display text-lg font-medium">No generations yet</h3>
        <p className="text-sm text-muted-foreground">
          Generated images will appear here
        </p>
        <div className="mt-6 max-w-md rounded-lg bg-muted/50 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Note:</span> The layer system is designed for creating unique, generative collections with randomized traits. For non-unique collections, you can skip to the{' '}
            <span className="font-medium text-primary">Publish</span> tab and upload your images + metadata directly.
          </p>
        </div>
      </div>
    );
  }

  // Split into singles and batches
  const singles = generations.filter((g) => g.generation_type === 'single');
  const batches = generations.filter((g) => g.generation_type === 'batch');

  return (
    <div className="space-y-8">
      {/* Retention Notice + Clear All Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Generations are automatically deleted after 15 days. 
            <span className="font-medium text-foreground"> Favorite items are kept indefinitely.</span>
          </p>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive shrink-0"
              disabled={clearAllGenerations.isPending}
            >
              {clearAllGenerations.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Clear All History
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all generation history?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all {generations.length} generations from your
                history. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Single generations */}
      {singles.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-medium">
            <ImageIcon className="h-5 w-5" />
            Preview Generations
            <Badge variant="secondary" className="ml-2">
              {singles.length}
            </Badge>
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {singles.map((generation) => (
              <GenerationCard
                key={generation.id}
                generation={generation}
                commentCount={commentCounts?.get(generation.id) || 0}
                hasMention={userMentions?.has(generation.id) || false}
                onToggleFavorite={() => handleToggleFavorite(generation)}
                onDownload={() => handleDownload(generation)}
                onDelete={() => handleDelete(generation)}
                onImageClick={() => handleImageClick(generation)}
                isDeleting={deletingId === generation.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Batch generations */}
      {batches.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-medium">
            <Package className="h-5 w-5" />
            Batch Exports
            <Badge variant="secondary" className="ml-2">
              {batches.length}
            </Badge>
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {batches.map((generation) => (
              <BatchCard
                key={generation.id}
                generation={generation}
                onToggleFavorite={() => handleToggleFavorite(generation)}
                onDownload={() => handleDownload(generation)}
                onDelete={() => handleDelete(generation)}
                isDeleting={deletingId === generation.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <GenerationDetailModal
        generation={selectedGeneration}
        projectId={projectId}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </div>
  );
}

interface GenerationCardProps {
  generation: Generation;
  commentCount: number;
  hasMention: boolean;
  onToggleFavorite: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onImageClick: () => void;
  isDeleting: boolean;
}

function GenerationCard({
  generation,
  commentCount,
  hasMention,
  onToggleFavorite,
  onDownload,
  onDelete,
  onImageClick,
  isDeleting,
}: GenerationCardProps) {
  const imageUrl = generation.image_path ? getGenerationFileUrl(generation.image_path) : null;

  return (
    <Card className="group relative overflow-hidden border-border/50">
      {/* Comment/Mention Indicators */}
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        {hasMention && (
          <Badge variant="default" className="bg-primary text-primary-foreground">
            <AtSign className="mr-1 h-3 w-3" />
            Mentioned
          </Badge>
        )}
        {commentCount > 0 && !hasMention && (
          <Badge variant="secondary" className="gap-1">
            <MessageSquare className="h-3 w-3" />
            {commentCount}
          </Badge>
        )}
      </div>
      {generation.is_favorite && (
        <div className="absolute left-2 top-2 z-10">
          <Badge variant="default" className="bg-rose-500 text-white">
            <Heart className="mr-1 h-3 w-3 fill-current" />
            Favorite
          </Badge>
        </div>
      )}
      <div
        className="aspect-square overflow-hidden bg-muted cursor-pointer"
        onClick={onImageClick}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={generation.token_id}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-display font-medium">{generation.token_id}</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(generation.created_at), { addSuffix: true })}
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={onToggleFavorite}
          >
            <Heart
              className={`h-4 w-4 ${generation.is_favorite ? 'fill-rose-500 text-rose-500' : ''}`}
            />
          </Button>
          <Button variant="ghost" size="sm" className="flex-1" onClick={onDownload}>
            <Download className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-destructive hover:text-destructive"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete generation?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {generation.token_id} from your history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

interface BatchCardProps {
  generation: Generation;
  onToggleFavorite: () => void;
  onDownload: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function BatchCard({
  generation,
  onToggleFavorite,
  onDownload,
  onDelete,
  isDeleting,
}: BatchCardProps) {
  return (
    <Card className="border-border/50">
      {generation.is_favorite && (
        <div className="absolute left-2 top-2 z-10">
          <Badge variant="default" className="bg-rose-500 text-white">
            <Heart className="mr-1 h-3 w-3 fill-current" />
            Favorite
          </Badge>
        </div>
      )}
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-display font-medium">{generation.token_id}</span>
            <Badge variant="outline">{generation.batch_size} images</Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(generation.created_at), { addSuffix: true })}
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onToggleFavorite}>
            <Heart
              className={`h-4 w-4 ${generation.is_favorite ? 'fill-rose-500 text-rose-500' : ''}`}
            />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDownload}>
            <Download className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete batch export?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this batch export from your history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
