import { useState } from 'react';
import { useNmkrProject, useNmkrCounts, useNmkrCredentials } from '@/hooks/use-nmkr';
import { NmkrApiKeySetup } from './NmkrApiKeySetup';
import { NmkrSetupWizard } from './NmkrSetupWizard';
import { NftUploadQueue } from './NftUploadQueue';
import { SaleConfigForm } from './SaleConfigForm';
import { MintStatusCard } from './MintStatusCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Rocket, Upload, Settings, BarChart3, Key, Trash2 } from 'lucide-react';
import { useDeleteNmkrCredentials } from '@/hooks/use-nmkr';
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

interface PublishPanelProps {
  projectId: string;
  projectName: string;
}

export function PublishPanel({ projectId, projectName }: PublishPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState('upload');
  const { data: credentials, isLoading: credentialsLoading, refetch: refetchCredentials } = useNmkrCredentials();
  const { data: nmkrProject, isLoading: nmkrLoading } = useNmkrProject(projectId);
  const { data: counts } = useNmkrCounts(nmkrProject?.nmkr_project_uid);
  const deleteCredentials = useDeleteNmkrCredentials();

  if (credentialsLoading || nmkrLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // API key not configured - show setup
  if (!credentials?.hasCredentials || !credentials?.isValid) {
    return (
      <NmkrApiKeySetup onSuccess={() => refetchCredentials()} />
    );
  }

  // No NMKR project created yet
  if (!nmkrProject) {
    return (
      <div className="space-y-6">
        <ApiKeyStatusBar onRemove={() => deleteCredentials.mutate()} isRemoving={deleteCredentials.isPending} />
        <NmkrSetupWizard 
          projectId={projectId} 
          projectName={projectName}
        />
      </div>
    );
  }

  // NMKR project exists - show main interface
  const statusColor = {
    draft: 'secondary',
    uploading: 'default',
    ready: 'default',
    live: 'default',
  }[nmkrProject.status] || 'secondary';

  return (
    <div className="space-y-6">
      {/* API Key Status */}
      <ApiKeyStatusBar onRemove={() => deleteCredentials.mutate()} isRemoving={deleteCredentials.isPending} />

      {/* Status Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Rocket className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="font-display">NMKR Project</CardTitle>
                <CardDescription className="text-xs">
                  UID: {nmkrProject.nmkr_project_uid}
                </CardDescription>
              </div>
            </div>
            <Badge variant={statusColor as 'default' | 'secondary'} className="capitalize">
              {nmkrProject.status === 'ready' && <CheckCircle2 className="mr-1 h-3 w-3" />}
              {nmkrProject.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <MintStatusCard 
            counts={counts} 
            priceInLovelace={nmkrProject.price_in_lovelace}
            network={nmkrProject.network}
          />
        </CardContent>
      </Card>

      {/* Sub-tabs for different actions */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload NFTs</span>
            <span className="sm:hidden">Upload</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Pricing</span>
            <span className="sm:hidden">Price</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Statistics</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <NftUploadQueue 
            projectId={projectId}
            nmkrProject={nmkrProject}
          />
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <SaleConfigForm nmkrProject={nmkrProject} />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Collection Statistics</CardTitle>
              <CardDescription>
                Real-time data from NMKR Studio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {counts ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-border p-4">
                    <div className="text-2xl font-bold text-primary">{counts.total}</div>
                    <div className="text-sm text-muted-foreground">Total NFTs</div>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <div className="text-2xl font-bold text-green-500">{counts.sold}</div>
                    <div className="text-sm text-muted-foreground">Sold</div>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <div className="text-2xl font-bold text-yellow-500">{counts.reserved}</div>
                    <div className="text-sm text-muted-foreground">Reserved</div>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <div className="text-2xl font-bold text-blue-500">{counts.free}</div>
                    <div className="text-sm text-muted-foreground">Available</div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No NFTs uploaded yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApiKeyStatusBar({ onRemove, isRemoving }: { onRemove: () => void; isRemoving: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-2">
      <div className="flex items-center gap-2 text-sm">
        <Key className="h-4 w-4 text-green-500" />
        <span className="text-muted-foreground">NMKR API key connected</span>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect your NMKR account. You'll need to re-enter your API key to continue using the Publish features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onRemove} disabled={isRemoving}>
              {isRemoving ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
