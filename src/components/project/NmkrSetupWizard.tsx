import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { useDropzone } from 'react-dropzone';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Rocket, ExternalLink, Loader2, CheckCircle2, CalendarIcon, ChevronDown, Info, Coins, ImageIcon, X, Globe, Twitter } from 'lucide-react';
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
  const [maxSupply, setMaxSupply] = useState('1');
  const [payoutWallet, setPayoutWallet] = useState('');
  
  // Storage
  const [storageProvider, setStorageProvider] = useState<'ipfs' | 'iagon'>('ipfs');
  
  // Policy settings
  const [policyExpires, setPolicyExpires] = useState(true);
  const [policyLockDate, setPolicyLockDate] = useState<Date | undefined>(undefined);
  
  // Marketing & Branding
  const [projectUrl, setProjectUrl] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  
  // Advanced options
  const [addressExpireTime, setAddressExpireTime] = useState('20');
  
  // Royalty settings
  const [royaltyPercent, setRoyaltyPercent] = useState(5);
  const [royaltyAddress, setRoyaltyAddress] = useState('');
  const [usePayoutForRoyalty, setUsePayoutForRoyalty] = useState(true);
  
  // UI state
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCopiesWarning, setShowCopiesWarning] = useState(false);
  const [pendingCopiesValue, setPendingCopiesValue] = useState('');
  
  const createProject = useCreateNmkrProject();
  const mintRoyalty = useMintRoyaltyToken();

  // Logo upload handler
  const onLogoDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    setLogoError(null);
    
    // Validate file size (max 500KB)
    if (file.size > 500000) {
      setLogoError('Logo must be smaller than 500KB');
      return;
    }
    
    // Validate dimensions
    const img = new Image();
    img.onload = () => {
      if (img.width > 300 || img.height > 300) {
        setLogoError('Logo must be 300x300 pixels or smaller');
        URL.revokeObjectURL(img.src);
        return;
      }
      if (img.width !== img.height) {
        setLogoError('Logo should be square (same width and height)');
        URL.revokeObjectURL(img.src);
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    };
    img.onerror = () => {
      setLogoError('Invalid image file');
    };
    img.src = URL.createObjectURL(file);
  }, []);

  const { getRootProps: getLogoRootProps, getInputProps: getLogoInputProps, isDragActive: isLogoDragActive } = useDropzone({
    onDrop: onLogoDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxFiles: 1,
  });

  const clearLogo = () => {
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoFile(null);
    setLogoPreview(null);
    setLogoError(null);
  };

  // Copies per NFT change handler with warning
  const handleCopiesChange = (newValue: string) => {
    const numValue = parseInt(newValue) || 0;
    const currentValue = parseInt(maxSupply) || 1;
    
    // Show warning when changing from 1 to a higher value
    if (currentValue === 1 && numValue > 1) {
      setPendingCopiesValue(newValue);
      setShowCopiesWarning(true);
    } else {
      setMaxSupply(newValue);
    }
  };

  const confirmCopiesChange = () => {
    setMaxSupply(pendingCopiesValue);
    setShowCopiesWarning(false);
    setPendingCopiesValue('');
  };

  const cancelCopiesChange = () => {
    setShowCopiesWarning(false);
    setPendingCopiesValue('');
  };

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
      // Convert logo to base64 if present
      let logoBase64: string | undefined;
      if (logoFile) {
        logoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            // Remove data URL prefix to get pure base64
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(logoFile);
        });
      }

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
        projectLogo: logoBase64,
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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-display text-base">
          <Rocket className="h-4 w-4 text-primary" />
          Publish to Cardano
        </CardTitle>
        <CardDescription className="text-xs">
          Set up your NMKR Studio project to mint NFTs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info box */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <h4 className="mb-1 text-sm font-semibold text-primary">What is NMKR?</h4>
          <p className="text-xs text-muted-foreground">
            NMKR Studio is a no-code NFT platform for Cardano.{' '}
            <a 
              href="https://www.nmkr.io/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-0.5"
            >
              Learn more <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        {/* Connection status + Token Type inline */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg border border-green-500/20 bg-green-500/10 px-2 py-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              API Connected
            </span>
          </div>
          <Badge variant="secondary" className="text-xs">NFT Collection</Badge>
        </div>

        {/* Basic Information */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Basic Information</h4>
          
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nmkr-project-name" className="text-sm">Collection Name <span className="text-destructive">*</span></Label>
              <Input
                id="nmkr-project-name"
                value={nmkrProjectName}
                onChange={(e) => setNmkrProjectName(e.target.value)}
                placeholder="My NFT Collection"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="token-prefix" className="text-sm">Token Prefix <span className="text-destructive">*</span></Label>
              <Input
                id="token-prefix"
                value={tokenPrefix}
                onChange={(e) => setTokenPrefix(e.target.value)}
                placeholder="Token"
                maxLength={15}
                className={tokenPrefix && !isValidPrefix ? 'border-destructive' : ''}
              />
              {tokenPrefix && !isValidPrefix && (
                <p className="text-xs text-destructive">Alphanumeric only, 1-15 chars</p>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="copies-per-nft" className="text-sm">Copies Per NFT <span className="text-destructive">*</span></Label>
              <Input
                id="copies-per-nft"
                type="number"
                min="1"
                value={maxSupply}
                onChange={(e) => handleCopiesChange(e.target.value)}
                placeholder="1"
              />
              <p className="text-xs text-muted-foreground">Set to 1 for unique NFTs</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payout-wallet" className="text-sm">Payout Wallet <span className="text-destructive">*</span></Label>
              <Input
                id="payout-wallet"
                value={payoutWallet}
                onChange={(e) => setPayoutWallet(e.target.value)}
                placeholder="addr1..."
                className={payoutWallet && !isValidWallet ? 'border-destructive' : ''}
              />
              {payoutWallet && !isValidWallet && (
                <p className="text-xs text-destructive">Valid Cardano address required</p>
              )}
            </div>
          </div>
        </div>

        {/* Marketing & Branding */}
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Globe className="h-4 w-4 text-primary" />
            Marketing & Branding
          </h4>
          
          <div className="grid gap-3 sm:grid-cols-[auto_1fr_1fr]">
            {/* Logo Upload */}
            <div className="space-y-1.5">
              <Label className="text-sm">Logo</Label>
              {logoPreview ? (
                <div className="relative">
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="h-16 w-16 rounded-lg border object-cover"
                  />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute -right-1 -top-1 h-5 w-5"
                    onClick={clearLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div
                  {...getLogoRootProps()}
                  className={cn(
                    "flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                    isLogoDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                  )}
                >
                  <input {...getLogoInputProps()} />
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              {logoError && <p className="text-xs text-destructive">{logoError}</p>}
            </div>

            {/* Project URL */}
            <div className="space-y-1.5">
              <Label htmlFor="project-url" className="text-sm">Project URL</Label>
              <Input
                id="project-url"
                type="url"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="https://myproject.com"
              />
            </div>

            {/* Twitter Handle */}
            <div className="space-y-1.5">
              <Label htmlFor="twitter-handle" className="text-sm flex items-center gap-1">
                <Twitter className="h-3 w-3" /> Twitter
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input
                  id="twitter-handle"
                  value={twitterHandle}
                  onChange={(e) => setTwitterHandle(e.target.value.replace('@', ''))}
                  placeholder="handle"
                  className="pl-7"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Storage Provider + Policy Settings - More compact */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Storage</h4>
            <RadioGroup value={storageProvider} onValueChange={(v) => setStorageProvider(v as 'ipfs' | 'iagon')} className="space-y-1">
              <div className="flex items-center space-x-2 rounded-lg border p-2">
                <RadioGroupItem value="ipfs" id="storage-ipfs" />
                <Label htmlFor="storage-ipfs" className="cursor-pointer text-sm">
                  IPFS <Badge variant="outline" className="ml-1 text-xs">Recommended</Badge>
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border p-2">
                <RadioGroupItem value="iagon" id="storage-iagon" />
                <Label htmlFor="storage-iagon" className="cursor-pointer text-sm">Iagon</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Policy</h4>
            <div className="flex items-center space-x-2 rounded-lg border p-2">
              <Checkbox 
                id="policy-expires" 
                checked={policyExpires}
                onCheckedChange={(checked) => setPolicyExpires(checked === true)}
              />
              <Label htmlFor="policy-expires" className="cursor-pointer text-sm">
                Lock policy on date
              </Label>
            </div>
            {policyExpires && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !policyLockDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {policyLockDate ? format(policyLockDate, "PP") : "Pick date"}
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
            )}
          </div>
        </div>

        {/* Royalty Settings - Compact */}
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Coins className="h-4 w-4 text-primary" />
            Royalty Settings
          </h4>
          
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-2">
            <p className="text-xs text-muted-foreground">
              Earn from secondary sales on jpg.store. Uses 1 NMKR mint credit.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Slider
                value={[royaltyPercent]}
                onValueChange={(value) => setRoyaltyPercent(value[0])}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
            </div>
            <Badge variant="outline" className="shrink-0">{royaltyPercent}%</Badge>
          </div>

          <div className="flex items-center space-x-2 rounded-lg border p-2">
            <Checkbox
              id="use-payout-royalty"
              checked={usePayoutForRoyalty}
              onCheckedChange={(checked) => setUsePayoutForRoyalty(checked === true)}
            />
            <Label htmlFor="use-payout-royalty" className="cursor-pointer text-sm">
              Use payout wallet for royalties
            </Label>
          </div>

          {!usePayoutForRoyalty && (
            <div className="space-y-1.5">
              <Label htmlFor="royalty-address" className="text-sm">Royalty Wallet</Label>
              <Input
                id="royalty-address"
                value={royaltyAddress}
                onChange={(e) => setRoyaltyAddress(e.target.value)}
                placeholder="addr1..."
                className={royaltyAddress && !isValidRoyaltyAddress ? 'border-destructive' : ''}
              />
              {royaltyAddress && !isValidRoyaltyAddress && (
                <p className="text-xs text-destructive">Valid Cardano address required</p>
              )}
            </div>
          )}
        </div>

        {/* Advanced Options + Description - Compact */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="flex w-full items-center justify-between px-0 hover:bg-transparent">
              <span className="text-sm font-semibold text-foreground">Advanced Options</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="address-expire-time" className="text-sm">Reservation Time (min)</Label>
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
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your collection..."
                  rows={2}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

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

        {/* Copies Per NFT Warning Modal */}
        <AlertDialog open={showCopiesWarning} onOpenChange={setShowCopiesWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want multiple copies?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>
                    Setting "Copies Per NFT" to <strong>{pendingCopiesValue}</strong> means each unique NFT design 
                    in your collection can be minted <strong>{pendingCopiesValue} times</strong>.
                  </p>
                  <p>
                    <strong>Example:</strong> If you have 100 unique designs and set this to {pendingCopiesValue}, 
                    your total collection supply will be <strong>{(parseInt(pendingCopiesValue) || 1) * 100} NFTs</strong>.
                  </p>
                  <p className="text-amber-600 font-medium">
                    For fully unique, 1-of-1 collections, this value should remain at 1.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelCopiesChange}>Keep at 1</AlertDialogCancel>
              <AlertDialogAction onClick={confirmCopiesChange}>
                Yes, set to {pendingCopiesValue}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
