import { useState } from 'react';
import { useNmkrProject, useNmkrCounts, useNmkrCredentials } from '@/hooks/use-nmkr';
import { NmkrApiKeySetup } from './NmkrApiKeySetup';
import { NmkrSetupWizard } from './NmkrSetupWizard';
import { NftUploadQueue } from './NftUploadQueue';
import { SaleConfigForm } from './SaleConfigForm';
import { RoyaltiesTab } from './RoyaltiesTab';
import { MintStatusCard } from './MintStatusCard';
import { NmkrSettingsModal } from './NmkrSettingsModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Rocket, Upload, Settings, Coins, Key, Trash2, AlertTriangle, RefreshCw, SettingsIcon } from 'lucide-react';
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
  onSwitchTab?: (tab: string) => void;
}

export function PublishPanel({ projectId, projectName, onSwitchTab }: PublishPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState('upload');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { 
    data: credentials, 
    isLoading: credentialsLoading, 
    error: credentialsError,
    refetch: refetchCredentials 
  } = useNmkrCredentials();
  const { data: nmkrProject, isLoading: nmkrLoading } = useNmkrProject(projectId);
  const { data: counts } = useNmkrCounts(nmkrProject?.nmkr_project_uid);
  const deleteCredentials = useDeleteNmkrCredentials();

  // Handle error state
  if (credentialsError) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h3 className="font-semibold">Connection Error</h3>
            <p className="text-muted-foreground text-sm">
              {credentialsError.message || 'Failed to check NMKR credentials. Please try again.'}
            </p>
            <Button onClick={() => refetchCredentials()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (credentialsLoading || nmkrLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
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
      <div className="space-y-4">
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
    <div className="space-y-4">
      {/* API Key Status */}
      <ApiKeyStatusBar onRemove={() => deleteCredentials.mutate()} isRemoving={deleteCredentials.isPending} />

      {/* Status Overview */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Rocket className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="font-display text-base">NMKR Project</CardTitle>
                <CardDescription className="text-xs">
                  UID: {nmkrProject.nmkr_project_uid}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowSettingsModal(true)}
                title="Edit NMKR Settings"
              >
                <SettingsIcon className="h-4 w-4" />
              </Button>
              <Badge variant={statusColor as 'default' | 'secondary'} className="capitalize">
                {nmkrProject.status === 'ready' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                {nmkrProject.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
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
          <TabsTrigger value="royalties" className="gap-2">
            <Coins className="h-4 w-4" />
            <span className="hidden sm:inline">Royalties</span>
            <span className="sm:hidden">Royalty</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          <NftUploadQueue 
            projectId={projectId}
            nmkrProject={nmkrProject}
          />
        </TabsContent>

        <TabsContent value="pricing" className="mt-4 space-y-3">
          {/* Workflow explanation */}
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <h4 className="text-sm font-medium mb-1">Publishing Workflow</h4>
            <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal list-inside">
              <li>Upload your NFTs in the Upload tab</li>
              <li>Set your pricing tiers below</li>
              <li>Generate a payment link for NMKR Pay</li>
              <li>Create a Product Page for your storefront</li>
            </ol>
          </div>
          <SaleConfigForm nmkrProject={nmkrProject} onSwitchTab={onSwitchTab} />
        </TabsContent>

        <TabsContent value="royalties" className="mt-4">
          <RoyaltiesTab nmkrProject={nmkrProject} />
        </TabsContent>
      </Tabs>

      {/* Settings Modal */}
      <NmkrSettingsModal
        nmkrProject={nmkrProject}
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
      />
    </div>
  );
}

function ApiKeyStatusBar({ onRemove, isRemoving }: { onRemove: () => void; isRemoving: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-1.5">
      <div className="flex items-center gap-2 text-sm">
        <Key className="h-3.5 w-3.5 text-green-500" />
        <span className="text-muted-foreground text-xs">NMKR API connected</span>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
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
