import { useState } from 'react';
import { useMintRoyaltyToken, NmkrProject } from '@/hooks/use-nmkr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Coins, Info, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface RoyaltySetupCardProps {
  nmkrProject: NmkrProject;
  payoutWallet?: string;
}

export function RoyaltySetupCard({ nmkrProject, payoutWallet }: RoyaltySetupCardProps) {
  const settings = nmkrProject.settings as Record<string, unknown> || {};
  const isRoyaltyMinted = settings.royaltyMinted === true;
  
  const [royaltyPercent, setRoyaltyPercent] = useState(5);
  const [royaltyAddress, setRoyaltyAddress] = useState(payoutWallet || '');
  const [usePayoutForRoyalty, setUsePayoutForRoyalty] = useState(true);

  const mintRoyalty = useMintRoyaltyToken();

  const isValidAddress = royaltyAddress.startsWith('addr1') && royaltyAddress.length >= 58;
  const canMint = isValidAddress && royaltyPercent >= 1 && royaltyPercent <= 10;

  const handleMintRoyalty = async () => {
    if (!canMint) return;
    
    try {
      await mintRoyalty.mutateAsync({
        nmkrProjectId: nmkrProject.id,
        nmkrProjectUid: nmkrProject.nmkr_project_uid,
        royaltyAddress: usePayoutForRoyalty ? (payoutWallet || royaltyAddress) : royaltyAddress,
        percentage: royaltyPercent,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('402') || errorMessage.toLowerCase().includes('mint credits')) {
        toast.error(
          'You need mint credits on NMKR Studio to create a royalty token. Please purchase credits and try again.',
          { duration: 8000 }
        );
      }
      // Error is already displayed by the mutation, don't re-throw
    }
  };

  if (isRoyaltyMinted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Coins className="h-5 w-5 text-primary" />
            Royalty Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <div>
            <p className="font-medium text-green-700 dark:text-green-400">
                Royalty Token Created
              </p>
              <p className="text-sm text-muted-foreground">
                {String(settings.royaltyPercent)}% royalties to {String(settings.royaltyAddress).slice(0, 20)}...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Coins className="h-5 w-5 text-primary" />
          Royalty Settings
        </CardTitle>
        <CardDescription>
          Configure royalties to earn from secondary sales on marketplaces
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Minting a royalty token ensures you receive a percentage of every secondary sale 
                on Cardano marketplaces like jpg.store. This is highly recommended!
              </p>
              <a 
                href="https://www.nmkr.io/studio" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Note: Requires mint credits on NMKR Studio
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Royalty Percentage</Label>
              <Badge variant="outline">{royaltyPercent}%</Badge>
            </div>
            <Slider
              value={[royaltyPercent]}
              onValueChange={(value) => setRoyaltyPercent(value[0])}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Standard is 5%. Range: 1-10%
            </p>
          </div>

          <div className="flex items-start space-x-3 rounded-lg border p-3">
            <Checkbox
              id="use-payout"
              checked={usePayoutForRoyalty}
              onCheckedChange={(checked) => setUsePayoutForRoyalty(checked === true)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label htmlFor="use-payout" className="cursor-pointer font-medium">
                Use payout wallet for royalties
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive royalties to the same wallet as primary sales
              </p>
            </div>
          </div>

          {!usePayoutForRoyalty && (
            <div className="space-y-2">
              <Label htmlFor="royalty-address">Royalty Wallet Address</Label>
              <Input
                id="royalty-address"
                value={royaltyAddress}
                onChange={(e) => setRoyaltyAddress(e.target.value)}
                placeholder="addr1..."
                className={royaltyAddress && !isValidAddress ? 'border-destructive' : ''}
              />
              {royaltyAddress && !isValidAddress && (
                <p className="text-xs text-destructive">
                  Please enter a valid Cardano mainnet address
                </p>
              )}
            </div>
          )}
        </div>

        <Button
          onClick={handleMintRoyalty}
          disabled={mintRoyalty.isPending || !canMint || (usePayoutForRoyalty && !payoutWallet)}
          className="w-full"
        >
          {mintRoyalty.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Minting Royalty Token...
            </>
          ) : (
            <>
              <Coins className="mr-2 h-4 w-4" />
              Mint Royalty Token
            </>
          )}
        </Button>

        {usePayoutForRoyalty && !payoutWallet && (
          <p className="text-xs text-destructive text-center">
            Payout wallet not available. Please enter a royalty address manually.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
