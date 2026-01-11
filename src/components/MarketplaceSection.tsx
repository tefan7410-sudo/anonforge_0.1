import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, ArrowRight, ExternalLink, Sparkles, Clock } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { useCollectionStatuses } from '@/hooks/use-collection-status';
import { FeaturedSpotlight } from '@/components/FeaturedSpotlight';
import { CountdownTimer } from '@/components/CountdownTimer';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

interface LiveCollection {
  id: string;
  project_id: string;
  slug: string | null;
  banner_url: string | null;
  logo_url: string | null;
  tagline: string | null;
  scheduled_launch_at: string | null;
  is_featured: boolean | null;
  project: {
    id: string;
    name: string;
    description: string | null;
  };
}

const useMarketplaceCollections = (limit?: number) => {
  return useQuery({
    queryKey: ['marketplace-collections', limit],
    queryFn: async () => {
      let query = supabase
        .from('product_pages')
        .select(`
          id,
          project_id,
          slug,
          banner_url,
          logo_url,
          tagline,
          scheduled_launch_at,
          is_featured,
          project:projects!inner(id, name, description)
        `)
        .eq('is_live', true)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as LiveCollection[];
    },
  });
};

function CollectionCard({ collection, index, isSoldOut, t }: { collection: LiveCollection; index: number; isSoldOut?: boolean; t: (key: string) => string }) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();
  const isFeatured = collection.is_featured;
  const isUpcoming = collection.scheduled_launch_at && 
    new Date(collection.scheduled_launch_at) > new Date();
  
  return (
    <div
      ref={ref}
      className={cn("opacity-0", isVisible && "animate-slide-up")}
      style={{ animationDelay: `${index * 100}ms` }}
    >
    <Link to={`/collection/${collection.slug || collection.project_id}`}>
      <Card className={cn(
        "group cursor-pointer overflow-hidden transition-all hover:shadow-lg",
        isFeatured 
          ? "border-2 border-primary/50 hover:border-primary hover:shadow-primary/10" 
          : "border-border/50 hover:border-primary/30"
      )}>
        {/* Banner wrapper - relative without overflow-hidden to allow logo overlap */}
        <div className="relative">
          {/* Banner image container - overflow-hidden to crop image */}
          <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
            {collection.banner_url ? (
              <img
                src={collection.banner_url}
                alt={`${collection.project.name} banner`}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Store className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}
            
            {/* Status badges */}
            <div className="absolute right-2 top-2 flex flex-col gap-1">
              {isFeatured && (
                <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Sparkles className="mr-1 h-3 w-3" />
                  {t('marketplace.featured')}
                </Badge>
              )}
              {isUpcoming ? (
                <Badge className="bg-primary/90 text-primary-foreground hover:bg-primary">
                  <Clock className="mr-1 h-3 w-3" />
                  {t('marketplace.upcoming')}
                </Badge>
              ) : isSoldOut ? (
                <Badge className="bg-warning/90 text-warning-foreground hover:bg-warning">
                  {t('marketplace.soldOut')}
                </Badge>
              ) : (
                <Badge className="bg-success/90 text-white hover:bg-success">
                  <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  {t('marketplace.live')}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Logo overlay - positioned on outer wrapper to allow overlap */}
          {collection.logo_url && (
            <div className="absolute left-4 bottom-0 translate-y-1/2 z-20">
              <img
                src={collection.logo_url}
                alt={`${collection.project.name} logo`}
                className="h-12 w-12 rounded-lg border-2 border-background object-cover shadow-md"
                loading="lazy"
                decoding="async"
              />
            </div>
          )}
        </div>

        <CardContent className={cn("pt-6", collection.logo_url && "pt-10")}>
          <h3 className="font-display text-lg font-semibold group-hover:text-primary transition-colors">
            {collection.project.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {collection.tagline || collection.project.description || t('marketplace.exploreCollection')}
          </p>
          {isUpcoming && collection.scheduled_launch_at && (
            <div className="mt-2">
              <CountdownTimer targetDate={new Date(collection.scheduled_launch_at)} compact />
            </div>
          )}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('marketplace.viewCollection')}</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
        </CardContent>
      </Card>
    </Link>
    </div>
  );
}

function CollectionCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50">
      <Skeleton className="h-32 w-full" />
      <CardContent className="pt-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-4 w-48" />
        <Skeleton className="mt-4 h-4 w-24" />
      </CardContent>
    </Card>
  );
}

export function MarketplaceSection() {
  const { t } = useTranslations();
  const { data: collections, isLoading } = useMarketplaceCollections(6);
  const headerAnimation = useScrollAnimation<HTMLDivElement>();

  // Get project IDs for status fetching
  const projectIds = useMemo(() => 
    (collections || []).map(c => c.project_id), 
    [collections]
  );
  
  // Fetch NMKR counts for all collections
  const { data: statusMap } = useCollectionStatuses(projectIds);

  const collectionCount = collections?.length || 0;

  return (
    <section className="border-t border-border/50 bg-card/50" aria-labelledby="marketplace-heading">
      <div className="container mx-auto px-6 py-20">
        {/* Featured Spotlight */}
        <FeaturedSpotlight />
        <div 
          ref={headerAnimation.ref}
          className={cn(
            "mb-12 flex flex-col items-center justify-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left opacity-0",
            headerAnimation.isVisible && "animate-slide-up"
          )}
        >
          <div>
            <div className="mb-3 inline-flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium text-primary">{t('marketplace.liveCollections')}</span>
              {!isLoading && collectionCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {collectionCount}
                </span>
              )}
            </div>
            <h2 id="marketplace-heading" className="font-display text-3xl font-bold">
              {t('marketplace.discoverMint')}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t('marketplace.browseCollections')}
            </p>
          </div>
          <Button variant="outline" asChild className="shrink-0">
            <Link to="/marketplace">
              {t('marketplace.viewAll')}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <CollectionCardSkeleton key={i} />
            ))}
          </div>
        ) : collections && collections.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection, index) => (
              <CollectionCard 
                key={collection.id} 
                collection={collection} 
                index={index}
                isSoldOut={statusMap?.[collection.project_id]?.isSoldOut}
                t={t}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Store className="h-12 w-12 mx-auto text-muted-foreground/30" aria-hidden="true" />
            <p className="mt-4 text-muted-foreground">
              {t('marketplace.noCollections')}
            </p>
            <Button className="mt-6" asChild>
              <Link to="/register">{t('marketplace.createCollection')}</Link>
            </Button>
          </div>
        )}

      </div>
    </section>
  );
}

export { useMarketplaceCollections };
