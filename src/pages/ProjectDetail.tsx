import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProject, useCategories, useAllLayers } from '@/hooks/use-project';
import { useGenerations } from '@/hooks/use-generations';
import { useCanEditProject } from '@/hooks/use-project-role';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  GraduationCap,
  Eye,
  List,
  GitBranch,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { LayerUploadZone } from '@/components/project/LayerUploadZone';
import { CategoryList } from '@/components/project/CategoryList';
import { LayerNodeEditor } from '@/components/project/LayerNodeEditor';
import { GenerationPanel } from '@/components/project/GenerationPanel';
import { GenerationHistory } from '@/components/project/GenerationHistory';
import { PublishPanel } from '@/components/project/PublishPanel';
import { ProductPageTab } from '@/components/project/ProductPageTab';
import { MarketingTab } from '@/components/project/MarketingTab';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MobileNav } from '@/components/MobileNav';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GenerationDetailModal } from '@/components/project/GenerationDetailModal';
import { FloatingHelpButton } from '@/components/FloatingHelpButton';
import { PageTransition } from '@/components/PageTransition';
import { isTutorialProject, TUTORIAL_PROJECT_ID } from '@/hooks/use-tutorial';
import { useTutorial } from '@/contexts/TutorialContext';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('layers');
  const [deepLinkGenerationId, setDeepLinkGenerationId] = useState<string | null>(null);
  const [deepLinkModalOpen, setDeepLinkModalOpen] = useState(false);
  const [useNodeView, setUseNodeView] = useState(() => {
    // Load preference from localStorage
    const saved = localStorage.getItem('layerforge-layer-view-mode');
    return saved === 'node';
  });

  const { data: project, isLoading: projectLoading } = useProject(id!);
  const { data: categories } = useCategories(id!);
  const { data: allLayers } = useAllLayers(id!);
  const { data: generations } = useGenerations(id!);
  const { canEdit } = useCanEditProject(id!);
  const { isActive: isTutorialActive } = useTutorial();

  const isTutorial = id ? isTutorialProject(id) : false;
  const isReadOnly = isTutorial;

  // Handle deep-link to generation from notification
  useEffect(() => {
    const generationId = searchParams.get('generation');
    if (generationId && generations) {
      const generation = generations.find(g => g.id === generationId);
      if (generation) {
        setDeepLinkGenerationId(generationId);
        setDeepLinkModalOpen(true);
        setActiveTab('history');
        // Clear the query param
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, generations, setSearchParams]);

  // Handle tab query param for tutorial
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['layers', 'generate', 'history'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const deepLinkGeneration = generations?.find(g => g.id === deepLinkGenerationId) || null;

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

  // Available tabs for tutorial project
  const tutorialTabs = ['layers', 'generate', 'history'];

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      {/* Tutorial Mode Banner */}
      {isTutorial && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="container mx-auto flex items-center justify-between px-4 py-2 sm:px-6">
            <div className="flex items-center gap-2 text-sm">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">Tutorial Example</span>
              <span className="text-muted-foreground hidden sm:inline">
                — This is a read-only demo project
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              Read-only
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Link to="/" className="hidden sm:flex items-center gap-3 hover:opacity-80 transition-opacity shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Layers className="h-5 w-5 text-primary-foreground" />
              </div>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-base sm:text-xl font-semibold truncate">{project.name}</h1>
                {isTutorial && (
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                    Tutorial
                  </Badge>
                )}
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Updated {formatDistanceToNow(new Date(project.last_modified), { addSuffix: true })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <NotificationDropdown />
            <ThemeToggle />
            {!isTutorial && (
              <Badge variant={project.is_public ? 'secondary' : 'outline'} className="hidden sm:inline-flex">
                {project.is_public ? 'Public' : 'Private'}
              </Badge>
            )}
            {isOwner && !isTutorial && (
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
      <main className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="w-max">
                <TabsTrigger value="layers" data-tutorial="layers-tab">Layers</TabsTrigger>
                <TabsTrigger value="generate" data-tutorial="generate-tab">Generate</TabsTrigger>
                <TabsTrigger value="history" data-tutorial="history-tab">History</TabsTrigger>
                {!isTutorial && (
                  <>
                    <TabsTrigger value="product" className="whitespace-nowrap">Product Page</TabsTrigger>
                    <TabsTrigger value="marketing">Marketing</TabsTrigger>
                    <TabsTrigger value="publish">Publish</TabsTrigger>
                  </>
                )}
              </TabsList>
            </div>

            <div className="flex items-center gap-4">
              {/* View Toggle for Layers tab */}
              {activeTab === 'layers' && (
                <div className="flex items-center gap-2">
                  <List className={`h-4 w-4 ${!useNodeView ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Switch
                    id="view-mode"
                    data-tutorial="view-toggle"
                    checked={useNodeView}
                    onCheckedChange={(checked) => {
                      setUseNodeView(checked);
                      localStorage.setItem('layerforge-layer-view-mode', checked ? 'node' : 'list');
                    }}
                  />
                  <GitBranch className={`h-4 w-4 ${useNodeView ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Label htmlFor="view-mode" className="text-sm text-muted-foreground hidden sm:inline">
                    {useNodeView ? 'Visual' : 'List'}
                  </Label>
                </div>
              )}

              {activeTab === 'layers' && canEdit && !isReadOnly && (
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
          </div>

          <TabsContent value="layers">
            <ErrorBoundary>
              <div data-tutorial="category-card">
                {useNodeView ? (
                  <LayerNodeEditor projectId={id!} />
                ) : (
                  <CategoryList projectId={id!} />
                )}
              </div>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="generate">
            <ErrorBoundary>
              <div data-tutorial="generation-controls">
                <GenerationPanel projectId={id!} project={project} />
              </div>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="history">
            <ErrorBoundary>
              <GenerationHistory projectId={id!} />
            </ErrorBoundary>
          </TabsContent>

          {!isTutorial && (
            <>
              <TabsContent value="product">
                <ErrorBoundary>
                  <ProductPageTab projectId={id!} projectName={project.name} />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="marketing">
                <ErrorBoundary>
                  <MarketingTab projectId={id!} />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="publish">
                <ErrorBoundary>
                  <PublishPanel projectId={id!} projectName={project.name} />
                </ErrorBoundary>
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Deep-link Generation Modal */}
        <GenerationDetailModal
          generation={deepLinkGeneration}
          projectId={id!}
          open={deepLinkModalOpen}
          onOpenChange={setDeepLinkModalOpen}
        />
      </main>

      <FloatingHelpButton />
    </div>
    </PageTransition>
  );
}
