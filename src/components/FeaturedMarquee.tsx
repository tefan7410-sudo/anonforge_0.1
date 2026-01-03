import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useActiveMarketing } from '@/hooks/use-marketing';
import { cn } from '@/lib/utils';

export function FeaturedMarquee() {
  const { data: activeMarketing, isLoading } = useActiveMarketing();

  if (isLoading || !activeMarketing) return null;

  const projectName = activeMarketing.project.name;
  const tagline = activeMarketing.product_page?.tagline || 'Minting Now!';
  
  const content = (
    <>
      <Sparkles className="h-3.5 w-3.5 text-amber-200" />
      <span className="font-medium">Featured:</span>
      <span>{projectName}</span>
      <span className="text-amber-200/80">—</span>
      <span className="text-amber-100/90">{tagline}</span>
      <span className="text-amber-200">→</span>
    </>
  );

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600">
      <Link 
        to={`/collection/${activeMarketing.project_id}`}
        className="block hover:opacity-90 transition-opacity"
      >
        <div className="flex animate-marquee whitespace-nowrap py-2">
          {/* Repeat content multiple times for seamless loop */}
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "flex items-center gap-2 px-8 text-sm text-white",
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
