import { useState } from 'react';
import { format } from 'date-fns';
import { useCreateNmkrProject, useMintRoyaltyToken } from '@/hooks/use-nmkr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Rocket, ExternalLink, Loader2, CheckCircle2, CalendarIcon, ChevronDown, Info, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NmkrSetupWizardProps {
  projectId: string;
  projectName: string;
  tokenPrefix?: string;
}

export function NmkrSetupWizard({ projectId, projectName, tokenPrefix: defaultTokenPrefix }: NmkrSetupWizardProps) {
  // Basic fields
  const [nmkrProjectName, setNmkrProjectName] = useState(projectName);
  const [tokenPrefix, setTokenPrefix] = useState(defaultTokenPrefix || 'Token');
  const [description, setDescription] = useState('');
  const [maxSupply, setMaxSupply] = useState('10000');
  const [payoutWallet, setPayoutWallet] = useState('');
  
  // Storage
  const [storageProvider, setStorageProvider] = useState<'ipfs' | 'iagon'>('ipfs');
  
  // Policy settings
  const [policyExpires, setPolicyExpires] = useState(true);
  const [policyLockDate, setPolicyLockDate] = useState<Date | undefined>(undefined);
  
  // Advanced options
  const [addressExpireTime, setAddressExpireTime] = useState('20');
  const [projectUrl, setProjectUrl] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  
  // Royalty settings
  const [royaltyPercent, setRoyaltyPercent] = useState(5);
  const [royaltyAddress, setRoyaltyAddress] = useState('');
  const [usePayoutForRoyalty, setUsePayoutForRoyalty] = useState(true);
  
  // UI state
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const createProject = useCreateNmkrProject();
  const mintRoyalty = useMintRoyaltyToken();

  // Validation
  const maxSupplyValue = parseInt(maxSupply) || 0;
  const isValidSupply = maxSupplyValue >= 1;
  const isValidWallet = payoutWallet.startsWith('addr1') && payoutWallet.length >= 58;
  const isValidPrefix = tokenPrefix.length >= 1 && tokenPrefix.length <= 15 && /^[a-zA-Z0-9_]+$/.test(tokenPrefix);
  const addressExpireTimeValue = parseInt(addressExpireTime) || 20;
  const isValidAddressExpireTime = addressExpireTimeValue >= 5 && addressExpireTimeValue <= 60;
  
  const isValidRoyaltyAddress = !usePayoutForRoyalty ? 
    (royaltyAddress.startsWith('addr1') && royaltyAddress.length >= 58) : true;
  
  const canSubmit = nmkrProjectName.trim() && isValidSupply && isValidWallet && isValidPrefix && isValidAddressExpireTime && isValidRoyaltyAddress;

  const handleCreateProject = async () => {
    if (!canSubmit) return;
    setIsCreating(true);
    
    try {
      // 1. Create the NMKR project
      const nmkrProject = await createProject.mutateAsync({
        projectId,
        projectName: nmkrProjectName.trim(),
        description: description.trim(),
        maxNftSupply: maxSupplyValue,
        payoutWalletAddress: payoutWallet.trim(),
        tokenNamePrefix: tokenPrefix.trim(),
        storageProvider,
        policyExpires,
        policyLocksDateTime: policyExpires && policyLockDate ? policyLockDate.toISOString() : undefined,
        addressExpireTime: addressExpireTimeValue,
        projectUrl: projectUrl.trim() || undefined,
        twitterHandle: twitterHandle.trim() || undefined,
      });

      // 2. Mint royalty token if configured (but don't block project creation if it fails)
      const finalRoyaltyAddress = usePayoutForRoyalty ? payoutWallet.trim() : royaltyAddress.trim();
      if (finalRoyaltyAddress && royaltyPercent >= 1 && royaltyPercent <= 10) {
        try {
          await mintRoyalty.mutateAsync({
            nmkrProjectId: nmkrProject.id,
            nmkrProjectUid: nmkrProject.nmkr_project_uid,
            royaltyAddress: finalRoyaltyAddress,
            percentage: royaltyPercent,
          });
        } catch (royaltyError: unknown) {
          // Check if it's a 402 (no mint credits) error
          const errorMessage = royaltyError instanceof Error ? royaltyError.message : String(royaltyError);
          if (errorMessage.includes('402') || errorMessage.toLowerCase().includes('mint credits')) {
            // Import toast dynamically to show warning - project still created successfully
            const { toast } = await import('sonner');
            toast.warning(
              'Royalty token could not be created - you need mint credits on NMKR Studio. You can set up royalties later in the Pricing tab.',
              { duration: 8000 }
            );
          } else {
            // Re-throw other errors
            throw royaltyError;
          }
        }
      }
    } finally {
      setIsCreating(false);
    }
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

        {/* Token Type Badge */}
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
          <Badge variant="secondary" className="text-xs">NFT</Badge>
          <div>
            <p className="text-sm font-medium">Non-Fungible Token Collection</p>
            <p className="text-xs text-muted-foreground">Each token is unique and cannot be subdivided</p>
          </div>
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Basic Information</h4>
          
          <div className="space-y-2">
            <Label htmlFor="nmkr-project-name">Collection Name <span className="text-destructive">*</span></Label>
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
            <Label htmlFor="token-prefix">Token Name Prefix <span className="text-destructive">*</span></Label>
            <Input
              id="token-prefix"
              value={tokenPrefix}
              onChange={(e) => setTokenPrefix(e.target.value)}
              placeholder="Token"
              maxLength={15}
              className={tokenPrefix && !isValidPrefix ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">
              Added to each NFT's on-chain name (e.g., "{tokenPrefix || 'Token'}0001"). Max 15 characters, alphanumeric only.
            </p>
            {tokenPrefix && !isValidPrefix && (
              <p className="text-xs text-destructive">
                Only letters, numbers, and underscores allowed (1-15 characters)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-supply">Max NFT Supply <span className="text-destructive">*</span></Label>
            <Input
              id="max-supply"
              type="number"
              min="1"
              value={maxSupply}
              onChange={(e) => setMaxSupply(e.target.value)}
              placeholder="10000"
            />
            <p className="text-xs text-muted-foreground">
              The maximum number of NFTs that can be minted from this collection
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payout-wallet">Payout Wallet Address <span className="text-destructive">*</span></Label>
            <Input
              id="payout-wallet"
              value={payoutWallet}
              onChange={(e) => setPayoutWallet(e.target.value)}
              placeholder="addr1..."
              className={payoutWallet && !isValidWallet ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">
              Your Cardano wallet address where you'll receive ADA from NFT sales
            </p>
            {payoutWallet && !isValidWallet && (
              <p className="text-xs text-destructive">
                Please enter a valid Cardano mainnet address (starts with addr1)
              </p>
            )}
          </div>
        </div>

        {/* Storage Provider */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Storage Provider</h4>
          <RadioGroup value={storageProvider} onValueChange={(v) => setStorageProvider(v as 'ipfs' | 'iagon')}>
            <div className="flex items-start space-x-3 rounded-lg border p-3">
              <RadioGroupItem value="ipfs" id="storage-ipfs" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="storage-ipfs" className="cursor-pointer font-medium">
                  IPFS <Badge variant="outline" className="ml-2 text-xs">Recommended</Badge>
                </Label>
                <p className="text-xs text-muted-foreground">
                  InterPlanetary File System - the industry standard for decentralized NFT storage
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 rounded-lg border p-3">
              <RadioGroupItem value="iagon" id="storage-iagon" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="storage-iagon" className="cursor-pointer font-medium">Iagon</Label>
                <p className="text-xs text-muted-foreground">
                  Cardano-native decentralized storage alternative
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Policy Settings */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Policy Settings</h4>
          
          <div className="flex items-start space-x-3 rounded-lg border p-3">
            <Checkbox 
              id="policy-expires" 
              checked={policyExpires}
              onCheckedChange={(checked) => setPolicyExpires(checked === true)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label htmlFor="policy-expires" className="cursor-pointer font-medium">
                Lock policy on a specific date
              </Label>
              <p className="text-xs text-muted-foreground">
                Ensures no new tokens can be minted after this date. Recommended for authenticity.
              </p>
            </div>
          </div>

          {policyExpires && (
            <div className="ml-6 space-y-2">
              <Label>Policy Lock Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !policyLockDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {policyLockDate ? format(policyLockDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={policyLockDate}
                    onSelect={setPolicyLockDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                If not set, the policy will remain open until you lock it manually in NMKR
              </p>
            </div>
          )}
        </div>

        {/* Royalty Settings */}
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Coins className="h-4 w-4 text-primary" />
            Royalty Settings
          </h4>
          
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Royalties ensure you receive a percentage of every secondary sale on marketplaces 
                like jpg.store. Highly recommended!
              </p>
            </div>
          </div>

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
              id="use-payout-royalty"
              checked={usePayoutForRoyalty}
              onCheckedChange={(checked) => setUsePayoutForRoyalty(checked === true)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label htmlFor="use-payout-royalty" className="cursor-pointer font-medium">
                Use payout wallet for royalties
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive royalties to the same wallet as primary sales
              </p>
            </div>
          </div>

          {!usePayoutForRoyalty && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="royalty-address">Royalty Wallet Address</Label>
              <Input
                id="royalty-address"
                value={royaltyAddress}
                onChange={(e) => setRoyaltyAddress(e.target.value)}
                placeholder="addr1..."
                className={royaltyAddress && !isValidRoyaltyAddress ? 'border-destructive' : ''}
              />
              {royaltyAddress && !isValidRoyaltyAddress && (
                <p className="text-xs text-destructive">
                  Please enter a valid Cardano mainnet address
                </p>
              )}
            </div>
          )}
        </div>

        {/* Advanced Options */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex w-full items-center justify-between p-0 hover:bg-transparent">
              <span className="text-sm font-semibold text-foreground">Advanced Options</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address-expire-time">Address Reservation Time (minutes)</Label>
              <Input
                id="address-expire-time"
                type="number"
                min="5"
                max="60"
                value={addressExpireTime}
                onChange={(e) => setAddressExpireTime(e.target.value)}
                placeholder="20"
                className={!isValidAddressExpireTime ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">
                How long a token is reserved for a buyer before expiring (5-60 minutes, default: 20)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-url">Project URL (Optional)</Label>
              <Input
                id="project-url"
                type="url"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="https://myproject.com"
              />
              <p className="text-xs text-muted-foreground">
                Website URL for your collection
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter-handle">Twitter/X Handle (Optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="twitter-handle"
                  value={twitterHandle}
                  onChange={(e) => setTwitterHandle(e.target.value.replace('@', ''))}
                  placeholder="yourhandle"
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Buyers can tag you when sharing purchases
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Description */}
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

        <Button 
          onClick={handleCreateProject}
          disabled={isCreating || !canSubmit}
          className="w-full"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mintRoyalty.isPending ? 'Minting Royalty Token...' : 'Creating Project...'}
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
