import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  useProductPage, 
  useUpdateProductPage, 
  useUploadProductImage, 
  useDeleteProductImage,
} from '@/hooks/use-product-page';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import { useAuth } from '@/contexts/AuthContext';
import { useNmkrProject, useGetNmkrPayLink } from '@/hooks/use-nmkr';
import { useCreatorCollections } from '@/hooks/use-creator-collections';
import { useIsVerifiedCreator, useMyVerificationRequest, useSubmitVerificationRequest } from '@/hooks/use-verification-request';
import { ProductPagePreview } from './ProductPagePreview';
import { MilestoneSuccessModal } from './MilestoneSuccessModal';
import { ScheduleLaunchModal } from './ScheduleLaunchModal';
import { CountdownTimer } from '@/components/CountdownTimer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Image as ImageIcon, 
  Upload, 
  X, 
  Save, 
  Loader2,
  Globe,
  Twitter,
  MessageCircle,
  User,
  ExternalLink,
  Eye,
  Rocket,
  ShoppingCart,
  Sparkles,
  BadgeCheck,
  AlertCircle,
  Hash,
  Store,
  Clock,
  EyeOff,
  Calendar,
  CheckCircle,
  XCircle,
  Send,
} from 'lucide-react';
import { cn, generateSlug } from '@/lib/utils';
import { toast } from 'sonner';
import { isValidTwitterUrl, isValidDiscordUrl, isValidWebsiteUrl, isValidSecondaryMarketUrl } from '@/lib/url-validation';

interface ProductPageTabProps {
  projectId: string;
  projectName?: string;
  isLocked?: boolean;
  onSwitchTab?: (tab: string) => void;
}

export function ProductPageTab({ projectId, projectName = 'Collection', isLocked, onSwitchTab }: ProductPageTabProps) {
  const { user } = useAuth();
  const { data: productPage, isLoading } = useProductPage(projectId);
  const { data: profile } = useProfile(user?.id);
  const { data: nmkrProject } = useNmkrProject(projectId);
  const { data: creatorCollections } = useCreatorCollections(user?.id, projectId);
  const { data: isVerifiedCreator } = useIsVerifiedCreator(user?.id);
  const { data: verificationRequest, refetch: refetchVerificationRequest } = useMyVerificationRequest();
  const submitVerification = useSubmitVerificationRequest();
  const updateProductPage = useUpdateProductPage();
  const uploadImage = useUploadProductImage();
  const deleteImage = useDeleteProductImage();
  const getPayLink = useGetNmkrPayLink();
  
  // Verification request form state
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationTwitter, setVerificationTwitter] = useState('');
  const [verificationBio, setVerificationBio] = useState('');

  // Form state
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [tagline, setTagline] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [discordUrl, setDiscordUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [founderName, setFounderName] = useState('');
  const [founderPfpUrl, setFounderPfpUrl] = useState<string | null>(null);
  const [founderBio, setFounderBio] = useState('');
  const [founderTwitter, setFounderTwitter] = useState('');
  const [secondaryMarketUrl, setSecondaryMarketUrl] = useState('');
  const [maxSupply, setMaxSupply] = useState<number | null>(null);
  
  // Buy button state
  const [buyButtonEnabled, setBuyButtonEnabled] = useState(false);
  const [buyButtonText, setBuyButtonText] = useState('Mint Now');
  const [buyButtonLink, setBuyButtonLink] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [scheduledLaunchAt, setScheduledLaunchAt] = useState<string | null>(null);
  const [isHidden, setIsHidden] = useState(false);
  
  // URL validation errors
  const [twitterError, setTwitterError] = useState<string | null>(null);
  const [discordError, setDiscordError] = useState<string | null>(null);
  const [websiteError, setWebsiteError] = useState<string | null>(null);
  const [secondaryMarketError, setSecondaryMarketError] = useState<string | null>(null);
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [founderPrefilled, setFounderPrefilled] = useState(false);
  const [showSetupCompleteModal, setShowSetupCompleteModal] = useState(false);
  
  // Track if this is a fresh setup (no previous banner or tagline)
  const wasFreshSetup = !productPage?.banner_url && !productPage?.tagline && !productPage?.is_live;
  
  // Legacy founder verification status (collection-specific)
  const founderVerified = (productPage as { founder_verified?: boolean } | undefined)?.founder_verified ?? false;
  
  // Prefill verification twitter from founder twitter
  useEffect(() => {
    if (founderTwitter && !verificationTwitter) {
      setVerificationTwitter(founderTwitter);
    }
  }, [founderTwitter, verificationTwitter]);

  // Initialize form with existing data
  useEffect(() => {
    if (productPage) {
      setBannerUrl(productPage.banner_url);
      setLogoUrl(productPage.logo_url);
      setTagline(productPage.tagline || '');
      setTwitterUrl(productPage.twitter_url || '');
      setDiscordUrl(productPage.discord_url || '');
      setWebsiteUrl(productPage.website_url || '');
      setFounderName(productPage.founder_name || '');
      setFounderPfpUrl(productPage.founder_pfp_url);
      setFounderBio(productPage.founder_bio || '');
      setFounderTwitter(productPage.founder_twitter || '');
      setBuyButtonEnabled(productPage.buy_button_enabled || false);
      setBuyButtonText(productPage.buy_button_text || 'Mint Now');
      setBuyButtonLink(productPage.buy_button_link);
      setIsLive(productPage.is_live || false);
      setSecondaryMarketUrl(productPage.secondary_market_url || '');
      setMaxSupply(productPage.max_supply ?? null);
      setScheduledLaunchAt(productPage.scheduled_launch_at);
      setIsHidden(productPage.is_hidden || false);
    }
  }, [productPage]);

  // Prefill founder info from profile if empty
  useEffect(() => {
    if (profile && !founderPrefilled && !productPage?.founder_name) {
      if (profile.display_name && !founderName) {
        setFounderName(profile.display_name);
      }
      if (profile.avatar_url && !founderPfpUrl) {
        setFounderPfpUrl(profile.avatar_url);
      }
      setFounderPrefilled(true);
    }
  }, [profile, founderPrefilled, productPage, founderName, founderPfpUrl]);

  // Banner upload
  const onBannerDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    const url = await uploadImage.mutateAsync({ projectId, file, type: 'banner' });
    setBannerUrl(url);
  }, [projectId, uploadImage]);

  const { getRootProps: getBannerRootProps, getInputProps: getBannerInputProps, isDragActive: isBannerDragActive } = useDropzone({
    onDrop: onBannerDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
  });

  // Logo upload
  const onLogoDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    const url = await uploadImage.mutateAsync({ projectId, file, type: 'logo' });
    setLogoUrl(url);
  }, [projectId, uploadImage]);

  const { getRootProps: getLogoRootProps, getInputProps: getLogoInputProps, isDragActive: isLogoDragActive } = useDropzone({
    onDrop: onLogoDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
  });

  // Founder PFP upload with option to sync to profile
  const updateProfile = useUpdateProfile();
  
  const onFounderPfpDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    const url = await uploadImage.mutateAsync({ projectId, file, type: 'founder' });
    setFounderPfpUrl(url);
    
    // Offer to sync to profile if user is not a verified creator
    if (!isVerifiedCreator && user?.id) {
      toast.info('Founder image uploaded', {
        description: 'Want to use this as your profile picture too?',
        action: {
          label: 'Sync to profile',
          onClick: async () => {
            try {
              await updateProfile.mutateAsync({ userId: user.id, avatarUrl: url });
              toast.success('Profile picture updated');
            } catch (err: any) {
              toast.error('Failed to sync: ' + err.message);
            }
          },
        },
      });
    }
  }, [projectId, uploadImage, isVerifiedCreator, user?.id, updateProfile]);

  const { getRootProps: getFounderPfpRootProps, getInputProps: getFounderPfpInputProps, isDragActive: isFounderPfpDragActive } = useDropzone({
    onDrop: onFounderPfpDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
  });

  // Generate payment link
  const handleGeneratePayLink = async () => {
    if (!nmkrProject) {
      toast.error('Set up NMKR project in Publish tab first');
      return;
    }
    try {
      const result = await getPayLink.mutateAsync({
        projectUid: nmkrProject.nmkr_project_uid,
      });
      const link = result.href || result.paymentLink;
      setBuyButtonLink(link);
      toast.success('Payment link generated!');
    } catch {
      // Error handled by hook
    }
  };

  // URL validation handlers
  const validateTwitterUrl = (url: string) => {
    const result = isValidTwitterUrl(url);
    setTwitterError(result.isValid ? null : result.error || null);
    return result.isValid;
  };

  const validateDiscordUrl = (url: string) => {
    const result = isValidDiscordUrl(url);
    setDiscordError(result.isValid ? null : result.error || null);
    return result.isValid;
  };

  const validateWebsiteUrl = (url: string) => {
    const result = isValidWebsiteUrl(url);
    setWebsiteError(result.isValid ? null : result.error || null);
    return result.isValid;
  };

  const validateSecondaryMarketUrl = (url: string) => {
    const result = isValidSecondaryMarketUrl(url);
    setSecondaryMarketError(result.isValid ? null : result.error || null);
    return result.isValid;
  };

  // Save handler
  const handleSave = async () => {
    // Validate all URLs first
    const isTwitterValid = validateTwitterUrl(twitterUrl);
    const isDiscordValid = validateDiscordUrl(discordUrl);
    const isWebsiteValid = validateWebsiteUrl(websiteUrl);
    const isSecondaryMarketValid = validateSecondaryMarketUrl(secondaryMarketUrl);
    
    if (!isTwitterValid || !isDiscordValid || !isWebsiteValid || !isSecondaryMarketValid) {
      toast.error('Please fix the URL validation errors before saving');
      return;
    }

    // Check if founder twitter handle is already claimed by another verified creator
    if (founderTwitter && user?.id) {
      const { checkTwitterHandleAvailable } = await import('@/hooks/use-admin');
      const { available } = await checkTwitterHandleAvailable(founderTwitter, user.id);
      if (!available) {
        toast.error('This Twitter handle is already claimed by another verified creator');
        return;
      }
    }

    // For verified creators, use their verified profile data for founder fields
    const finalFounderName = isVerifiedCreator ? (profile?.display_name || founderName) : founderName;
    const finalFounderTwitter = isVerifiedCreator ? (profile?.twitter_handle || founderTwitter) : founderTwitter;

    // Auto-generate slug from project name if not already set
    const slug = generateSlug(projectName);

    await updateProductPage.mutateAsync({
      projectId,
      updates: {
        banner_url: bannerUrl,
        logo_url: logoUrl,
        tagline: tagline || null,
        twitter_url: twitterUrl || null,
        discord_url: discordUrl || null,
        website_url: websiteUrl || null,
        founder_name: finalFounderName || null,
        founder_pfp_url: founderPfpUrl,
        founder_bio: founderBio || null,
        founder_twitter: finalFounderTwitter || null,
        portfolio: [], // Keep empty portfolio for backwards compatibility
        buy_button_enabled: buyButtonEnabled,
        buy_button_text: buyButtonText || 'Mint Now',
        buy_button_link: buyButtonLink,
        is_live: isLive,
        secondary_market_url: secondaryMarketUrl || null,
        max_supply: maxSupply,
        scheduled_launch_at: scheduledLaunchAt,
        is_hidden: isHidden,
        slug: slug || null,
      },
    });

    // Show success modal if this was a fresh setup and now has content
    if (wasFreshSetup && (bannerUrl || tagline)) {
      setShowSetupCompleteModal(true);
    }
  };

  // State for schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Schedule launch handler with selected date
  const handleScheduleLaunch = async (scheduledDate: Date) => {
    if (!buyButtonLink && !nmkrProject?.price_in_lovelace) {
      toast.error('Generate a payment link in the Publish tab first');
      return;
    }
    
    const launchTimeStr = scheduledDate.toISOString();
    
    setIsLive(true);
    setScheduledLaunchAt(launchTimeStr);
    
    await updateProductPage.mutateAsync({
      projectId,
      updates: {
        is_live: true,
        scheduled_launch_at: launchTimeStr,
        buy_button_link: buyButtonLink,
      },
    });
    
    const { format } = await import('date-fns');
    toast.success(`Your collection is scheduled to launch on ${format(scheduledDate, 'PPP')} at ${format(scheduledDate, 'p')}!`);
  };

  // Cancel scheduled launch
  const handleCancelLaunch = async () => {
    setIsLive(false);
    setScheduledLaunchAt(null);
    
    await updateProductPage.mutateAsync({
      projectId,
      updates: {
        is_live: false,
        scheduled_launch_at: null,
      },
    });
    toast.success('Scheduled launch cancelled');
  };

  // Toggle collection visibility (pause/unpause)
  const handleToggleHidden = async (hidden: boolean) => {
    setIsHidden(hidden);
    await updateProductPage.mutateAsync({
      projectId,
      updates: {
        is_hidden: hidden,
      },
    });
    toast.success(hidden ? 'Collection hidden from marketplace' : 'Collection visible on marketplace');
  };

  // Clear image helpers
  const clearBanner = () => {
    if (bannerUrl) deleteImage.mutate(bannerUrl);
    setBannerUrl(null);
  };

  const clearLogo = () => {
    if (logoUrl) deleteImage.mutate(logoUrl);
    setLogoUrl(null);
  };

  const clearFounderPfp = () => {
    if (founderPfpUrl) deleteImage.mutate(founderPfpUrl);
    setFounderPfpUrl(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Show locked state if pricing not set up
  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Card className="max-w-lg w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Store className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="font-display">Set Up Your Minting First</CardTitle>
            <CardDescription>
              Before creating your Product Page, you need to configure your NFT pricing in the Publish tab.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-left rounded-lg border bg-muted/30 p-4">
              <h4 className="text-sm font-medium mb-3">What you'll need for your Product Page:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Banner image (recommended 1200x400)
                </li>
                <li className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Collection logo
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Tagline/description
                </li>
                <li className="flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Social links (Twitter, Discord, Website)
                </li>
                <li className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Founder/team information
                </li>
              </ul>
            </div>
            <Button 
              className="w-full" 
              onClick={() => onSwitchTab?.('publish')}
            >
              Go to Publish Tab
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSaving = updateProductPage.isPending || uploadImage.isPending;
  // Require payment link to be saved to enable scheduling
  const canGoLive = !!productPage?.buy_button_link;

  // Build preview product page object
  const previewProductPage = {
    id: productPage?.id || '',
    project_id: projectId,
    banner_url: bannerUrl,
    logo_url: logoUrl,
    tagline,
    twitter_url: twitterUrl,
    discord_url: discordUrl,
    website_url: websiteUrl,
    founder_name: founderName,
    founder_pfp_url: founderPfpUrl,
    founder_bio: founderBio,
    founder_twitter: founderTwitter,
    portfolio: [],
    buy_button_enabled: buyButtonEnabled,
    buy_button_text: buyButtonText,
    buy_button_link: buyButtonLink,
    is_live: isLive,
    secondary_market_url: secondaryMarketUrl,
    max_supply: maxSupply,
    scheduled_launch_at: scheduledLaunchAt,
    is_hidden: isHidden,
    created_at: productPage?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Determine launch status
  const isScheduled = scheduledLaunchAt && new Date(scheduledLaunchAt) > new Date();
  const isActuallyLive = isLive && !isScheduled;

  return (
    <div className="space-y-6">
      {/* Action Bar with Save Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center gap-2 flex-wrap">
          {isScheduled ? (
            <>
              <Badge variant="default" className="gap-1 bg-amber-500">
                <Clock className="h-3 w-3" />
                Scheduled
              </Badge>
              <CountdownTimer 
                targetDate={new Date(scheduledLaunchAt!)} 
                compact 
                className="text-muted-foreground"
              />
            </>
          ) : isActuallyLive ? (
            <Badge variant="default" className="gap-1 bg-green-600">
              <Rocket className="h-3 w-3" />
              Live
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              Draft
            </Badge>
          )}
          {isHidden && (
            <Badge variant="outline" className="gap-1">
              <EyeOff className="h-3 w-3" />
              Hidden
            </Badge>
          )}
          {(isActuallyLive || isScheduled) && (
            <a 
              href={`/collection/${projectId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View public page
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Save Button - Primary action */}
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          {isScheduled ? (
            <Button 
              size="sm" 
              variant="destructive"
              onClick={handleCancelLaunch}
              disabled={isSaving}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Launch
            </Button>
          ) : !isActuallyLive ? (
            <Button 
              size="sm" 
              onClick={() => setShowScheduleModal(true)}
              disabled={!canGoLive || isSaving}
              className={cn(!canGoLive && "opacity-50")}
              title={!canGoLive ? 'Generate a payment link and save first' : undefined}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Launch
            </Button>
          ) : null}
        </div>
      </div>

      {/* Schedule Requirements Info */}
      {!canGoLive && !isScheduled && !isActuallyLive && (
        <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription>
            <strong>To schedule your launch:</strong> Enable the Buy Button in Collection Settings below, generate a payment link, and save your product page.
          </AlertDescription>
        </Alert>
      )}

      {/* Scheduled Launch Info */}
      {isScheduled && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Your collection is scheduled to launch on{' '}
            <strong>{new Date(scheduledLaunchAt!).toLocaleString()}</strong>. 
            It will appear as "Upcoming" in the marketplace until then. 
            We review all scheduled collections before they go live.
          </AlertDescription>
        </Alert>
      )}

      {/* Collection Visibility (for live collections) */}
      {isActuallyLive && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <EyeOff className="h-5 w-5 text-primary" />
              Collection Visibility
            </CardTitle>
            <CardDescription>
              Temporarily hide your collection from the marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="pause-collection">Pause Collection</Label>
                <p className="text-xs text-muted-foreground">
                  When paused, your collection won't appear in the marketplace and the mint button will be hidden
                </p>
              </div>
              <Switch
                id="pause-collection"
                checked={isHidden}
                onCheckedChange={handleToggleHidden}
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 1: Branding & Identity (consolidated) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <ImageIcon className="h-5 w-5 text-primary" />
            Branding & Identity
          </CardTitle>
          <CardDescription>
            Your collection's visual identity and social presence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Banner + Logo side by side */}
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            {/* Banner */}
            <div className="space-y-1">
              <Label className="text-sm">Banner <span className="text-xs text-muted-foreground">(1200×400)</span></Label>
              {bannerUrl ? (
                <div className="relative">
                  <img 
                    src={bannerUrl} 
                    alt="Banner preview" 
                    className="h-24 w-full rounded-lg border object-cover"
                  />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute right-2 top-2 h-6 w-6"
                    onClick={clearBanner}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div
                  {...getBannerRootProps()}
                  className={cn(
                    "flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                    isBannerDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                  )}
                >
                  <input {...getBannerInputProps()} />
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mt-1">Drop or click</p>
                </div>
              )}
            </div>

            {/* Logo */}
            <div className="space-y-1">
              <Label className="text-sm">Logo</Label>
              {logoUrl ? (
                <div className="relative">
                  <img 
                    src={logoUrl} 
                    alt="Logo preview" 
                    className="h-20 w-20 rounded-lg border object-cover"
                  />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute -right-2 -top-2 h-5 w-5"
                    onClick={clearLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div
                  {...getLogoRootProps()}
                  className={cn(
                    "flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                    isLogoDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                  )}
                >
                  <input {...getLogoInputProps()} />
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Tagline + Social Links on same row */}
          <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
            {/* Tagline */}
            <div className="space-y-1">
              <Label htmlFor="tagline" className="text-sm">Tagline</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Short catchy tagline"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">{tagline.length}/100</p>
            </div>

            {/* Social Links */}
            <div className="space-y-1">
              <Label className="text-sm flex items-center gap-1">
                <Globe className="h-3 w-3" /> Links
              </Label>
              <div className="grid gap-2 md:grid-cols-3">
                <div className="relative">
                  <Input
                    type="url"
                    value={twitterUrl}
                    onChange={(e) => {
                      setTwitterUrl(e.target.value);
                      if (twitterError) validateTwitterUrl(e.target.value);
                    }}
                    onBlur={() => validateTwitterUrl(twitterUrl)}
                    placeholder="Twitter/X URL"
                    className={cn("pl-7", twitterError && "border-destructive")}
                  />
                  <Twitter className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  {twitterError && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2" title={twitterError}>
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type="url"
                    value={discordUrl}
                    onChange={(e) => {
                      setDiscordUrl(e.target.value);
                      if (discordError) validateDiscordUrl(e.target.value);
                    }}
                    onBlur={() => validateDiscordUrl(discordUrl)}
                    placeholder="Discord URL"
                    className={cn("pl-7", discordError && "border-destructive")}
                  />
                  <MessageCircle className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  {discordError && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2" title={discordError}>
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => {
                      setWebsiteUrl(e.target.value);
                      if (websiteError) validateWebsiteUrl(e.target.value);
                    }}
                    onBlur={() => validateWebsiteUrl(websiteUrl)}
                    placeholder="Website URL"
                    className={cn("pl-7", websiteError && "border-destructive")}
                  />
                  <Globe className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  {websiteError && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2" title={websiteError}>
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Founder/Creator Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <User className="h-5 w-5 text-primary" />
            Founder / Creator Info
          </CardTitle>
          <CardDescription>
            Introduce yourself to potential collectors
            {founderPrefilled && !productPage?.founder_name && (
              <span className="ml-2 text-primary">(Prefilled from your profile)</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Creator Verification Section */}
          {isVerifiedCreator ? (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                You are a <strong>verified creator</strong>. Your verified badge will appear on all your collections.
              </AlertDescription>
            </Alert>
          ) : verificationRequest?.status === 'pending' ? (
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <Clock className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                Your verification request is <strong>pending review</strong>. We'll notify you once it's processed.
              </AlertDescription>
            </Alert>
          ) : verificationRequest?.status === 'rejected' ? (
            <div className="space-y-3">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Your verification request was rejected: <strong>{verificationRequest.rejection_reason || 'No reason provided'}</strong>
                </AlertDescription>
              </Alert>
              {!showVerificationForm && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowVerificationForm(true)}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Resubmit Request
                </Button>
              )}
            </div>
          ) : !showVerificationForm && !founderVerified ? (
            <Alert>
              <BadgeCheck className="h-4 w-4" />
              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <strong>Want a verified badge?</strong> Request verification to build trust with collectors.
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowVerificationForm(true)}
                  className="shrink-0"
                >
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  Request Verification
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
          
          {/* Verification Request Form */}
          {showVerificationForm && !isVerifiedCreator && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  Request Creator Verification
                </h4>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => setShowVerificationForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verification-twitter" className="flex items-center gap-2">
                    <Twitter className="h-3 w-3" />
                    Twitter Handle <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                    <Input
                      id="verification-twitter"
                      value={verificationTwitter}
                      onChange={(e) => setVerificationTwitter(e.target.value.replace('@', ''))}
                      placeholder="yourhandle"
                      className="pl-7"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll use this to verify your identity
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="verification-bio">About You (Optional)</Label>
                  <Textarea
                    id="verification-bio"
                    value={verificationBio}
                    onChange={(e) => setVerificationBio(e.target.value)}
                    placeholder="Tell us about your background as a creator, previous collections, etc."
                    rows={3}
                    maxLength={500}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      if (!verificationTwitter.trim()) {
                        toast.error('Twitter handle is required');
                        return;
                      }
                      await submitVerification.mutateAsync({
                        twitterHandle: verificationTwitter.trim(),
                        bio: verificationBio.trim() || undefined,
                      });
                      setShowVerificationForm(false);
                      refetchVerificationRequest();
                    }}
                    disabled={submitVerification.isPending || !verificationTwitter.trim()}
                  >
                    {submitVerification.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Request
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowVerificationForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Verified creator info notice */}
          {isVerifiedCreator && (
            <Alert className="border-primary/50 bg-primary/5">
              <BadgeCheck className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">
                Your name and Twitter handle are synced from your verified profile and cannot be changed.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              {/* Founder PFP */}
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                {founderPfpUrl ? (
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img 
                        src={founderPfpUrl} 
                        alt="Founder PFP" 
                        className="h-20 w-20 rounded-full border object-cover"
                      />
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute -right-1 -top-1 h-5 w-5"
                        onClick={clearFounderPfp}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    {...getFounderPfpRootProps()}
                    className={cn(
                      "flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed transition-colors",
                      isFounderPfpDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                    )}
                  >
                    <input {...getFounderPfpInputProps()} />
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Founder Name */}
              <div className="space-y-2">
                <Label htmlFor="founder-name" className="flex items-center gap-2">
                  Name
                  {isVerifiedCreator && (
                    <Badge variant="outline" className="text-xs">Locked</Badge>
                  )}
                </Label>
                <Input
                  id="founder-name"
                  value={isVerifiedCreator ? (profile?.display_name || founderName) : founderName}
                  onChange={(e) => !isVerifiedCreator && setFounderName(e.target.value)}
                  placeholder="Your name or alias"
                  disabled={isVerifiedCreator}
                  className={isVerifiedCreator ? "bg-muted cursor-not-allowed" : ""}
                />
                {isVerifiedCreator && (
                  <p className="text-xs text-muted-foreground">From your verified profile</p>
                )}
              </div>

              {/* Founder Twitter */}
              <div className="space-y-2">
                <Label htmlFor="founder-twitter" className="flex items-center gap-2">
                  <Twitter className="h-3 w-3" />
                  Twitter Handle
                  {isVerifiedCreator && (
                    <Badge variant="outline" className="text-xs">Locked</Badge>
                  )}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                  <Input
                    id="founder-twitter"
                    value={isVerifiedCreator ? (profile?.twitter_handle || founderTwitter) : founderTwitter}
                    onChange={(e) => !isVerifiedCreator && setFounderTwitter(e.target.value.replace('@', ''))}
                    placeholder="yourhandle"
                    className={cn("pl-7", isVerifiedCreator && "bg-muted cursor-not-allowed")}
                    disabled={isVerifiedCreator}
                  />
                </div>
                {isVerifiedCreator && (
                  <p className="text-xs text-muted-foreground">From your verified profile</p>
                )}
              </div>
            </div>

            {/* Founder Bio */}
            <div className="space-y-2">
              <Label htmlFor="founder-bio">Bio</Label>
              <Textarea
                id="founder-bio"
                value={founderBio}
                onChange={(e) => setFounderBio(e.target.value)}
                placeholder="Tell collectors about yourself, your background, and your vision for this collection..."
                rows={8}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {founderBio.length}/500 characters
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Collection Settings (combined) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Hash className="h-5 w-5 text-primary" />
            Collection Settings
          </CardTitle>
          <CardDescription>
            Supply, marketplace, and purchase settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Max Supply + Secondary Market */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max-supply">Max Supply</Label>
              <Input
                id="max-supply"
                type="number"
                min="1"
                value={maxSupply ?? ''}
                onChange={(e) => setMaxSupply(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="e.g., 10000"
              />
              <p className="text-xs text-muted-foreground">
                Total number of NFTs in this collection
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secondary-market" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Secondary Market
              </Label>
              <Input
                id="secondary-market"
                type="url"
                value={secondaryMarketUrl}
                onChange={(e) => {
                  setSecondaryMarketUrl(e.target.value);
                  if (secondaryMarketError) validateSecondaryMarketUrl(e.target.value);
                }}
                onBlur={() => validateSecondaryMarketUrl(secondaryMarketUrl)}
                placeholder="https://jpg.store/collection/..."
                className={cn(secondaryMarketError && "border-destructive")}
              />
              {secondaryMarketError ? (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {secondaryMarketError}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Link to jpg.store or wayup.io collection page
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Buy Now Button section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="buy-button-enabled" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Enable Buy Button
                </Label>
                <p className="text-xs text-muted-foreground">
                  Show a prominent mint button on your product page
                </p>
              </div>
              <Switch
                id="buy-button-enabled"
                checked={buyButtonEnabled}
                onCheckedChange={setBuyButtonEnabled}
              />
            </div>

            {buyButtonEnabled && (
              <div className="grid gap-4 md:grid-cols-2 pl-6 border-l-2 border-primary/20">
                <div className="space-y-2">
                  <Label htmlFor="buy-button-text">Button Text</Label>
                  <Input
                    id="buy-button-text"
                    value={buyButtonText}
                    onChange={(e) => setBuyButtonText(e.target.value)}
                    placeholder="Mint Now"
                    maxLength={30}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Link</Label>
                  {buyButtonLink ? (
                    <div className="flex items-center gap-2">
                      <Input value={buyButtonLink} readOnly className="font-mono text-xs" />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setBuyButtonLink(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={handleGeneratePayLink}
                        disabled={!nmkrProject || getPayLink.isPending}
                        className="w-full"
                      >
                        {getPayLink.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Generate Payment Link
                      </Button>
                      {!nmkrProject && (
                        <p className="text-xs text-muted-foreground">
                          Set up NMKR project and pricing in the Publish tab first
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Your AnonForge Collections (Auto-populated) */}
      {creatorCollections && creatorCollections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Rocket className="h-5 w-5 text-primary" />
              Your AnonForge Collections
            </CardTitle>
            <CardDescription>
              Your other live collections on AnonForge (auto-populated)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {creatorCollections.map((collection) => (
                <a
                  key={collection.id}
                  href={`/collection/${collection.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg border overflow-hidden transition-all hover:shadow-lg hover:border-primary"
                >
                  {collection.banner_url ? (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={collection.banner_url}
                        alt={collection.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium truncate">{collection.name}</h4>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <ProductPagePreview
          productPage={previewProductPage}
          projectName={projectName}
          projectId={projectId}
          paymentLink={buyButtonLink}
          nmkrPolicyId={nmkrProject?.nmkr_policy_id}
          founderVerified={founderVerified}
          isVerifiedCreator={isVerifiedCreator ?? false}
          creatorCollections={creatorCollections}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Product Page Setup Complete Modal */}
      <MilestoneSuccessModal
        open={showSetupCompleteModal}
        onOpenChange={setShowSetupCompleteModal}
        title="Product Page Ready!"
        description="Congratulations! You've set up your product page. You can now schedule your launch to get listed on our marketplace, or explore the Marketing tab for featured placement options."
        primaryAction={{
          label: 'Schedule Launch',
          onClick: () => {
            setShowSetupCompleteModal(false);
            setShowScheduleModal(true);
          },
        }}
        secondaryAction={{
          label: 'Explore Marketing',
          onClick: () => onSwitchTab?.('marketing'),
        }}
      />

      {/* Schedule Launch Modal */}
      <ScheduleLaunchModal
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        onSchedule={(date) => {
          handleScheduleLaunch(date);
          setShowScheduleModal(false);
        }}
      />
    </div>
  );
}
