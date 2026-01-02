import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, ArrowRight, ExternalLink } from 'lucide-react';

interface LiveCollection {
  id: string;
  project_id: string;
  banner_url: string | null;
  logo_url: string | null;
  tagline: string | null;
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
          banner_url,
          logo_url,
          tagline,
          project:projects!inner(id, name, description)
        `)
        .eq('is_live', true)
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

function CollectionCard({ collection }: { collection: LiveCollection }) {
  return (
    <Link to={`/collection/${collection.project_id}`}>
      <Card className="group cursor-pointer overflow-hidden border-border/50 transition-all hover:border-primary/30 hover:shadow-lg">
        {/* Banner */}
        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
          {collection.banner_url ? (
            <img
              src={collection.banner_url}
              alt={`${collection.project.name} banner`}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Store className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Logo overlay */}
          {collection.logo_url && (
            <div className="absolute -bottom-4 left-4">
              <img
                src={collection.logo_url}
                alt={`${collection.project.name} logo`}
                className="h-12 w-12 rounded-lg border-2 border-background object-cover shadow-md"
              />
            </div>
          )}
          
          {/* Live badge */}
          <Badge 
            className="absolute right-2 top-2 bg-green-500/90 text-white hover:bg-green-500"
          >
            <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            LIVE
          </Badge>
        </div>

        <CardContent className="pt-6">
          <h3 className="font-display text-lg font-semibold group-hover:text-primary transition-colors">
            {collection.project.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {collection.tagline || collection.project.description || 'Explore this collection'}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">View Collection</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
        </CardContent>
      </Card>
    </Link>
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
  const { data: collections, isLoading } = useMarketplaceCollections(6);

  return (
    <section className="border-t border-border/50" aria-labelledby="marketplace-heading">
      <div className="container mx-auto px-6 py-20">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" aria-hidden="true" />
            <Badge variant="secondary" className="text-sm">Marketplace</Badge>
          </div>
          <h2 id="marketplace-heading" className="font-display text-3xl font-bold">
            Discover Live Collections
          </h2>
          <p className="mt-4 text-muted-foreground">
            Browse and mint NFTs from creators on AnonForge
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <CollectionCardSkeleton key={i} />
            ))}
          </div>
        ) : collections && collections.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Store className="h-12 w-12 mx-auto text-muted-foreground/30" aria-hidden="true" />
            <p className="mt-4 text-muted-foreground">
              No live collections yet. Be the first to launch!
            </p>
            <Button className="mt-6" asChild>
              <Link to="/register">Create Your Collection</Link>
            </Button>
          </div>
        )}

        <div className="mt-12 text-center">
          <Button size="lg" asChild>
            <Link to="/marketplace">
              Explore Marketplace
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export { useMarketplaceCollections };
