import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, ExternalLink, Clock, Sparkles, Heart, Zap, Menu } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCollectionStatuses } from '@/hooks/use-collection-status';
import { FeaturedSpotlight } from '@/components/FeaturedSpotlight';
import { CountdownTimer } from '@/components/CountdownTimer';
import { PageTransition } from '@/components/PageTransition';
import { SEOHead } from '@/components/SEOHead';
import { LanguageSelector } from '@/components/LanguageSelector';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 12;

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

function useMarketplaceData() {
  return useQuery({
    queryKey: ['marketplace-data-full'],
    queryFn: async () => {
      const { data: collections, error } = await supabase
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

      if (error) throw error;
      
      return (collections || []) as unknown as LiveCollection[];
    },
  });
}

function CollectionCard({ collection, isSoldOut }: { collection: LiveCollection; isSoldOut?: boolean }) {
  const isUpcoming = collection.scheduled_launch_at && 
    new Date(collection.scheduled_launch_at) > new Date();
  const isFeatured = collection.is_featured;

  return (
    <Link to={`/collection/${collection.slug || collection.project_id}`}>
      <Card className={cn(
        "group cursor-pointer overflow-hidden transition-all hover:shadow-lg",
        isFeatured 
          ? "border-2 border-primary/50 hover:border-primary hover:shadow-primary/10" 
          : "border-border/50 hover:border-primary/30"
      )}>
        {/* Banner and Logo wrapper */}
        <div className="relative">
          {/* Banner */}
          <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
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
                <Store className="h-12 w-12 text-muted-foreground/30" />
              </div>
            )}
            
            {/* Status badges */}
            <div className="absolute right-3 top-3 flex flex-col gap-1.5">
              {isFeatured && (
                <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Sparkles className="mr-1 h-3 w-3" />
                  FEATURED
                </Badge>
              )}
              {isUpcoming ? (
                <Badge className="bg-primary/90 text-primary-foreground hover:bg-primary">
                  <Clock className="mr-1 h-3 w-3" />
                  UPCOMING
                </Badge>
              ) : isSoldOut ? (
                <Badge className="bg-orange-500/90 text-white hover:bg-orange-500">
                  SOLD OUT
                </Badge>
              ) : (
                <Badge className="bg-green-500/90 text-white hover:bg-green-500">
                  <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-white" />
                  LIVE
                </Badge>
              )}
            </div>
          </div>
          
          {/* Logo overlay - OUTSIDE overflow-hidden */}
          {collection.logo_url && (
            <div className="absolute left-4 bottom-0 translate-y-1/2 z-20">
              <img
                src={collection.logo_url}
                alt={`${collection.project.name} logo`}
                className="h-16 w-16 rounded-xl border-2 border-background object-cover shadow-lg"
                loading="lazy"
                decoding="async"
              />
            </div>
          )}
        </div>

        <CardContent className={`pt-6 ${collection.logo_url ? 'pt-10' : ''}`}>
          <h3 className="font-display text-xl font-semibold group-hover:text-primary transition-colors">
            {collection.project.name}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {collection.tagline || collection.project.description || 'Explore this collection'}
          </p>
          {isUpcoming && (
            <div className="mt-3">
              <CountdownTimer targetDate={new Date(collection.scheduled_launch_at!)} compact />
            </div>
          )}
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
  const { data: collections, isLoading } = useMarketplaceData();
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming' | 'sold-out'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get project IDs for status fetching
  const projectIds = useMemo(() => 
    (collections || []).map(c => c.project_id), 
    [collections]
  );
  
  // Fetch NMKR counts for all collections
  const { data: statusMap, isLoading: statusLoading } = useCollectionStatuses(projectIds);

  // Filter collections based on selected tab
  const filteredCollections = useMemo(() => {
    if (!collections) return [];
    
    const now = new Date();
    
    return collections.filter(c => {
      const isUpcoming = c.scheduled_launch_at && new Date(c.scheduled_launch_at) > now;
      const status = statusMap?.[c.project_id];
      const isSoldOut = status?.isSoldOut;
      
      if (filter === 'all') return true;
      if (filter === 'upcoming') return isUpcoming;
      if (filter === 'live') return !isUpcoming && !isSoldOut;
      if (filter === 'sold-out') return !isUpcoming && isSoldOut;
      return true;
    });
  }, [collections, filter, statusMap]);

  // Reset to page 1 when filter changes
  useMemo(() => {
    setCurrentPage(1);
  }, [filter]);

  // Pagination calculations
  const totalPages = Math.ceil((filteredCollections?.length || 0) / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCollections = filteredCollections.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const isFullyLoading = isLoading || (statusLoading && projectIds.length > 0);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <PageTransition>
    <SEOHead
      title="NFT Marketplace"
      description="Browse curated NFT collections from independent creators on Cardano. Discover unique digital art and mint directly with NMKR."
      url="/marketplace"
      keywords={['NFT marketplace', 'Cardano NFT', 'digital art', 'NFT collections', 'mint NFT']}
    />
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <nav className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity" aria-label="AnonForge home">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary p-1.5">
              <Logo className="h-full w-full" />
            </div>
            <span className="font-display text-lg sm:text-xl font-bold">AnonForge</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground border-muted-foreground/30">BETA</Badge>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" className="text-primary" asChild>
              <Link to="/marketplace">Marketplace</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/artfund">Art Fund</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/status">Status</Link>
            </Button>
            <LanguageSelector />
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Get started</Link>
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSelector />
            <ThemeToggle />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle>
                    <Link 
                      to="/" 
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary p-1.5">
                        <Logo className="h-full w-full" />
                      </div>
                      AnonForge
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-8 flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    className="justify-start bg-muted text-primary"
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to="/marketplace">
                      <Store className="mr-3 h-4 w-4" />
                      Marketplace
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to="/artfund">
                      <Heart className="mr-3 h-4 w-4" />
                      Art Fund
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to="/status">
                      <Zap className="mr-3 h-4 w-4" />
                      Status
                    </Link>
                  </Button>
                  <div className="my-2 border-t border-border" />
                  <Button
                    variant="ghost"
                    className="justify-start"
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button
                    className="justify-start"
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to="/register">Get started</Link>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8 sm:px-6 sm:py-12">
        {/* Featured Spotlight */}
        <FeaturedSpotlight className="mb-8" />

        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="mb-3 sm:mb-4 inline-flex items-center gap-2">
            <Store className="h-6 w-6 sm:h-8 sm:w-8 text-primary" aria-hidden="true" />
          </div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl lg:text-5xl">
            Marketplace
          </h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground">
            Discover and mint NFTs from creators on AnonForge
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 sm:mb-8 flex justify-center">
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList className="w-max">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="live">Live</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="sold-out" className="whitespace-nowrap">Sold Out</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Collections Grid */}
        {isFullyLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <CollectionCardSkeleton key={i} />
            ))}
          </div>
        ) : paginatedCollections && paginatedCollections.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedCollections.map((collection) => (
                <CollectionCard 
                  key={collection.id} 
                  collection={collection} 
                  isSoldOut={statusMap?.[collection.project_id]?.isSoldOut}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredCollections.length)} of {filteredCollections.length} collections
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {getPageNumbers().map((page, idx) => (
                      <PaginationItem key={idx}>
                        {page === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 py-24">
            <Store className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <h2 className="font-display text-xl font-medium">
              {filter === 'all' ? 'No live collections yet' : `No ${filter === 'live' ? 'live' : 'sold out'} collections`}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {filter === 'all' ? 'Check back soon for new drops from creators' : 'Try changing the filter'}
            </p>
            {filter === 'all' && (
              <Button asChild className="mt-6">
                <Link to="/register">Become a Creator</Link>
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-auto">
        <div className="container mx-auto flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Logo size="sm" />
            <span>AnonForge</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </footer>
    </div>
    </PageTransition>
  );
}
