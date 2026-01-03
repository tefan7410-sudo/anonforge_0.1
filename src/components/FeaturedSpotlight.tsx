import { Link } from 'react-router-dom';
import { useActiveMarketing } from '@/hooks/use-marketing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, ArrowRight, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeaturedSpotlightProps {
  className?: string;
}

export function FeaturedSpotlight({ className }: FeaturedSpotlightProps) {
  const { data: activeMarketing, isLoading } = useActiveMarketing();

  if (isLoading) {
    return (
      <div className={cn("mb-8", className)}>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!activeMarketing) return null;

  const productPage = activeMarketing.product_page;

  return (
    <div className={cn("mb-8", className)}>
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <h3 className="font-display text-lg font-semibold">Featured Collection</h3>
      </div>
      
      <Link to={`/collection/${activeMarketing.project_id}`}>
        <Card className="group relative overflow-hidden border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent transition-all hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10">
          {/* Background Image */}
          {activeMarketing.hero_image_url && (
            <div className="absolute inset-0 opacity-20">
              <img
                src={activeMarketing.hero_image_url}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
            </div>
          )}

          <CardContent className="relative flex items-center gap-6 p-6">
            {/* Logo */}
            <div className="shrink-0">
              {productPage?.logo_url ? (
                <img
                  src={productPage.logo_url}
                  alt={activeMarketing.project.name}
                  className="h-20 w-20 rounded-xl border-2 border-amber-500/30 object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-amber-500/30 bg-amber-500/10">
                  <Store className="h-8 w-8 text-amber-500" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <Badge className="mb-2 gap-1 bg-amber-500 text-white hover:bg-amber-600">
                <Sparkles className="h-3 w-3" />
                FEATURED
              </Badge>
              <h4 className="font-display text-xl font-bold group-hover:text-amber-500 transition-colors">
                {activeMarketing.project.name}
              </h4>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {productPage?.tagline || 'Explore this featured collection'}
              </p>
            </div>

            {/* CTA */}
            <Button 
              variant="outline" 
              className="shrink-0 border-amber-500/50 text-amber-600 hover:bg-amber-500/10 hover:text-amber-500"
            >
              View Collection
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
