import { useState, useEffect } from 'react';
import { useUpdateNmkrPrice, useGetNmkrPayLink, useGetPricelist, useUpdateRoyaltyWarningDismissed, NmkrProject } from '@/hooks/use-nmkr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Save, ExternalLink, Copy, Check, RefreshCw, Plus, Trash2, Sparkles, Store } from 'lucide-react';
import { toast } from 'sonner';
import { RoyaltyWarningModal } from './RoyaltyWarningModal';
import { MilestoneSuccessModal } from './MilestoneSuccessModal';

interface PriceTier {
  count: number;
  priceAda: string;
}

interface SaleConfigFormProps {
  nmkrProject: NmkrProject;
  onSwitchTab?: (tab: string) => void;
}

export function SaleConfigForm({ nmkrProject, onSwitchTab }: SaleConfigFormProps) {
  const settings = nmkrProject.settings as Record<string, unknown> || {};
  const isRoyaltyMinted = settings.royaltyMinted === true;
  const isRoyaltyWarningDismissed = settings.royaltyWarningDismissed === true;

  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([{ count: 1, priceAda: '' }]);
  const [payLink, setPayLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRoyaltyWarning, setShowRoyaltyWarning] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const updatePrice = useUpdateNmkrPrice();
  const getPayLink = useGetNmkrPayLink();
  const updateRoyaltyWarningDismissed = useUpdateRoyaltyWarningDismissed();
  const { data: pricelist, refetch: refetchPricelist, isLoading: pricelistLoading } = useGetPricelist(nmkrProject.nmkr_project_uid);

  // Initialize price tiers from existing pricelist
  useEffect(() => {
    if (pricelist && Array.isArray(pricelist) && pricelist.length > 0) {
      const existingTiers = pricelist.map((tier: { countNft?: number; priceInLovelace?: number }) => ({
        count: tier.countNft || 1,
        priceAda: ((tier.priceInLovelace || 0) / 1_000_000).toString(),
      }));
      setPriceTiers(existingTiers);
    }
  }, [pricelist]);

  const addTier = () => {
    const lastCount = priceTiers.length > 0 ? priceTiers[priceTiers.length - 1].count : 0;
    setPriceTiers([...priceTiers, { count: lastCount + 1, priceAda: '' }]);
  };

  const removeTier = (index: number) => {
    if (priceTiers.length > 1) {
      setPriceTiers(priceTiers.filter((_, i) => i !== index));
    }
  };

  const updateTier = (index: number, field: 'count' | 'priceAda', value: string) => {
    const newTiers = [...priceTiers];
    if (field === 'count') {
      newTiers[index].count = parseInt(value, 10) || 1;
    } else {
      newTiers[index].priceAda = value;
    }
    setPriceTiers(newTiers);
  };

  const handleSaveAllTiers = async () => {
    // Validate all tiers
    const invalidTiers = priceTiers.filter(tier => {
      const price = parseFloat(tier.priceAda);
      return isNaN(price) || price <= 0 || tier.count < 1;
    });

    if (invalidTiers.length > 0) {
      toast.error('Please ensure all tiers have valid count (≥1) and price (>0)');
      return;
    }

    // Convert to NMKR format
    const tiersForNmkr = priceTiers.map(tier => ({
      countNft: tier.count,
      priceInLovelace: Math.round(parseFloat(tier.priceAda) * 1_000_000),
      isActive: true,
    }));

    await updatePrice.mutateAsync({
      nmkrProjectId: nmkrProject.id,
      nmkrProjectUid: nmkrProject.nmkr_project_uid,
      priceInLovelace: tiersForNmkr[0].priceInLovelace,
      countNft: tiersForNmkr[0].countNft,
      priceTiers: tiersForNmkr,
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
      // Show success modal after generating payment link
      setShowSuccessModal(true);
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
          <CardTitle className="font-display">Price Tiers</CardTitle>
          <CardDescription>
            Define separate prices for each quantity. Buyers can only purchase amounts you've explicitly configured.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Price Tiers Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Count</TableHead>
                  <TableHead>Price (ADA)</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceTiers.map((tier, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={tier.count}
                        onChange={(e) => updateTier(index, 'count', e.target.value)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="relative max-w-[200px]">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={tier.priceAda}
                          onChange={(e) => updateTier(index, 'priceAda', e.target.value)}
                          placeholder="10"
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          ADA
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {priceTiers.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTier(index)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={addTier} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Price Tier
            </Button>
            <Button 
              onClick={handleSaveAllTiers}
              disabled={updatePrice.isPending || priceTiers.some(t => !t.priceAda)}
              className="gap-2"
            >
              {updatePrice.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save All Tiers
            </Button>
          </div>

          {/* Current pricelist from NMKR */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Saved Price Tiers (from NMKR)</Label>
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
              <p className="text-xs text-muted-foreground">No price tiers saved yet</p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="mb-2 text-sm font-medium">Pricing Tips</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Each row defines a purchasable quantity (e.g., 1 NFT for 50 ADA, 2 NFTs for 90 ADA)</li>
              <li>• Buyers can only purchase exact amounts you've configured</li>
              <li>• Use bulk discounts to encourage larger purchases</li>
              <li>• NMKR charges fees on each sale (check their pricing)</li>
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
          {!nmkrProject.price_in_lovelace && (!pricelist || pricelist.length === 0) ? (
            <p className="text-sm text-muted-foreground">
              Set and save at least one price tier first to generate payment links
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

      {/* Success Modal after Payment Link Generation */}
      <MilestoneSuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        title="Minting Setup Complete!"
        description="Congratulations! You've successfully configured your NFT minting. You can now share the NMKR payment link directly with buyers, or create a beautiful Product Page storefront."
        icon={<Sparkles className="h-8 w-8 text-primary animate-pulse" />}
        primaryAction={{
          label: 'Set Up Product Page',
          onClick: () => {
            if (onSwitchTab) {
              onSwitchTab('product');
            }
          },
        }}
        secondaryAction={{
          label: 'Copy Link & Close',
          onClick: () => {
            if (payLink) {
              navigator.clipboard.writeText(payLink);
              toast.success('Payment link copied to clipboard');
            }
          },
        }}
      />
    </div>
  );
}
