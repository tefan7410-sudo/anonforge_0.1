import { useState } from 'react';
import { useUpdateNmkrPrice, useGetNmkrPayLink, useGetPricelist, useUpdateRoyaltyWarningDismissed, NmkrProject } from '@/hooks/use-nmkr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, ExternalLink, Copy, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { RoyaltyWarningModal } from './RoyaltyWarningModal';

interface SaleConfigFormProps {
  nmkrProject: NmkrProject;
}

export function SaleConfigForm({ nmkrProject }: SaleConfigFormProps) {
  const settings = nmkrProject.settings as Record<string, unknown> || {};
  const isRoyaltyMinted = settings.royaltyMinted === true;
  const isRoyaltyWarningDismissed = settings.royaltyWarningDismissed === true;

  const [priceAda, setPriceAda] = useState(
    nmkrProject.price_in_lovelace 
      ? (nmkrProject.price_in_lovelace / 1_000_000).toString() 
      : ''
  );
  const [countNft, setCountNft] = useState('1');
  const [payLink, setPayLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRoyaltyWarning, setShowRoyaltyWarning] = useState(false);

  const updatePrice = useUpdateNmkrPrice();
  const getPayLink = useGetNmkrPayLink();
  const updateRoyaltyWarningDismissed = useUpdateRoyaltyWarningDismissed();
  const { data: pricelist, refetch: refetchPricelist, isLoading: pricelistLoading } = useGetPricelist(nmkrProject.nmkr_project_uid);

  const handleUpdatePrice = async () => {
    const price = parseFloat(priceAda);
    const count = parseInt(countNft, 10);
    
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (isNaN(count) || count < 1) {
      toast.error('Please enter a valid NFT count (minimum 1)');
      return;
    }

    const priceInLovelace = Math.round(price * 1_000_000);

    await updatePrice.mutateAsync({
      nmkrProjectId: nmkrProject.id,
      nmkrProjectUid: nmkrProject.nmkr_project_uid,
      priceInLovelace,
      countNft: count,
    });
    
    // Refresh pricelist after update
    refetchPricelist();
  };

  const handleGetPayLinkClick = () => {
    // Check if royalty is minted or warning is dismissed
    if (!isRoyaltyMinted && !isRoyaltyWarningDismissed) {
      setShowRoyaltyWarning(true);
      return;
    }
    
    generatePayLink();
  };

  const generatePayLink = async () => {
    try {
      const result = await getPayLink.mutateAsync({
        projectUid: nmkrProject.nmkr_project_uid,
      });
      setPayLink(result.href || result.paymentLink);
    } catch {
      // Error handled by hook
    }
  };

  const handleRoyaltyWarningConfirm = async (dontShowAgain: boolean) => {
    setShowRoyaltyWarning(false);
    
    if (dontShowAgain) {
      await updateRoyaltyWarningDismissed.mutateAsync({
        nmkrProjectId: nmkrProject.id,
      });
    }
    
    generatePayLink();
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="countNft">NFT Count</Label>
              <Input
                id="countNft"
                type="number"
                min="1"
                value={countNft}
                onChange={(e) => setCountNft(e.target.value)}
                placeholder="1"
              />
              <p className="text-xs text-muted-foreground">
                Number of NFTs for this price tier
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (ADA)</Label>
              <div className="relative">
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
            </div>
          </div>
          
          <Button 
            onClick={handleUpdatePrice}
            disabled={updatePrice.isPending || !priceAda || !countNft}
            className="w-full"
          >
            {updatePrice.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Price Tier
              </>
            )}
          </Button>

          {/* Current pricelist from NMKR */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Current Price Tiers</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => refetchPricelist()}
                disabled={pricelistLoading}
              >
                <RefreshCw className={`h-3 w-3 ${pricelistLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            {pricelist && Array.isArray(pricelist) && pricelist.length > 0 ? (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="space-y-2">
                  {pricelist.map((tier: { countNft?: number; priceInLovelace?: number; isActive?: boolean }, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{tier.countNft || 1} NFT{(tier.countNft || 1) > 1 ? 's' : ''}</span>
                      <span className="font-medium">
                        {((tier.priceInLovelace || 0) / 1_000_000).toFixed(2)} ADA
                        {tier.isActive === false && <span className="ml-2 text-muted-foreground">(inactive)</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : nmkrProject.price_in_lovelace ? (
              <p className="text-xs text-muted-foreground">
                Local price: {(nmkrProject.price_in_lovelace / 1_000_000).toFixed(2)} ADA
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No price tiers set yet</p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="mb-2 text-sm font-medium">Pricing Tips</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Set count to 1 for single NFT purchases</li>
              <li>• Use higher counts with discounted prices for bulk buys</li>
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
                onClick={handleGetPayLinkClick}
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

      {/* Royalty Warning Modal */}
      <RoyaltyWarningModal
        open={showRoyaltyWarning}
        onOpenChange={setShowRoyaltyWarning}
        onConfirm={handleRoyaltyWarningConfirm}
        onCancel={() => setShowRoyaltyWarning(false)}
      />
    </div>
  );
}
