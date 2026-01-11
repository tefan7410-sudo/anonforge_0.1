import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, ArrowRight, Store, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketingPreviewModalProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  tagline?: string;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
}

export function MarketingPreviewModal({
  open,
  onClose,
  projectName,
  tagline,
  logoUrl,
  heroImageUrl,
}: MarketingPreviewModalProps) {
  const displayTagline = tagline || 'Minting Now!';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-base font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Marketing Preview
          </DialogTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto">
          {/* Simulated Marquee Banner */}
          <div className="bg-gradient-to-r from-primary via-primary/90 to-primary">
            <div className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground/80" />
              <span className="font-medium">Featured:</span>
              <span>{projectName}</span>
              <span className="text-primary-foreground/60">|</span>
              <span className="text-primary-foreground/90">{displayTagline}</span>
              <span className="text-primary-foreground/80">→</span>
            </div>
          </div>

          {/* Simulated Hero Section */}
          <div className="relative h-40 bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden">
            {heroImageUrl ? (
              <>
                <img
                  src={heroImageUrl}
                  alt="Hero background"
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_70%)]" />
            )}
            <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
              <p className="text-xs text-muted-foreground mb-1">Homepage Hero Section</p>
              <h2 className="font-display text-2xl font-bold">Create. Mint. Sell.</h2>
              <p className="text-sm text-muted-foreground mt-1">Your custom hero image appears here</p>
            </div>
          </div>

          {/* Simulated Featured Spotlight Card */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Featured Collection Card (Homepage & Marketplace)</span>
            </div>

            <Card className={cn(
              "group relative overflow-hidden border-2 border-primary/50",
              "bg-gradient-to-br from-primary/10 via-transparent to-transparent"
            )}>
              {/* Background Image */}
              {heroImageUrl && (
                <div className="absolute inset-0 opacity-20">
                  <img
                    src={heroImageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
                </div>
              )}

              <CardContent className="relative flex items-center gap-4 p-4">
                {/* Logo */}
                <div className="shrink-0">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={projectName}
                      className="h-16 w-16 rounded-xl border-2 border-primary/30 object-cover shadow-lg"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-primary/30 bg-primary/10">
                      <Store className="h-6 w-6 text-primary" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Badge className="mb-1.5 gap-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
                    <Sparkles className="h-2.5 w-2.5" />
                    FEATURED
                  </Badge>
                  <h4 className="font-display text-lg font-bold">
                    {projectName}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {displayTagline}
                  </p>
                </div>

                {/* CTA */}
                <Button 
                  variant="outline" 
                  size="sm"
                  className="shrink-0 border-primary/50 text-primary hover:bg-primary/10"
                >
                  View
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Info Footer */}
          <div className="px-4 pb-4">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">
                This is how your collection will appear across the platform when the spotlight is active.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
