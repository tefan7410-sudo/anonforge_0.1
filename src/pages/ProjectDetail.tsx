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
import { GenerationHistory } from '@/components/project/GenerationHistory';
import { PublishPanel } from '@/components/project/PublishPanel';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MobileNav } from '@/components/MobileNav';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('layers');

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
              <div className="hidden sm:block">
                <h1 className="font-display text-xl font-semibold">{project.name}</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Updated {formatDistanceToNow(new Date(project.last_modified), { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationDropdown />
            <ThemeToggle />
            <Badge variant={project.is_public ? 'secondary' : 'outline'} className="hidden sm:inline-flex">
              {project.is_public ? 'Public' : 'Private'}
            </Badge>
            {isOwner && (
              <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
                <Link to={`/project/${id}/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            )}
            <MobileNav />
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="container mx-auto flex flex-wrap items-center gap-4 px-6 py-3 sm:gap-6">
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
              <strong>{totalCombinations.toLocaleString()}</strong> <span className="hidden sm:inline">possible </span>combinations
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="layers">Layers</TabsTrigger>
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="publish">Publish</TabsTrigger>
            </TabsList>

            {activeTab === 'layers' && (
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
            )}
          </div>

          <TabsContent value="layers">
            <ErrorBoundary>
              <CategoryList projectId={id!} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="generate">
            <ErrorBoundary>
              <GenerationPanel projectId={id!} project={project} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="history">
            <ErrorBoundary>
              <GenerationHistory projectId={id!} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="publish">
            <ErrorBoundary>
              <PublishPanel projectId={id!} projectName={project.name} />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
