import { useState } from 'react';
import { useCreateNmkrProject } from '@/hooks/use-nmkr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Rocket, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';

interface NmkrSetupWizardProps {
  projectId: string;
  projectName: string;
}

export function NmkrSetupWizard({ projectId, projectName }: NmkrSetupWizardProps) {
  const [nmkrProjectName, setNmkrProjectName] = useState(projectName);
  const [description, setDescription] = useState('');
  const createProject = useCreateNmkrProject();

  const handleCreateProject = async () => {
    if (!nmkrProjectName.trim()) return;
    await createProject.mutateAsync({
      projectId,
      projectName: nmkrProjectName.trim(),
      description: description.trim(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Rocket className="h-5 w-5 text-primary" />
          Publish to Cardano
        </CardTitle>
        <CardDescription>
          Set up your NMKR Studio project to mint NFTs on the Cardano blockchain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info box */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <h4 className="mb-2 font-semibold text-primary">What is NMKR?</h4>
          <p className="text-sm text-muted-foreground">
            NMKR Studio is a no-code NFT platform for the Cardano blockchain. 
            It allows you to create, mint, and sell NFT collections with ease.
          </p>
          <a 
            href="https://www.nmkr.io/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Learn more about NMKR
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            NMKR API Connected
          </span>
        </div>

        {/* Project creation form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nmkr-project-name">Collection Name</Label>
            <Input
              id="nmkr-project-name"
              value={nmkrProjectName}
              onChange={(e) => setNmkrProjectName(e.target.value)}
              placeholder="My NFT Collection"
            />
            <p className="text-xs text-muted-foreground">
              This name will appear on marketplaces and in your NMKR dashboard
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your NFT collection..."
              rows={3}
            />
          </div>
        </div>

        <Button 
          onClick={handleCreateProject}
          disabled={createProject.isPending || !nmkrProjectName.trim()}
          className="w-full"
        >
          {createProject.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Project...
            </>
          ) : (
            <>
              <Rocket className="mr-2 h-4 w-4" />
              Create NMKR Project
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By creating a project, you agree to NMKR's{' '}
          <a 
            href="https://www.nmkr.io/terms" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Terms of Service
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
