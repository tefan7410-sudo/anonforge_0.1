import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Twitter, 
  MessageCircle, 
  Globe, 
  ExternalLink,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type PortfolioItem } from '@/hooks/use-product-page';

export default function Collection() {
  const { projectId } = useParams<{ projectId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-collection', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('No project ID');

      // Fetch project info
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Fetch product page (must be live)
      const { data: productPage, error: pageError } = await supabase
        .from('product_pages')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_live', true)
        .single();

      if (pageError || !productPage) {
        return null; // Not live
      }

      return {
        project,
        productPage: {
          ...productPage,
          portfolio: (productPage.portfolio as unknown as PortfolioItem[]) || [],
        },
      };
    },
    enabled: !!projectId,
  });

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

  const { project, productPage } = data;

  return (
    <div className="min-h-screen bg-background">
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

        {/* Social Links */}
        {(productPage.twitter_url || productPage.discord_url || productPage.website_url) && (
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
          </div>
        )}

        {/* Buy Button */}
        {productPage.buy_button_enabled && productPage.buy_button_link && (
          <div className="mb-8">
            <Button asChild size="lg" className="w-full md:w-auto">
              <a href={productPage.buy_button_link} target="_blank" rel="noopener noreferrer">
                <ShoppingCart className="mr-2 h-5 w-5" />
                {productPage.buy_button_text || 'Mint Now'}
              </a>
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

        {/* Portfolio Section */}
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
        <div className="text-center text-sm text-muted-foreground pt-8 border-t">
          <p>Powered by AnonForge</p>
        </div>
      </div>
    </div>
  );
}
