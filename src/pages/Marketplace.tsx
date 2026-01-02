import { Link } from 'react-router-dom';
import { useMarketplaceCollections } from '@/components/MarketplaceSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Layers, Store, ExternalLink, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

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

function CollectionCard({ collection }: { collection: LiveCollection }) {
  return (
    <Link to={`/collection/${collection.project_id}`}>
      <Card className="group cursor-pointer overflow-hidden border-border/50 transition-all hover:border-primary/30 hover:shadow-lg">
        {/* Banner */}
        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
          {collection.banner_url ? (
            <img
              src={collection.banner_url}
              alt={`${collection.project.name} banner`}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Store className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Logo overlay */}
          {collection.logo_url && (
            <div className="absolute -bottom-6 left-4">
              <img
                src={collection.logo_url}
                alt={`${collection.project.name} logo`}
                className="h-16 w-16 rounded-xl border-2 border-background object-cover shadow-lg"
              />
            </div>
          )}
          
          {/* Live badge */}
          <Badge 
            className="absolute right-3 top-3 bg-green-500/90 text-white hover:bg-green-500"
          >
            <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-white" />
            LIVE
          </Badge>
        </div>

        <CardContent className="pt-8">
          <h3 className="font-display text-xl font-semibold group-hover:text-primary transition-colors">
            {collection.project.name}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {collection.tagline || collection.project.description || 'Explore this collection'}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">View Collection</span>
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
      <Skeleton className="h-40 w-full" />
      <CardContent className="pt-8">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
        <Skeleton className="mt-4 h-4 w-28" />
      </CardContent>
    </Card>
  );
}

export default function Marketplace() {
  const { data: collections, isLoading } = useMarketplaceCollections();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <nav className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" aria-label="AnonForge home">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Layers className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="font-display text-xl font-semibold">AnonForge</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2">
            <Store className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">
            Marketplace
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Discover and mint NFTs from creators on AnonForge
          </p>
        </div>

        {/* Collections Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <CollectionCardSkeleton key={i} />
            ))}
          </div>
        ) : collections && collections.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 py-24">
            <Store className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <h2 className="font-display text-xl font-medium">No live collections yet</h2>
            <p className="mt-2 text-muted-foreground">
              Check back soon for new drops from creators
            </p>
            <Button asChild className="mt-6">
              <Link to="/register">Become a Creator</Link>
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-auto">
        <div className="container mx-auto flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Layers className="h-4 w-4" aria-hidden="true" />
            <span>AnonForge</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
