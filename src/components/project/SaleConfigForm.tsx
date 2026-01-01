import { useState } from 'react';
import { useUpdateNmkrPrice, useGetNmkrPayLink, NmkrProject } from '@/hooks/use-nmkr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, ExternalLink, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface SaleConfigFormProps {
  nmkrProject: NmkrProject;
}

export function SaleConfigForm({ nmkrProject }: SaleConfigFormProps) {
  const [priceAda, setPriceAda] = useState(
    nmkrProject.price_in_lovelace 
      ? (nmkrProject.price_in_lovelace / 1_000_000).toString() 
      : ''
  );
  const [payLink, setPayLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const updatePrice = useUpdateNmkrPrice();
  const getPayLink = useGetNmkrPayLink();

  const handleUpdatePrice = async () => {
    const price = parseFloat(priceAda);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    const priceInLovelace = Math.round(price * 1_000_000);

    await updatePrice.mutateAsync({
      nmkrProjectId: nmkrProject.id,
      nmkrProjectUid: nmkrProject.nmkr_project_uid,
      priceInLovelace,
    });
  };

  const handleGetPayLink = async () => {
    try {
      const result = await getPayLink.mutateAsync({
        projectUid: nmkrProject.nmkr_project_uid,
      });
      setPayLink(result.href || result.paymentLink);
    } catch {
      // Error handled by hook
    }
  };

  const copyToClipboard = async () => {
    if (payLink) {
      await navigator.clipboard.writeText(payLink);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pricing Card */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Pricing</CardTitle>
          <CardDescription>
            Set the price for your NFTs in ADA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price per NFT (ADA)</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="price"
                  type="number"
                  step="0.1"
                  min="0"
                  value={priceAda}
                  onChange={(e) => setPriceAda(e.target.value)}
                  placeholder="10"
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ADA
                </span>
              </div>
              <Button 
                onClick={handleUpdatePrice}
                disabled={updatePrice.isPending || !priceAda}
              >
                {updatePrice.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </div>
            {nmkrProject.price_in_lovelace && (
              <p className="text-xs text-muted-foreground">
                Current price: {(nmkrProject.price_in_lovelace / 1_000_000).toFixed(2)} ADA
                ({nmkrProject.price_in_lovelace.toLocaleString()} lovelace)
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="mb-2 text-sm font-medium">Pricing Tips</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Consider the rarity and uniqueness of your collection</li>
              <li>• Check similar collections for market prices</li>
              <li>• NMKR charges fees on each sale (check their pricing)</li>
              <li>• You can update the price at any time</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Payment Link Card */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">NMKR Pay Link</CardTitle>
          <CardDescription>
            Generate a payment link to share with your buyers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!nmkrProject.price_in_lovelace ? (
            <p className="text-sm text-muted-foreground">
              Set a price first to generate payment links
            </p>
          ) : (
            <>
              <Button 
                onClick={handleGetPayLink}
                disabled={getPayLink.isPending}
                variant="outline"
                className="w-full"
              >
                {getPayLink.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Generate Payment Link
                  </>
                )}
              </Button>

              {payLink && (
                <div className="space-y-2">
                  <Label>Payment Link</Label>
                  <div className="flex gap-2">
                    <Input value={payLink} readOnly className="font-mono text-xs" />
                    <Button variant="outline" size="icon" onClick={copyToClipboard}>
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <a href={payLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Link
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Network Info */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Network</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${
              nmkrProject.network === 'mainnet' ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
            <span className="capitalize font-medium">{nmkrProject.network}</span>
          </div>
          {nmkrProject.network === 'testnet' && (
            <p className="mt-2 text-xs text-muted-foreground">
              This is a testnet project. NFTs will not be real and have no value.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
