import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Wallet, Users, Award, Sparkles, ExternalLink, Store, Zap, Menu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { SEOHead } from '@/components/SEOHead';
import { PageTransition } from '@/components/PageTransition';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useArtFundSources, useArtFundSettings, useWalletBalance } from '@/hooks/use-art-fund';
import { useAdaPrice } from '@/hooks/use-ada-price';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  fees: 'hsl(142, 76%, 36%)',
  special_sale: 'hsl(265, 80%, 50%)',
  donation: 'hsl(210, 80%, 50%)',
  other: 'hsl(215, 20%, 65%)',
};

const CATEGORY_LABELS: Record<string, string> = {
  fees: 'Platform Fees',
  special_sale: 'Special Sales',
  donation: 'Donations',
  other: 'Other',
};

function AnimatedSection({ 
  children, 
  className,
  delay = 0 
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  
  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function WalletBalanceDisplay({ balance, isLoading, adaPrice }: { 
  balance: number; 
  isLoading: boolean;
  adaPrice: number | null;
}) {
  const usdValue = adaPrice ? balance * adaPrice : null;

  if (isLoading) {
    return (
      <div className="text-center">
        <Skeleton className="h-16 w-64 mx-auto mb-2" />
        <Skeleton className="h-6 w-32 mx-auto" />
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="font-display text-5xl md:text-7xl font-bold text-primary mb-2">
        {balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        <span className="text-3xl md:text-4xl ml-2 text-primary/80">₳</span>
      </div>
      {usdValue !== null && (
        <p className="text-lg text-muted-foreground">
          ≈ ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
        </p>
      )}
    </div>
  );
}

export default function ArtFund() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: settings, isLoading: settingsLoading } = useArtFundSettings();
  const { data: sources, isLoading: sourcesLoading } = useArtFundSources();
  const { data: walletData, isLoading: balanceLoading } = useWalletBalance(settings?.wallet_address);
  const { data: adaPrice } = useAdaPrice();

  const activeSources = sources?.filter(s => s.is_active) || [];
  const totalAllocated = activeSources.reduce((sum, s) => sum + Number(s.amount_ada), 0);

  // Prepare chart data by category
  const chartData = Object.entries(
    activeSources.reduce((acc, source) => {
      acc[source.category] = (acc[source.category] || 0) + Number(source.amount_ada);
      return acc;
    }, {} as Record<string, number>)
  ).map(([category, amount]) => ({
    name: CATEGORY_LABELS[category] || category,
    value: amount,
    color: CATEGORY_COLORS[category] || CATEGORY_COLORS.other,
  }));

  const useCases = [
    {
      icon: Award,
      title: 'Artist Grants',
      description: 'Direct funding for emerging artists to create and mint their first collections.',
    },
    {
      icon: Users,
      title: 'Commission Support',
      description: 'Subsidizing platform fees for artists who need financial assistance.',
    },
    {
      icon: Sparkles,
      title: 'Community Prizes',
      description: 'Rewards for community events, contests, and collaborative projects.',
    },
  ];

  return (
    <PageTransition>
      <SEOHead
        title="Art Fund - Supporting Indie Artists on Cardano"
        description="The AnonForge Art Fund supports indie artists on Cardano. All profits beyond infrastructure costs go to help creators launch their collections."
        url="/artfund"
        keywords={["art fund", "Cardano artists", "NFT grants", "indie artists", "creator support"]}
      />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
          <nav className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
            <Link to="/" className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary p-1.5">
                <Logo className="h-full w-full" />
              </div>
              <span className="font-display text-lg sm:text-xl font-bold">AnonForge</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground border-muted-foreground/30">BETA</Badge>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link to="/marketplace">Marketplace</Link>
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
                      className="justify-start"
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
                      className="justify-start bg-muted"
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

        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="container relative">
            <AnimatedSection className="text-center max-w-3xl mx-auto">
              <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/10 text-primary">
                <Heart className="h-3 w-3 mr-1" />
                Community Initiative
              </Badge>
              <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6">
                AnonForge Art Fund
              </h1>
              <p className="text-xl text-muted-foreground mb-10">
                {settings?.description || 'Supporting indie artists on Cardano'}
              </p>
              
              <Card className="bg-card/50 backdrop-blur border-primary/20 max-w-md mx-auto">
                <CardContent className="pt-8 pb-6">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
                    <Wallet className="h-5 w-5" />
                    <span className="text-sm">Current Fund Balance</span>
                  </div>
                  <WalletBalanceDisplay 
                    balance={walletData?.balance_ada || 0} 
                    isLoading={settingsLoading || balanceLoading}
                    adaPrice={adaPrice}
                  />
                  {settings?.wallet_address && (
                    <a
                      href={`https://cardanoscan.io/address/${settings.wallet_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-4 transition-colors"
                    >
                      View on Cardanoscan
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            </AnimatedSection>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <AnimatedSection className="max-w-2xl mx-auto text-center">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                Our Commitment
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                At AnonForge, we believe in giving back to the community that makes our platform possible. 
                All profits beyond infrastructure and basic operational costs are directed to this fund, 
                which exists solely to support indie artists on Cardano who are just starting their creative journey.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* Fund Sources Section */}
        {activeSources.length > 0 && (
          <section className="py-16">
            <div className="container">
              <AnimatedSection>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-10">
                  Fund Sources
                </h2>
              </AnimatedSection>

              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Pie Chart */}
                <AnimatedSection delay={100}>
                  <Card className="bg-card/50 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-lg">Distribution by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                              formatter={(value: number) => [`${value.toLocaleString()} ₳`, 'Amount']}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                          No fund sources yet
                        </div>
                      )}
                      <div className="text-center mt-4 pt-4 border-t border-border">
                        <span className="text-sm text-muted-foreground">Total Allocated: </span>
                        <span className="font-semibold text-primary">{totalAllocated.toLocaleString()} ₳</span>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedSection>

                {/* Sources Table */}
                <AnimatedSection delay={200}>
                  <Card className="bg-card/50 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-lg">All Contributions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {sourcesLoading ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-12 w-full" />
                          ))}
                        </div>
                      ) : activeSources.length > 0 ? (
                        <div className="max-h-[300px] overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Source</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {activeSources.map(source => (
                                <TableRow key={source.id}>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{source.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {format(new Date(source.source_date), 'MMM d, yyyy')}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      style={{
                                        borderColor: CATEGORY_COLORS[source.category],
                                        color: CATEGORY_COLORS[source.category],
                                      }}
                                    >
                                      {CATEGORY_LABELS[source.category]}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {Number(source.amount_ada).toLocaleString()} ₳
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                          No contributions recorded yet
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </AnimatedSection>
              </div>
            </div>
          </section>
        )}

        {/* How Funds Will Be Used */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <AnimatedSection>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-10">
                How the Fund Helps Artists
              </h2>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {useCases.map((useCase, index) => (
                <AnimatedSection key={useCase.title} delay={index * 100}>
                  <Card className="bg-card/50 backdrop-blur h-full">
                    <CardContent className="pt-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                        <useCase.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-display text-lg font-semibold mb-2">{useCase.title}</h3>
                      <p className="text-sm text-muted-foreground">{useCase.description}</p>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container">
            <AnimatedSection className="text-center max-w-2xl mx-auto">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                Ready to Create?
              </h2>
              <p className="text-muted-foreground mb-8">
                Join AnonForge and start building your NFT collection. Every collection minted supports indie artists.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/register">Start Creating</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/marketplace">Explore Marketplace</Link>
                </Button>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8">
          <div className="container">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary p-1">
                  <Logo className="h-full w-full" />
                </div>
                <span className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} AnonForge. All rights reserved.
                </span>
              </div>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <Link to="/documentation" className="hover:text-foreground transition-colors">Documentation</Link>
                <Link to="/terms-of-service" className="hover:text-foreground transition-colors">Terms</Link>
                <Link to="/status" className="hover:text-foreground transition-colors">Status</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
