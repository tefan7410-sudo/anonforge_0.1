import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useActiveMarketing } from '@/hooks/use-marketing';
import { cn } from '@/lib/utils';

export function FeaturedMarquee() {
  const { data: activeMarketing, isLoading } = useActiveMarketing();

  // Only show when there's active paid marketing
  if (isLoading || !activeMarketing) return null;

  const featuredData = activeMarketing;

  const projectName = featuredData.project.name;
  const tagline = featuredData.product_page?.tagline || 'Minting Now!';
  
  const content = (
    <>
      <Sparkles className="h-3.5 w-3.5 text-primary-foreground/80" />
      <span className="font-medium">Featured:</span>
      <span>{projectName}</span>
      <span className="text-primary-foreground/60">|</span>
      <span className="text-primary-foreground/90">{tagline}</span>
      <span className="text-primary-foreground/80">→</span>
    </>
  );

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary via-primary/90 to-primary">
      <Link 
        to={`/collection/${featuredData.project_id}`}
        className="block hover:opacity-90 transition-opacity"
      >
        <div className="flex animate-marquee whitespace-nowrap py-2">
          {/* Repeat content multiple times for seamless loop */}
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "flex items-center gap-2 px-8 text-sm text-primary-foreground",
              )}
            >
              {content}
            </div>
          ))}
        </div>
      </Link>
    </div>
  );
}
