import { useParams, Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Twitter, 
  MessageCircle, 
  Globe, 
  ExternalLink,
  ShoppingCart,
  ArrowLeft,
  Layers,
  BadgeCheck,
  Copy,
  Store,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExternalLink } from '@/hooks/use-external-link';
import { ExternalLinkWarning } from '@/components/ExternalLinkWarning';
import { MintStatusCard } from '@/components/MintStatusCard';
import { useCreatorCollections } from '@/hooks/use-creator-collections';
import { CountdownTimer } from '@/components/CountdownTimer';
import { toast } from 'sonner';

export default function Collection() {
  const { projectId } = useParams<{ projectId: string }>();
  const externalLink = useExternalLink();

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-collection', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('No project ID');

      // Fetch project info with owner_id
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, name, description, owner_id')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Fetch product page (must be live and not hidden)
      const { data: productPage, error: pageError } = await supabase
        .from('product_pages')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_live', true)
        .eq('is_hidden', false)
        .single();

      if (pageError || !productPage) {
        return null; // Not live or hidden
      }

      // Fetch NMKR project for policy ID
      const { data: nmkrProject } = await supabase
        .from('nmkr_projects')
        .select('nmkr_project_uid, nmkr_policy_id')
        .eq('project_id', projectId)
        .maybeSingle();

      return {
        project,
        productPage,
        nmkrProject,
      };
    },
    enabled: !!projectId,
  });
  
  // Fetch creator's other collections
  const { data: creatorCollections } = useCreatorCollections(data?.project.owner_id, projectId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-80 w-full" />
        <div className="mx-auto max-w-4xl p-4 space-y-4">
          <Skeleton className="h-32 w-32 rounded-xl" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <Navigate to="/not-found" replace />;
  }

  const { project, productPage, nmkrProject } = data;
  const founderVerified = (productPage as { founder_verified?: boolean }).founder_verified;
  const secondaryMarketUrl = (productPage as { secondary_market_url?: string }).secondary_market_url;
  const maxSupply = (productPage as { max_supply?: number }).max_supply;
  const scheduledLaunchAt = (productPage as { scheduled_launch_at?: string }).scheduled_launch_at;
  
  // Check if collection is upcoming (scheduled but not yet launched)
  const isUpcoming = scheduledLaunchAt && new Date(scheduledLaunchAt) > new Date();

  const copyPolicyId = () => {
    if (nmkrProject?.nmkr_policy_id) {
      navigator.clipboard.writeText(nmkrProject.nmkr_policy_id);
      toast.success('Policy ID copied!');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/marketplace">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Marketplace
              </Link>
            </Button>
          </div>
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Layers className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-sm font-semibold hidden sm:inline">AnonForge</span>
          </Link>
        </div>
      </header>

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
                {project.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-display font-bold">{project.name}</h1>
            {productPage.tagline && (
              <p className="mt-2 text-lg text-muted-foreground">{productPage.tagline}</p>
            )}
          </div>
        </div>

        {/* Collection Stats */}
        {(maxSupply || nmkrProject?.nmkr_policy_id) && (
          <div className="flex flex-wrap gap-4 mb-8 p-4 rounded-xl border bg-card">
            {maxSupply && (
              <div className="text-center">
                <p className="text-2xl font-bold">{maxSupply.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Max Supply</p>
              </div>
            )}
            {nmkrProject?.nmkr_policy_id && (
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Policy ID</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono truncate flex-1">{nmkrProject.nmkr_policy_id}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={copyPolicyId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Social Links */}
        {(productPage.twitter_url || productPage.discord_url || productPage.website_url || secondaryMarketUrl) && (
          <div className="flex flex-wrap gap-2 mb-8">
            {productPage.twitter_url && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => externalLink.handleExternalClick(productPage.twitter_url!, e)}
              >
                <Twitter className="mr-2 h-4 w-4" />
                Twitter
              </Button>
            )}
            {productPage.discord_url && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => externalLink.handleExternalClick(productPage.discord_url!, e)}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Discord
              </Button>
            )}
            {productPage.website_url && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => externalLink.handleExternalClick(productPage.website_url!, e)}
              >
                <Globe className="mr-2 h-4 w-4" />
                Website
              </Button>
            )}
            {secondaryMarketUrl && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => externalLink.handleExternalClick(secondaryMarketUrl, e)}
              >
                <Store className="mr-2 h-4 w-4" />
                Secondary Market
              </Button>
            )}
          </div>
        )}

        {/* Mint Status */}
        <MintStatusCard 
          nmkrProjectUid={nmkrProject?.nmkr_project_uid} 
          maxSupply={maxSupply}
        />

        {/* Upcoming Collection Countdown */}
        {isUpcoming && (
          <div className="mb-8 p-6 rounded-xl border bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-display font-semibold">Coming Soon</h3>
            </div>
            <CountdownTimer targetDate={new Date(scheduledLaunchAt!)} />
            <p className="mt-3 text-sm text-muted-foreground">
              This collection will be available for minting soon. Check back later!
            </p>
          </div>
        )}

        {/* Buy Button - Opens directly without warning (NMKR Pay is trusted) */}
        {productPage.buy_button_enabled && productPage.buy_button_link && !isUpcoming && (
          <div className="mb-8">
            <Button 
              size="lg" 
              className="w-full md:w-auto"
              onClick={() => window.open(productPage.buy_button_link!, '_blank', 'noopener,noreferrer')}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {productPage.buy_button_text || 'Mint Now'}
            </Button>
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
                  {founderVerified && (
                    <span title="Verified Creator">
                      <BadgeCheck className="h-5 w-5 text-primary" />
                    </span>
                  )}
                  {productPage.founder_twitter && (
                    <button 
                      onClick={(e) => externalLink.handleExternalClick(`https://twitter.com/${productPage.founder_twitter}`, e)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Twitter className="h-4 w-4" />
                    </button>
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
                <Link
                  key={collection.id}
                  to={`/collection/${collection.id}`}
                  className="group"
                >
                  <Card className="overflow-hidden transition-all hover:shadow-lg hover:border-primary">
                    <div className="relative h-24 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                      {collection.banner_url ? (
                        <img
                          src={collection.banner_url}
                          alt={collection.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
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
                    <CardContent className="pt-6 pb-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                          {collection.name}
                        </h3>
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8 border-t">
          <Link to="/" className="hover:text-primary transition-colors">
            Powered by AnonForge
          </Link>
        </div>
      </div>

      {/* External Link Warning Modal */}
      <ExternalLinkWarning
        isOpen={externalLink.isOpen}
        url={externalLink.pendingUrl}
        dontShowAgain={externalLink.dontShowAgain}
        onContinue={externalLink.handleContinue}
        onCancel={externalLink.handleCancel}
        onToggleDontShowAgain={externalLink.toggleDontShowAgain}
      />
    </div>
  );
}
