import { useState } from 'react';
import { useSaveNmkrApiKey } from '@/hooks/use-nmkr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Rocket, ExternalLink, Key, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface NmkrApiKeySetupProps {
  onSuccess: () => void;
}

export function NmkrApiKeySetup({ onSuccess }: NmkrApiKeySetupProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const saveApiKey = useSaveNmkrApiKey();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast.error('Please enter your API key');
      return;
    }

    try {
      await saveApiKey.mutateAsync(apiKey.trim());
      toast.success('API key validated and saved successfully!');
      onSuccess();
    } catch (error) {
      console.error('Failed to save API key:', error);
      // Show the actual error message from the API
      const errorMessage = error instanceof Error ? error.message : 'Invalid API key. Please check and try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Rocket className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="font-display">Connect to NMKR Studio</CardTitle>
            <CardDescription>
              Enter your NMKR API key to mint NFTs on Cardano
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Key className="h-4 w-4" />
          <AlertDescription>
            You need an NMKR Studio account and API key to publish NFTs on Cardano. 
            Your API key is stored securely and only used for your projects.
          </AlertDescription>
        </Alert>

        <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
          <h4 className="font-medium">Don't have an API key?</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              <a 
                href="https://www.nmkr.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Create an NMKR Studio account <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>Go to Account Settings → API Keys</li>
            <li>Generate a new API key</li>
            <li>Copy and paste it below</li>
          </ol>
          <Button variant="outline" size="sm" asChild>
            <a 
              href="https://studio.nmkr.io/apikeys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="gap-2"
            >
              <Key className="h-4 w-4" />
              Open NMKR API Keys Page
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">NMKR API Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your NMKR API key"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full gap-2" 
            disabled={!apiKey.trim() || saveApiKey.isPending}
          >
            {saveApiKey.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Validate & Save API Key
              </>
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          By connecting, you agree to NMKR's{' '}
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
