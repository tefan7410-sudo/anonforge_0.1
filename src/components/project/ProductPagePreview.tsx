import { ProductPage } from '@/hooks/use-product-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Twitter, 
  MessageCircle, 
  Globe, 
  ExternalLink,
  ShoppingCart,
  BadgeCheck,
  Store,
  Copy,
  Clock,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CountdownTimer } from '@/components/CountdownTimer';

interface CreatorCollection {
  id: string;
  name: string;
  banner_url: string | null;
  logo_url: string | null;
}

interface ProductPagePreviewProps {
  productPage: ProductPage;
  projectName: string;
  projectId: string;
  paymentLink?: string | null;
  nmkrPolicyId?: string | null;
  priceInLovelace?: number | null;
  founderVerified?: boolean;
  isVerifiedCreator?: boolean;
  creatorCollections?: CreatorCollection[];
  onClose: () => void;
}

export function ProductPagePreview({ 
  productPage, 
  projectName, 
  projectId,
  paymentLink,
  nmkrPolicyId,
  priceInLovelace,
  founderVerified = false,
  isVerifiedCreator = false,
  creatorCollections,
  onClose 
}: ProductPagePreviewProps) {
  // Show verified badge if either the collection has founder_verified OR the creator is a verified creator
  const showVerifiedBadge = founderVerified || isVerifiedCreator;
  const copyPolicyId = () => {
    if (nmkrPolicyId) {
      navigator.clipboard.writeText(nmkrPolicyId);
      toast.success('Policy ID copied!');
    }
  };

  const copyCollectionLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/collection/${projectId}`);
    toast.success('Link copied!');
  };

  const isScheduled = productPage.scheduled_launch_at && 
    new Date(productPage.scheduled_launch_at) > new Date();

  // Format price from lovelace to ADA
  const formatPrice = (lovelace: number) => {
    const ada = lovelace / 1_000_000;
    return `${ada.toLocaleString()} ₳`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto">
      {/* Header with close and share */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur"
          onClick={copyCollectionLink}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy Link
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-background/80 backdrop-blur"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Banner */}
      <div className="relative h-64 md:h-80 w-full bg-gradient-to-br from-primary/20 to-primary/5">
        {productPage.banner_url && (
          <img
            src={productPage.banner_url}
            alt="Banner"
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Main content */}
      <div className="relative -mt-20 mx-auto max-w-4xl px-4 pb-12">
        {/* Logo & Title */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4 mb-8">
          {productPage.logo_url ? (
            <img
              src={productPage.logo_url}
              alt="Logo"
              className="h-32 w-32 rounded-xl border-4 border-background shadow-lg object-cover"
            />
          ) : (
            <div className="h-32 w-32 rounded-xl border-4 border-background shadow-lg bg-muted flex items-center justify-center">
              <span className="text-3xl font-bold text-muted-foreground">
                {projectName.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-display font-bold">{projectName}</h1>
            {productPage.tagline && (
              <p className="mt-2 text-lg text-muted-foreground">{productPage.tagline}</p>
            )}
          </div>
        </div>

        {/* Preview Characters (for Generative Collections) */}
        {productPage.collection_type === 'generative' && productPage.preview_images && productPage.preview_images.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-display font-semibold mb-4">Preview Characters</h2>
            <div className="grid grid-cols-3 gap-4">
              {productPage.preview_images.map((preview, index) => (
                <div key={preview.id || index} className="space-y-2">
                  <div className="aspect-square rounded-xl border overflow-hidden bg-muted">
                    <img
                      src={preview.image_url}
                      alt={preview.caption || `Preview ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {preview.caption && (
                    <p className="text-sm text-center text-muted-foreground">{preview.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Artworks Gallery (for Art Collections) */}
        {productPage.collection_type === 'art_collection' && productPage.artworks && productPage.artworks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-display font-semibold mb-4">
              <Palette className="inline-block h-5 w-5 mr-2 text-primary" />
              Artworks in this Collection
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {productPage.artworks.map((artwork, index) => (
                <div 
                  key={artwork.id || index} 
                  className="group rounded-xl border bg-card overflow-hidden transition-all hover:shadow-lg"
                >
                  {artwork.image_url && (
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={artwork.image_url}
                        alt={artwork.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold">{artwork.title}</h3>
                    {artwork.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{artwork.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <Badge variant="secondary">
                        {artwork.edition_count} editions
                      </Badge>
                      {artwork.price_in_lovelace && (
                        <span className="text-sm font-medium text-primary">
                          {(artwork.price_in_lovelace / 1_000_000).toLocaleString()} ₳
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hero Action Card - Price & Mint Button */}
        {(priceInLovelace || (productPage.buy_button_enabled && paymentLink)) && !isScheduled && (
          <div className="mb-8 p-6 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {priceInLovelace && (
                <div className="text-center sm:text-left">
                  <p className="text-sm text-muted-foreground">Mint Price</p>
                  <p className="text-3xl font-bold text-primary">{formatPrice(priceInLovelace)}</p>
                </div>
              )}
              {productPage.buy_button_enabled && paymentLink && (
                <Button asChild size="lg" className="w-full sm:w-auto text-lg px-8">
                  <a href={paymentLink} target="_blank" rel="noopener noreferrer">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {productPage.buy_button_text || 'Mint Now'}
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Collection Stats */}
        {(productPage.max_supply || nmkrPolicyId) && (
          <div className="flex flex-wrap gap-4 mb-8 p-4 rounded-xl border bg-card">
            {productPage.max_supply && (
              <div className="text-center">
                <p className="text-2xl font-bold">{productPage.max_supply.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Max Supply</p>
              </div>
            )}
            {nmkrPolicyId && (
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Policy ID</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono truncate flex-1">{nmkrPolicyId}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={copyPolicyId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Social Links */}
        {(productPage.twitter_url || productPage.discord_url || productPage.website_url || productPage.secondary_market_url) && (
          <div className="flex flex-wrap gap-2 mb-8">
            {productPage.twitter_url && (
              <Button asChild variant="outline" size="sm">
                <a href={productPage.twitter_url} target="_blank" rel="noopener noreferrer">
                  <Twitter className="mr-2 h-4 w-4" />
                  Twitter
                </a>
              </Button>
            )}
            {productPage.discord_url && (
              <Button asChild variant="outline" size="sm">
                <a href={productPage.discord_url} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Discord
                </a>
              </Button>
            )}
            {productPage.website_url && (
              <Button asChild variant="outline" size="sm">
                <a href={productPage.website_url} target="_blank" rel="noopener noreferrer">
                  <Globe className="mr-2 h-4 w-4" />
                  Website
                </a>
              </Button>
            )}
            {productPage.secondary_market_url && (
              <Button asChild variant="outline" size="sm">
                <a href={productPage.secondary_market_url} target="_blank" rel="noopener noreferrer">
                  <Store className="mr-2 h-4 w-4" />
                  Secondary Market
                </a>
              </Button>
            )}
          </div>
        )}

        {/* Scheduled Launch Countdown */}
        {isScheduled && (
          <div className="mb-8 p-4 rounded-xl border bg-primary/5 border-primary/20">
            <CountdownTimer targetDate={new Date(productPage.scheduled_launch_at!)} />
            <p className="mt-2 text-sm text-muted-foreground">
              This collection will be available for minting soon!
            </p>
          </div>
        )}

        {/* Founder Section */}
        {(productPage.founder_name || productPage.founder_bio) && (
          <div className="rounded-xl border bg-card p-6 mb-8">
            <h2 className="text-xl font-display font-semibold mb-4">About the Creator</h2>
            <div className="flex items-start gap-4">
              {productPage.founder_pfp_url ? (
                <img
                  src={productPage.founder_pfp_url}
                  alt="Creator"
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xl font-bold text-muted-foreground">
                    {(productPage.founder_name || 'A').charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{productPage.founder_name || 'Anonymous'}</h3>
                  {showVerifiedBadge && (
                    <span title="Verified Creator">
                      <BadgeCheck className="h-5 w-5 text-primary" />
                    </span>
                  )}
                  {productPage.founder_twitter && (
                    <a 
                      href={`https://twitter.com/${productPage.founder_twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                  )}
                </div>
                {productPage.founder_bio && (
                  <p className="mt-2 text-muted-foreground">{productPage.founder_bio}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* More from this Creator */}
        {creatorCollections && creatorCollections.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-display font-semibold mb-4">More from this Creator</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {creatorCollections.map((collection) => (
                <div
                  key={collection.id}
                  className={cn(
                    "group rounded-xl border bg-card overflow-hidden"
                  )}
                >
                  <div className="relative h-24 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                    {collection.banner_url ? (
                      <img
                        src={collection.banner_url}
                        alt={collection.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Store className="h-6 w-6 text-muted-foreground/30" />
                      </div>
                    )}
                    {collection.logo_url && (
                      <div className="absolute -bottom-4 left-3">
                        <img
                          src={collection.logo_url}
                          alt={collection.name}
                          className="h-10 w-10 rounded-lg border-2 border-background object-cover shadow-md"
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-4 pt-6">
                    <h3 className="font-semibold truncate">{collection.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio Section (Past Work) */}
        {productPage.portfolio && productPage.portfolio.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-display font-semibold mb-4">Past Work</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {productPage.portfolio.map((item) => (
                <a
                  key={item.id}
                  href={item.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "group rounded-xl border bg-card overflow-hidden transition-all hover:shadow-lg",
                    item.link && "hover:border-primary"
                  )}
                >
                  {item.image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold truncate">{item.title}</h3>
                      {item.link && (
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    {item.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Powered by AnonForge</p>
        </div>
      </div>
    </div>
  );
}
