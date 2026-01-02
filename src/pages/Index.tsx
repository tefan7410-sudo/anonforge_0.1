import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Layers, ArrowRight, Sparkles, Palette, Store, Zap, Shield, Users, CreditCard, LayoutGrid, Rocket, Menu, BookOpen } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { MarketplaceSection } from '@/components/MarketplaceSection';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

function AnimatedSection({ 
  children, 
  className,
  delay = 0 
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();
  
  return (
    <div 
      ref={ref}
      className={cn(
        'opacity-0',
        isVisible && 'animate-slide-up',
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Index() {
  const { t } = useTranslations();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroAnimation = useScrollAnimation<HTMLDivElement>();
  const creatorsAnimation = useScrollAnimation<HTMLDivElement>();
  const benefitsAnimation = useScrollAnimation<HTMLDivElement>();
  const ctaAnimation = useScrollAnimation<HTMLDivElement>();

  const creatorFeatures = [
    { icon: Palette, titleKey: 'creators.layerGeneration', descKey: 'creators.layerGenerationDesc' },
    { icon: LayoutGrid, titleKey: 'creators.productPage', descKey: 'creators.productPageDesc' },
    { icon: CreditCard, titleKey: 'creators.nmkrMinting', descKey: 'creators.nmkrMintingDesc' },
    { icon: Users, titleKey: 'creators.teamCollab', descKey: 'creators.teamCollabDesc' },
    { icon: Sparkles, titleKey: 'creators.royalties', descKey: 'creators.royaltiesDesc' },
    { icon: Store, titleKey: 'creators.marketplaceListing', descKey: 'creators.marketplaceListingDesc' },
  ];

  const benefits = [
    { icon: Zap, titleKey: 'benefits.fast', descKey: 'benefits.fastDesc' },
    { icon: Shield, titleKey: 'benefits.secure', descKey: 'benefits.secureDesc' },
    { icon: Users, titleKey: 'benefits.teams', descKey: 'benefits.teamsDesc' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <nav className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4" aria-label="Main navigation">
          <Link to="/" className="flex items-center gap-2 sm:gap-3" aria-label="AnonForge home">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary">
              <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="font-display text-lg sm:text-xl font-bold">AnonForge</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/marketplace">{t('nav.marketplace')}</Link>
            </Button>
            <a href="#for-creators" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {t('nav.forCreators')}
            </a>
            <LanguageSelector />
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link to="/login">{t('nav.signIn')}</Link>
            </Button>
            <Button asChild>
              <Link to="/register">{t('nav.getStarted')}</Link>
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
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <Layers className="h-4 w-4 text-primary-foreground" />
                      </div>
                      AnonForge
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-8 flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    className="justify-start"
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to="/marketplace">
                      <Store className="mr-3 h-4 w-4" />
                      {t('nav.marketplace')}
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <a href="#for-creators">
                      <Palette className="mr-3 h-4 w-4" />
                      {t('nav.forCreators')}
                    </a>
                  </Button>
                  <div className="my-2 border-t border-border" />
                  <Button
                    variant="ghost"
                    className="justify-start"
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to="/login">{t('nav.signIn')}</Link>
                  </Button>
                  <Button
                    className="justify-start"
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to="/register">{t('nav.getStarted')}</Link>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section - Dual Audience */}
        <section className="relative overflow-hidden" aria-labelledby="hero-heading">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div 
            ref={heroAnimation.ref}
            className={cn(
              "container relative mx-auto px-6 py-20 sm:py-28 opacity-0",
              heroAnimation.isVisible && "animate-slide-up"
            )}
          >
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                {t('hero.badge')}
              </div>
              <h1 id="hero-heading" className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                {t('hero.title1')}
                <span className="text-primary"> {t('hero.title2')}</span>
                <br />
                <span className="text-muted-foreground">{t('hero.title3')}</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                {t('hero.description')}
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" asChild className="px-8">
                  <Link to="/marketplace">
                    <Store className="mr-2 h-4 w-4" aria-hidden="true" />
                    {t('hero.exploreMarketplace')}
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/register">
                    {t('hero.startCreating')}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Marketplace Section - Prominent position */}
        <MarketplaceSection />

        {/* For Creators Section */}
        <section id="for-creators" className="border-t border-border/50 bg-muted/30" aria-labelledby="creators-heading">
          <div 
            ref={creatorsAnimation.ref}
            className="container mx-auto px-6 py-20"
          >
            <div className={cn(
              "mb-12 text-center opacity-0",
              creatorsAnimation.isVisible && "animate-slide-up"
            )}>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium">
                <Rocket className="h-4 w-4 text-primary" />
                {t('creators.badge')}
              </div>
              <h2 id="creators-heading" className="font-display text-3xl font-bold sm:text-4xl">
                {t('creators.title')}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                {t('creators.description')}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {creatorFeatures.map((feature, index) => (
                <article 
                  key={feature.titleKey}
                  className={cn(
                    "group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg opacity-0",
                    creatorsAnimation.isVisible && "animate-slide-up"
                  )}
                  style={{ animationDelay: `${(index + 1) * 100}ms` }}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <feature.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{t(feature.titleKey)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t(feature.descKey)}</p>
                </article>
              ))}
            </div>

            {/* Learn More Button */}
            <div className="mt-10 text-center">
              <Button variant="outline" size="lg" asChild>
                <Link to="/documentation">
                  <BookOpen className="mr-2 h-4 w-4" />
                  {t('creators.learnMore')}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Why AnonForge Section */}
        <section className="container mx-auto px-6 py-20" aria-labelledby="benefits-heading">
          <div ref={benefitsAnimation.ref}>
            <h2 
              id="benefits-heading" 
              className={cn(
                "mb-12 text-center font-display text-3xl font-bold opacity-0",
                benefitsAnimation.isVisible && "animate-slide-up"
              )}
            >
              {t('benefits.title')}
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {benefits.map((benefit, index) => (
                <div 
                  key={benefit.titleKey}
                  className={cn(
                    "text-center opacity-0",
                    benefitsAnimation.isVisible && "animate-slide-up"
                  )}
                  style={{ animationDelay: `${(index + 1) * 150}ms` }}
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <benefit.icon className="h-7 w-7 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{t(benefit.titleKey)}</h3>
                  <p className="mt-2 text-muted-foreground">{t(benefit.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border/50 bg-muted/30" aria-labelledby="cta-heading">
          <div 
            ref={ctaAnimation.ref}
            className={cn(
              "container mx-auto px-6 py-20 text-center opacity-0",
              ctaAnimation.isVisible && "animate-slide-up"
            )}
          >
            <h2 id="cta-heading" className="font-display text-3xl font-bold sm:text-4xl">
              {t('cta.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              {t('cta.description')}
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild className="px-8">
                <Link to="/marketplace">
                  <Store className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t('cta.exploreMarketplace')}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/register">
                  {t('cta.createAccount')}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Layers className="h-4 w-4" aria-hidden="true" />
            <span className="font-semibold">AnonForge</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/terms" className="transition-colors hover:text-foreground">{t('footer.terms')}</Link>
            <Link to="/documentation" className="transition-colors hover:text-foreground">{t('footer.documentation')}</Link>
            <Link to="/marketplace" className="transition-colors hover:text-foreground">{t('footer.marketplace')}</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {t('footer.rights')}
          </p>
        </div>
      </footer>
    </div>
  );
}
