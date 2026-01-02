import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  useProductPage, 
  useUpdateProductPage, 
  useUploadProductImage, 
  useDeleteProductImage,
  type PortfolioItem 
} from '@/hooks/use-product-page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Image as ImageIcon, 
  Upload, 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Loader2,
  Globe,
  Twitter,
  MessageCircle,
  User,
  Briefcase,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductPageTabProps {
  projectId: string;
}

export function ProductPageTab({ projectId }: ProductPageTabProps) {
  const { data: productPage, isLoading } = useProductPage(projectId);
  const updateProductPage = useUpdateProductPage();
  const uploadImage = useUploadProductImage();
  const deleteImage = useDeleteProductImage();

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
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);

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
      setPortfolio(productPage.portfolio || []);
    }
  }, [productPage]);

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

  // Founder PFP upload
  const onFounderPfpDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    const url = await uploadImage.mutateAsync({ projectId, file, type: 'founder' });
    setFounderPfpUrl(url);
  }, [projectId, uploadImage]);

  const { getRootProps: getFounderPfpRootProps, getInputProps: getFounderPfpInputProps, isDragActive: isFounderPfpDragActive } = useDropzone({
    onDrop: onFounderPfpDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
  });

  // Portfolio item management
  const addPortfolioItem = () => {
    setPortfolio([
      ...portfolio,
      { id: Date.now().toString(), title: '', description: '', image_url: '', link: '' },
    ]);
  };

  const updatePortfolioItem = (id: string, field: keyof PortfolioItem, value: string) => {
    setPortfolio(portfolio.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removePortfolioItem = (id: string) => {
    const item = portfolio.find(p => p.id === id);
    if (item?.image_url) {
      deleteImage.mutate(item.image_url);
    }
    setPortfolio(portfolio.filter(item => item.id !== id));
  };

  const uploadPortfolioImage = async (id: string, file: File) => {
    const url = await uploadImage.mutateAsync({ projectId, file, type: 'portfolio' });
    updatePortfolioItem(id, 'image_url', url);
  };

  // Save handler
  const handleSave = async () => {
    await updateProductPage.mutateAsync({
      projectId,
      updates: {
        banner_url: bannerUrl,
        logo_url: logoUrl,
        tagline: tagline || null,
        twitter_url: twitterUrl || null,
        discord_url: discordUrl || null,
        website_url: websiteUrl || null,
        founder_name: founderName || null,
        founder_pfp_url: founderPfpUrl,
        founder_bio: founderBio || null,
        founder_twitter: founderTwitter || null,
        portfolio,
      },
    });
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

  const isSaving = updateProductPage.isPending || uploadImage.isPending;

  return (
    <div className="space-y-6">
      {/* Banner Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <ImageIcon className="h-5 w-5 text-primary" />
            Banner Image
          </CardTitle>
          <CardDescription>
            Recommended size: 1200x400px. This will be displayed at the top of your product page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bannerUrl ? (
            <div className="relative">
              <img 
                src={bannerUrl} 
                alt="Banner preview" 
                className="h-48 w-full rounded-lg border object-cover"
              />
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute right-2 top-2"
                onClick={clearBanner}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              {...getBannerRootProps()}
              className={cn(
                "flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                isBannerDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              )}
            >
              <input {...getBannerInputProps()} />
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isBannerDragActive ? "Drop banner here" : "Drag & drop banner or click to select"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Branding Section */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Branding</CardTitle>
          <CardDescription>
            Your collection logo and tagline
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          {/* Logo */}
          <div className="space-y-2">
            <Label>Collection Logo</Label>
            {logoUrl ? (
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img 
                    src={logoUrl} 
                    alt="Logo preview" 
                    className="h-24 w-24 rounded-lg border object-cover"
                  />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute -right-2 -top-2 h-6 w-6"
                    onClick={clearLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                {...getLogoRootProps()}
                className={cn(
                  "flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                  isLogoDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                )}
              >
                <input {...getLogoInputProps()} />
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Tagline */}
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="A short catchy tagline for your collection"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              {tagline.length}/100 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Globe className="h-5 w-5 text-primary" />
            Social Links
          </CardTitle>
          <CardDescription>
            Connect your social media and website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="twitter-url" className="flex items-center gap-2">
              <Twitter className="h-4 w-4" />
              Twitter/X
            </Label>
            <Input
              id="twitter-url"
              type="url"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              placeholder="https://twitter.com/yourhandle"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discord-url" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Discord
            </Label>
            <Input
              id="discord-url"
              type="url"
              value={discordUrl}
              onChange={(e) => setDiscordUrl(e.target.value)}
              placeholder="https://discord.gg/yourserver"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website-url" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website
            </Label>
            <Input
              id="website-url"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Founder Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <User className="h-5 w-5 text-primary" />
            Founder / Creator
          </CardTitle>
          <CardDescription>
            Introduce yourself to potential collectors
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
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
              <Label htmlFor="founder-name">Name</Label>
              <Input
                id="founder-name"
                value={founderName}
                onChange={(e) => setFounderName(e.target.value)}
                placeholder="Your name or alias"
              />
            </div>

            {/* Founder Twitter */}
            <div className="space-y-2">
              <Label htmlFor="founder-twitter" className="flex items-center gap-2">
                <Twitter className="h-3 w-3" />
                Twitter Handle
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="founder-twitter"
                  value={founderTwitter}
                  onChange={(e) => setFounderTwitter(e.target.value.replace('@', ''))}
                  placeholder="yourhandle"
                  className="pl-7"
                />
              </div>
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
        </CardContent>
      </Card>

      {/* Portfolio Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Briefcase className="h-5 w-5 text-primary" />
            Past Work / Portfolio
          </CardTitle>
          <CardDescription>
            Showcase your previous projects or artwork to build credibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {portfolio.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
              <Briefcase className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No portfolio items yet</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={addPortfolioItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Portfolio Item
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {portfolio.map((item, index) => (
                <div key={item.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium">Item {index + 1}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removePortfolioItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Image */}
                    <div className="space-y-2">
                      <Label>Image</Label>
                      {item.image_url ? (
                        <div className="relative">
                          <img 
                            src={item.image_url} 
                            alt={item.title || 'Portfolio item'} 
                            className="h-24 w-full rounded-lg border object-cover"
                          />
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute right-1 top-1 h-5 w-5"
                            onClick={() => {
                              if (item.image_url) deleteImage.mutate(item.image_url);
                              updatePortfolioItem(item.id, 'image_url', '');
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-primary/50">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadPortfolioImage(item.id, file);
                            }}
                          />
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </label>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-2 md:col-span-2">
                      <Input
                        value={item.title}
                        onChange={(e) => updatePortfolioItem(item.id, 'title', e.target.value)}
                        placeholder="Project title"
                      />
                      <Input
                        value={item.description || ''}
                        onChange={(e) => updatePortfolioItem(item.id, 'description', e.target.value)}
                        placeholder="Brief description"
                      />
                      <div className="relative">
                        <ExternalLink className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="url"
                          value={item.link || ''}
                          onChange={(e) => updatePortfolioItem(item.id, 'link', e.target.value)}
                          placeholder="https://..."
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" className="w-full" onClick={addPortfolioItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Another Item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Product Page
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
