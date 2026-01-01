import { useState } from 'react';
import { useNmkrProject, useNmkrCounts, useValidateNmkrKey } from '@/hooks/use-nmkr';
import { NmkrSetupWizard } from './NmkrSetupWizard';
import { NftUploadQueue } from './NftUploadQueue';
import { SaleConfigForm } from './SaleConfigForm';
import { MintStatusCard } from './MintStatusCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Rocket, Upload, Settings, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PublishPanelProps {
  projectId: string;
  projectName: string;
}

export function PublishPanel({ projectId, projectName }: PublishPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState('upload');
  const { data: nmkrProject, isLoading: nmkrLoading } = useNmkrProject(projectId);
  const { data: counts } = useNmkrCounts(nmkrProject?.nmkr_project_uid);
  const validateKey = useValidateNmkrKey();

  // Check if API key is configured by making a validation call
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [checkingKey, setCheckingKey] = useState(false);

  const checkApiKey = async () => {
    setCheckingKey(true);
    try {
      await validateKey.mutateAsync();
      setApiKeyValid(true);
    } catch {
      setApiKeyValid(false);
    } finally {
      setCheckingKey(false);
    }
  };

  // Initial key check
  if (apiKeyValid === null && !checkingKey && !nmkrLoading) {
    checkApiKey();
  }

  if (nmkrLoading || checkingKey) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // API key not configured or invalid
  if (apiKeyValid === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Rocket className="h-5 w-5 text-primary" />
            Publish to Cardano
          </CardTitle>
          <CardDescription>
            Connect your NMKR Studio account to mint your NFT collection on the Cardano blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>NMKR API Key Required</AlertTitle>
            <AlertDescription>
              Your NMKR API key is not configured or is invalid. Please contact the administrator to set up the API key.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button variant="outline" onClick={checkApiKey} disabled={checkingKey}>
              Retry Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No NMKR project created yet
  if (!nmkrProject) {
    return (
      <NmkrSetupWizard 
        projectId={projectId} 
        projectName={projectName}
      />
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
