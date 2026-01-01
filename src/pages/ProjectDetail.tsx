import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProject, useCategories, useAllLayers } from '@/hooks/use-project';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Upload,
  Sparkles,
  Settings,
  Layers,
  Image as ImageIcon,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { LayerUploadZone } from '@/components/project/LayerUploadZone';
import { CategoryList } from '@/components/project/CategoryList';
import { GenerationPanel } from '@/components/project/GenerationPanel';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const { data: project, isLoading: projectLoading } = useProject(id!);
  const { data: categories } = useCategories(id!);
  const { data: allLayers } = useAllLayers(id!);

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50">
          <div className="container mx-auto flex items-center gap-4 px-6 py-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">
          <Skeleton className="mb-8 h-10 w-64" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <h1 className="mb-4 font-display text-2xl font-bold">Project not found</h1>
        <Button asChild>
          <Link to="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const isOwner = project.owner_id === user?.id;
  const totalLayers = allLayers?.length || 0;
  const totalCategories = categories?.length || 0;

  // Calculate total combinations
  const calculateCombinations = () => {
    if (!categories || categories.length === 0) return 0;
    const layersByCategory = new Map<string, number>();
    for (const layer of allLayers || []) {
      const count = layersByCategory.get(layer.category_id) || 0;
      layersByCategory.set(layer.category_id, count + 1);
    }
    let combinations = 1;
    for (const count of layersByCategory.values()) {
      if (count > 0) combinations *= count;
    }
    return combinations;
  };

  const totalCombinations = calculateCombinations();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Layers className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold">{project.name}</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Updated {formatDistanceToNow(new Date(project.last_modified), { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={project.is_public ? 'secondary' : 'outline'}>
              {project.is_public ? 'Public' : 'Private'}
            </Badge>
            {isOwner && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/project/${id}/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="container mx-auto flex items-center gap-6 px-6 py-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>{totalLayers}</strong> layers
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>{totalCategories}</strong> categories
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>{totalCombinations.toLocaleString()}</strong> possible combinations
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="layers" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="layers">Layers</TabsTrigger>
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Layers
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display">Upload Layers</DialogTitle>
                  <DialogDescription>
                    Upload PNG files with the correct naming format
                  </DialogDescription>
                </DialogHeader>
                <LayerUploadZone
                  projectId={id!}
                  onComplete={() => setUploadDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="layers">
            <CategoryList projectId={id!} />
          </TabsContent>

          <TabsContent value="generate">
            <GenerationPanel projectId={id!} project={project} />
          </TabsContent>

          <TabsContent value="history">
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 py-16">
              <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-1 font-display text-lg font-medium">No generations yet</h3>
              <p className="text-sm text-muted-foreground">
                Generated images will appear here
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
