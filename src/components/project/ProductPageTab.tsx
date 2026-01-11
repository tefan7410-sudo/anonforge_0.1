import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  useProductPage, 
  useUpdateProductPage, 
  useUploadProductImage, 
  useDeleteProductImage,
  type CollectionType,
  type PreviewImage,
  type ArtworkItem,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  Palette,
  Layers,
  Plus,
  Trash2,
  Lock,
  ChevronDown,
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

// Helper dropzone component for preview images
function PreviewImageDropzone({ onUpload, isUploading }: { onUpload: (file: File) => Promise<void>; isUploading: boolean }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (files) => {
      const file = files[0];
      if (file) await onUpload(file);
    },
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
        isUploading && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : (
        <>
          <Upload className="h-6 w-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground mt-1">Drop image</p>
        </>
      )}
    </div>
  );
}

// Helper dropzone component for artwork images
function ArtworkImageDropzone({ onUpload, isUploading }: { onUpload: (file: File) => Promise<void>; isUploading: boolean }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (files) => {
      const file = files[0];
      if (file) await onUpload(file);
    },
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
        isUploading && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : (
        <>
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground mt-1">Upload</p>
        </>
      )}
    </div>
  );
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
  // Get editions count from NMKR project settings (read-only, set in Publish tab)
  const editions = (nmkrProject?.settings as { maxNftSupply?: number })?.maxNftSupply ?? 1;
  
  // Collection type and template-specific state
  const [collectionType, setCollectionType] = useState<CollectionType>('generative');
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const [artworks, setArtworks] = useState<ArtworkItem[]>([]);
  
  // Buy button state
  const [buyButtonEnabled, setBuyButtonEnabled] = useState(false);
  const [buyButtonText, setBuyButtonText] = useState('Mint Now');
  const [buyButtonLink, setBuyButtonLink] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [scheduledLaunchAt, setScheduledLaunchAt] = useState<string | null>(null);
  const [isHidden, setIsHidden] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
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
      // max_supply is now derived from NMKR settings, no need to set state
      setScheduledLaunchAt(productPage.scheduled_launch_at);
      setIsHidden(productPage.is_hidden || false);
      setCollectionType(productPage.collection_type || 'generative');
      setPreviewImages(productPage.preview_images || []);
      setArtworks(productPage.artworks || []);
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
        max_supply: editions,
        scheduled_launch_at: scheduledLaunchAt,
        is_hidden: isHidden,
        slug: slug || null,
        collection_type: collectionType,
        preview_images: previewImages,
        artworks: artworks,
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

  // Toggle collection visibility (pause/unpause) - also controls buy button
  const handleToggleHidden = async (hidden: boolean) => {
    setIsHidden(hidden);
    // When hiding, also disable buy button
    if (hidden) {
      setBuyButtonEnabled(false);
    }
    await updateProductPage.mutateAsync({
      projectId,
      updates: {
        is_hidden: hidden,
        buy_button_enabled: hidden ? false : buyButtonEnabled,
      },
    });
    toast.success(hidden ? 'Collection hidden from marketplace (buy button disabled)' : 'Collection visible on marketplace');
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
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  // Show locked state if pricing not set up
  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Card className="max-w-lg w-full text-center">
          <CardHeader className="pb-3">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Store className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="font-display text-lg">Set Up Your Minting First</CardTitle>
            <CardDescription className="text-sm">
              Configure your NFT pricing in the Publish tab before creating your Product Page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-left rounded-lg border bg-muted/30 p-3">
              <h4 className="text-sm font-medium mb-2">What you'll need:</h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Banner image & logo
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Tagline/description
                </li>
                <li className="flex items-center gap-2">
                  <Twitter className="h-3.5 w-3.5" />
                  Social links & founder info
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
    max_supply: editions,
    scheduled_launch_at: scheduledLaunchAt,
    is_hidden: isHidden,
    collection_type: collectionType,
    preview_images: previewImages,
    artworks: artworks,
    admin_approved: productPage?.admin_approved ?? false,
    rejection_reason: productPage?.rejection_reason ?? null,
    created_at: productPage?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Determine launch status
  const isScheduled = scheduledLaunchAt && new Date(scheduledLaunchAt) > new Date();
  const isActuallyLive = isLive && !isScheduled;
  
  // Determine editing lock status
  const isApproved = productPage?.admin_approved === true;
  const isRejected = !!productPage?.rejection_reason && !productPage?.admin_approved;
  
  // Editing is locked if scheduled (pending or approved) or live, but NOT if rejected
  const isEditingLocked = (!!scheduledLaunchAt || isActuallyLive) && !isRejected;

  // Collapse details section when editing becomes locked
  useEffect(() => {
    if (isEditingLocked) {
      setDetailsOpen(false);
    }
  }, [isEditingLocked]);

  return (
    <div className="space-y-4">
      {/* Action Bar with Save Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
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
          {/* Save Button - Primary action (hidden when editing is locked) */}
          {!isEditingLocked && (
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
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

      {/* Editing Locked Info */}
      {isEditingLocked && (
        <Alert className="border-blue-500/50 bg-blue-500/10">
          <Lock className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            <strong>Product page is locked.</strong>{' '}
            {isApproved 
              ? "Your collection has been approved — only visibility can be changed."
              : "Your launch is scheduled and pending review. You can edit again if your submission is rejected."}
            <span className="block mt-1 text-sm opacity-80">
              Click below to view your saved details.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Rejection Alert - Allow editing again */}
      {isRejected && productPage?.rejection_reason && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Your submission was rejected:</strong> {productPage.rejection_reason}
            <p className="mt-1 text-sm opacity-90">Please update your product page and reschedule your launch.</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Scheduled Launch Info */}
      {isScheduled && !isRejected && (
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

      {/* Collection Visibility (for live or approved scheduled collections) */}
      {(isActuallyLive || (isScheduled && isApproved)) && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <EyeOff className="h-4 w-4 text-primary" />
                Collection Visibility
              </CardTitle>
              <Switch
                id="pause-collection"
                checked={isHidden}
                onCheckedChange={handleToggleHidden}
                disabled={isSaving}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              When paused, your collection won't appear in the marketplace
            </p>
          </CardContent>
        </Card>
      )}

      {/* Collapsible wrapper for editable content when locked */}
      <Collapsible 
        open={!isEditingLocked ? true : detailsOpen} 
        onOpenChange={isEditingLocked ? setDetailsOpen : undefined}
      >
        {isEditingLocked && (
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                View Product Page Details
              </span>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
        )}
        <CollapsibleContent className={cn(isEditingLocked && "pt-3")}>
          <div className="space-y-4">
      {/* Collection Settings - Type & Content */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <Palette className="h-4 w-4 text-primary" />
            Collection Settings
          </CardTitle>
          <CardDescription className="text-xs">
            Choose collection type and configure display settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Collection Type Toggle */}
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => !isEditingLocked && setCollectionType('generative')}
              disabled={isEditingLocked}
              className={cn(
                "relative flex items-center gap-2 rounded-lg border-2 p-2.5 text-left transition-all",
                collectionType === 'generative' 
                  ? "border-primary bg-primary/5" 
                  : "border-muted",
                isEditingLocked ? "opacity-60 cursor-not-allowed" : "hover:bg-accent/50"
              )}
            >
              <Layers className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-sm">Generative</span>
              </div>
              {collectionType === 'generative' && (
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
              )}
            </button>
            
            <button
              type="button"
              onClick={() => !isEditingLocked && setCollectionType('art_collection')}
              disabled={isEditingLocked}
              className={cn(
                "relative flex items-center gap-2 rounded-lg border-2 p-2.5 text-left transition-all",
                collectionType === 'art_collection' 
                  ? "border-primary bg-primary/5" 
                  : "border-muted",
                isEditingLocked ? "opacity-60 cursor-not-allowed" : "hover:bg-accent/50"
              )}
            >
              <Palette className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-sm">Art Collection</span>
              </div>
              {collectionType === 'art_collection' && (
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
              )}
            </button>
          </div>

          <Separator />

          {/* Preview Characters (for Generative Collections) - Compact */}
          {collectionType === 'generative' && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Preview Characters <span className="text-muted-foreground font-normal text-xs">(up to 3)</span>
              </Label>
              <div className="flex gap-2">
                {[0, 1, 2].map((index) => {
                  const previewImage = previewImages[index];
                  return (
                    <div key={index} className="relative">
                      {previewImage?.image_url ? (
                        <div className="relative h-16 w-16 rounded-lg border overflow-hidden">
                          <img 
                            src={previewImage.image_url} 
                            alt={`Preview ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute right-0.5 top-0.5 h-4 w-4"
                            onClick={() => {
                              const newImages = [...previewImages];
                              newImages.splice(index, 1);
                              setPreviewImages(newImages);
                            }}
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-primary/50",
                            "border-muted-foreground/25"
                          )}
                          onClick={async () => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = async (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                const url = await uploadImage.mutateAsync({ 
                                  projectId, 
                                  file, 
                                  type: 'preview' as 'banner' | 'logo' | 'founder' | 'portfolio'
                                });
                                const newImages = [...previewImages];
                                newImages[index] = {
                                  id: crypto.randomUUID(),
                                  image_url: url,
                                };
                                setPreviewImages(newImages);
                              }
                            };
                            input.click();
                          }}
                        >
                          {uploadImage.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Upload className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Artworks Management (for Art Collections) */}
          {collectionType === 'art_collection' && (
            <div className="space-y-4">
              <Label className="text-sm font-medium">
                Your Artworks <span className="text-muted-foreground font-normal">(add artworks with edition counts)</span>
              </Label>
              
              {artworks.map((artwork, index) => (
                <div key={artwork.id} className="relative rounded-lg border p-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => {
                      const newArtworks = artworks.filter((_, i) => i !== index);
                      setArtworks(newArtworks);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                    {/* Artwork Image */}
                    <div>
                      {artwork.image_url ? (
                        <div className="relative aspect-square rounded-lg border overflow-hidden">
                          <img 
                            src={artwork.image_url} 
                            alt={artwork.title || 'Artwork'}
                            className="h-full w-full object-cover"
                          />
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute right-1 top-1 h-5 w-5"
                            onClick={() => {
                              const newArtworks = [...artworks];
                              newArtworks[index] = { ...artwork, image_url: '' };
                              setArtworks(newArtworks);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <ArtworkImageDropzone
                          onUpload={async (file) => {
                            const url = await uploadImage.mutateAsync({ 
                              projectId, 
                              file, 
                              type: 'portfolio' as 'banner' | 'logo' | 'founder' | 'portfolio'
                            });
                            const newArtworks = [...artworks];
                            newArtworks[index] = { ...artwork, image_url: url };
                            setArtworks(newArtworks);
                          }}
                          isUploading={uploadImage.isPending}
                        />
                      )}
                    </div>
                    
                    {/* Artwork Details */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-sm">Title *</Label>
                        <Input
                          value={artwork.title}
                          onChange={(e) => {
                            const newArtworks = [...artworks];
                            newArtworks[index] = { ...artwork, title: e.target.value };
                            setArtworks(newArtworks);
                          }}
                          placeholder="Artwork title"
                        />
                      </div>
                      <div className="space-y-1">
                          <Label className="text-sm">Editions</Label>
                          <Input
                            type="number"
                            min="1"
                            value={artwork.edition_count}
                            onChange={(e) => {
                              const newArtworks = [...artworks];
                              newArtworks[index] = { ...artwork, edition_count: parseInt(e.target.value) || 1 };
                              setArtworks(newArtworks);
                            }}
                            placeholder="1"
                          />
                        </div>
                      <div className="space-y-1">
                        <Label className="text-sm">Description</Label>
                        <Textarea
                          value={artwork.description ?? ''}
                          onChange={(e) => {
                            const newArtworks = [...artworks];
                            newArtworks[index] = { ...artwork, description: e.target.value };
                            setArtworks(newArtworks);
                          }}
                          placeholder="Brief description..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setArtworks([
                    ...artworks,
                    {
                      id: crypto.randomUUID(),
                      image_url: '',
                      title: '',
                      edition_count: 1,
                    },
                  ]);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Artwork
              </Button>
            </div>
          )}

          <Separator />

          {/* Editions (read-only) + Secondary Market */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Editions
              </Label>
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted">
                <span className="text-sm font-medium">{editions}</span>
                {editions === 1 ? (
                  <Badge variant="outline" className="text-xs">1/1 Unique</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">{editions} copies each</Badge>
                )}
                <Lock className="h-3 w-3 text-muted-foreground ml-auto" />
              </div>
              <p className="text-xs text-muted-foreground">
                Set in Publish tab. Each unique piece has {editions} edition{editions !== 1 ? 's' : ''}.
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
                  if (isEditingLocked) return;
                  setSecondaryMarketUrl(e.target.value);
                  if (secondaryMarketError) validateSecondaryMarketUrl(e.target.value);
                }}
                onBlur={() => validateSecondaryMarketUrl(secondaryMarketUrl)}
                placeholder="https://jpg.store/collection/..."
                disabled={isEditingLocked}
                className={cn(secondaryMarketError && "border-destructive", isEditingLocked && "bg-muted cursor-not-allowed")}
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
                disabled={isEditingLocked || isHidden}
              />
            </div>
            {isHidden && (
              <p className="text-xs text-muted-foreground italic">
                Buy button is disabled while collection is hidden
              </p>
            )}

            {buyButtonEnabled && (
              <div className="grid gap-4 md:grid-cols-2 pl-6 border-l-2 border-primary/20">
                <div className="space-y-2">
                  <Label htmlFor="buy-button-text">Button Text</Label>
                  <Input
                    id="buy-button-text"
                    value={buyButtonText}
                    onChange={(e) => !isEditingLocked && setBuyButtonText(e.target.value)}
                    placeholder="Mint Now"
                    maxLength={30}
                    disabled={isEditingLocked}
                    className={cn(isEditingLocked && "bg-muted cursor-not-allowed")}
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <ImageIcon className="h-4 w-4 text-primary" />
            Branding & Identity
          </CardTitle>
          <CardDescription className="text-xs">
            Visual identity and social presence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Banner + Logo side by side */}
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            {/* Banner */}
            <div className="space-y-1">
              <Label className="text-sm">Banner <span className="text-xs text-muted-foreground">(1200×400)</span></Label>
              {bannerUrl ? (
                <div className="relative">
                  <img 
                    src={bannerUrl} 
                    alt="Banner preview" 
                    className="h-20 w-full rounded-lg border object-cover"
                  />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute right-1 top-1 h-5 w-5"
                    onClick={clearBanner}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div
                  {...(isEditingLocked ? {} : getBannerRootProps())}
                  className={cn(
                    "flex h-20 flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                    isEditingLocked 
                      ? "bg-muted cursor-not-allowed border-muted" 
                      : isBannerDragActive ? "border-primary bg-primary/5 cursor-pointer" : "border-muted-foreground/25 hover:border-primary/50 cursor-pointer"
                  )}
                >
                  {!isEditingLocked && <input {...getBannerInputProps()} />}
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mt-0.5">{isEditingLocked ? 'Locked' : 'Drop or click'}</p>
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
                    className="h-16 w-16 rounded-lg border object-cover"
                  />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute -right-1 -top-1 h-4 w-4"
                    onClick={clearLogo}
                  >
                    <X className="h-2.5 w-2.5" />
                  </Button>
                </div>
              ) : (
                <div
                  {...(isEditingLocked ? {} : getLogoRootProps())}
                  className={cn(
                    "flex h-16 w-16 flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                    isEditingLocked 
                      ? "bg-muted cursor-not-allowed border-muted" 
                      : isLogoDragActive ? "border-primary bg-primary/5 cursor-pointer" : "border-muted-foreground/25 hover:border-primary/50 cursor-pointer"
                  )}
                >
                  {!isEditingLocked && <input {...getLogoInputProps()} />}
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Tagline + Social Links on same row */}
          <div className="grid gap-3 md:grid-cols-[1fr_2fr]">
            {/* Tagline */}
            <div className="space-y-1">
              <Label htmlFor="tagline" className="text-sm">Tagline</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => !isEditingLocked && setTagline(e.target.value)}
                placeholder="Short catchy tagline"
                maxLength={100}
                disabled={isEditingLocked}
                className={cn(isEditingLocked && "bg-muted cursor-not-allowed")}
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
                      if (isEditingLocked) return;
                      setTwitterUrl(e.target.value);
                      if (twitterError) validateTwitterUrl(e.target.value);
                    }}
                    onBlur={() => validateTwitterUrl(twitterUrl)}
                    placeholder="Twitter/X URL"
                    disabled={isEditingLocked}
                    className={cn("pl-7", twitterError && "border-destructive", isEditingLocked && "bg-muted cursor-not-allowed")}
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
                      if (isEditingLocked) return;
                      setDiscordUrl(e.target.value);
                      if (discordError) validateDiscordUrl(e.target.value);
                    }}
                    onBlur={() => validateDiscordUrl(discordUrl)}
                    placeholder="Discord URL"
                    disabled={isEditingLocked}
                    className={cn("pl-7", discordError && "border-destructive", isEditingLocked && "bg-muted cursor-not-allowed")}
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
                      if (isEditingLocked) return;
                      setWebsiteUrl(e.target.value);
                      if (websiteError) validateWebsiteUrl(e.target.value);
                    }}
                    onBlur={() => validateWebsiteUrl(websiteUrl)}
                    placeholder="Website URL"
                    disabled={isEditingLocked}
                    className={cn("pl-7", websiteError && "border-destructive", isEditingLocked && "bg-muted cursor-not-allowed")}
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
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 font-display text-base">
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              {/* Founder PFP */}
              <div className="space-y-1.5">
                <Label className="text-sm">Profile Picture</Label>
                {founderPfpUrl ? (
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <img 
                        src={founderPfpUrl} 
                        alt="Founder PFP" 
                        className="h-16 w-16 rounded-full border object-cover"
                      />
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute -right-1 -top-1 h-4 w-4"
                        onClick={clearFounderPfp}
                      >
                        <X className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    {...(isEditingLocked ? {} : getFounderPfpRootProps())}
                    className={cn(
                      "flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 border-dashed transition-colors",
                      isEditingLocked 
                        ? "bg-muted cursor-not-allowed border-muted" 
                        : isFounderPfpDragActive ? "border-primary bg-primary/5 cursor-pointer" : "border-muted-foreground/25 hover:border-primary/50 cursor-pointer"
                    )}
                  >
                    {!isEditingLocked && <input {...getFounderPfpInputProps()} />}
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Founder Name */}
              <div className="space-y-1.5">
                <Label htmlFor="founder-name" className="flex items-center gap-2 text-sm">
                  Name
                  {(isVerifiedCreator || isEditingLocked) && (
                    <Badge variant="outline" className="text-xs">Locked</Badge>
                  )}
                </Label>
                <Input
                  id="founder-name"
                  value={isVerifiedCreator ? (profile?.display_name || founderName) : founderName}
                  onChange={(e) => !isVerifiedCreator && !isEditingLocked && setFounderName(e.target.value)}
                  placeholder="Your name or alias"
                  disabled={isVerifiedCreator || isEditingLocked}
                  className={cn("h-9", (isVerifiedCreator || isEditingLocked) && "bg-muted cursor-not-allowed")}
                />
              </div>

              {/* Founder Twitter */}
              <div className="space-y-1.5">
                <Label htmlFor="founder-twitter" className="flex items-center gap-2 text-sm">
                  <Twitter className="h-3 w-3" />
                  Twitter
                  {(isVerifiedCreator || isEditingLocked) && (
                    <Badge variant="outline" className="text-xs">Locked</Badge>
                  )}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <Input
                    id="founder-twitter"
                    value={isVerifiedCreator ? (profile?.twitter_handle || founderTwitter) : founderTwitter}
                    onChange={(e) => !isVerifiedCreator && !isEditingLocked && setFounderTwitter(e.target.value.replace('@', ''))}
                    placeholder="handle"
                    className={cn("pl-7 h-9", (isVerifiedCreator || isEditingLocked) && "bg-muted cursor-not-allowed")}
                    disabled={isVerifiedCreator || isEditingLocked}
                  />
                </div>
              </div>
            </div>

            {/* Founder Bio */}
            <div className="space-y-1.5">
              <Label htmlFor="founder-bio" className="flex items-center gap-2 text-sm">
                Bio
                {isEditingLocked && (
                  <Badge variant="outline" className="text-xs">Locked</Badge>
                )}
              </Label>
              <Textarea
                id="founder-bio"
                value={founderBio}
                onChange={(e) => !isEditingLocked && setFounderBio(e.target.value)}
                placeholder="Tell collectors about yourself..."
                rows={6}
                maxLength={500}
                disabled={isEditingLocked}
                className={cn(isEditingLocked && "bg-muted cursor-not-allowed")}
              />
              <p className="text-xs text-muted-foreground">
                {founderBio.length}/500
              </p>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Section 4: Your AnonForge Collections (Auto-populated) */}
      {creatorCollections && creatorCollections.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Rocket className="h-4 w-4 text-primary" />
              Your AnonForge Collections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          </div>
        </CollapsibleContent>
      </Collapsible>

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
