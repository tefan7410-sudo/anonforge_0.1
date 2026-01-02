import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Layers, ArrowRight, Sparkles, Palette, Store, Zap, Shield, Users, CreditCard, LayoutGrid, Rocket } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MarketplaceSection } from '@/components/MarketplaceSection';

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <nav className="container mx-auto flex items-center justify-between px-6 py-4" aria-label="Main navigation">
          <Link to="/" className="flex items-center gap-3" aria-label="AnonForge home">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Layers className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="font-display text-xl font-bold">AnonForge</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" asChild className="hidden md:inline-flex">
              <Link to="/marketplace">Marketplace</Link>
            </Button>
            <a href="#for-creators" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-flex">
              For Creators
            </a>
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

      <main>
        {/* Hero Section - Dual Audience */}
        <section className="relative overflow-hidden" aria-labelledby="hero-heading">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="container relative mx-auto px-6 py-20 sm:py-28">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                NFT Platform on Cardano
              </div>
              <h1 id="hero-heading" className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Discover & mint
                <span className="text-primary"> unique NFTs</span>
                <br />
                <span className="text-muted-foreground">or launch your own collection</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                Browse curated collections from independent creators, or build and launch 
                your own NFT project with built-in minting powered by NMKR.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" asChild className="px-8">
                  <Link to="/marketplace">
                    <Store className="mr-2 h-4 w-4" aria-hidden="true" />
                    Explore Marketplace
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/register">
                    Start Creating
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
          <div className="container mx-auto px-6 py-20">
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium">
                <Rocket className="h-4 w-4 text-primary" />
                For Creators
              </div>
              <h2 id="creators-heading" className="font-display text-3xl font-bold sm:text-4xl">
                Launch your NFT collection in minutes
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Generate art, set up minting, create your product page, and go live — all in one place.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <article className="group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Palette className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-semibold">Layer-Based Generation</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload layers, set rarity weights, and generate thousands of unique 
                  combinations with metadata ready for minting.
                </p>
              </article>

              <article className="group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <LayoutGrid className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-semibold">Product Page Builder</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create a stunning landing page for your drop with custom branding, 
                  banners, and social links — no coding required.
                </p>
              </article>

              <article className="group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <CreditCard className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-semibold">NMKR Minting</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Launch on Cardano with integrated NMKR minting. Upload NFTs, set prices, 
                  and accept payments with built-in buy buttons.
                </p>
              </article>

              <article className="group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Users className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-semibold">Team Collaboration</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Invite team members with role-based permissions. Work together on 
                  layers, review generations, and manage your project.
                </p>
              </article>

              <article className="group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-semibold">Royalty Management</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Set up royalties for secondary sales. Configure percentages and 
                  payment addresses directly in your project settings.
                </p>
              </article>

              <article className="group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Store className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-semibold">Marketplace Listing</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Go live and get discovered. Your collection appears in the AnonForge 
                  marketplace for collectors to browse and mint.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Why AnonForge Section */}
        <section className="container mx-auto px-6 py-20" aria-labelledby="benefits-heading">
          <h2 id="benefits-heading" className="mb-12 text-center font-display text-3xl font-bold">
            Why choose AnonForge?
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-7 w-7 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-semibold">Lightning Fast</h3>
              <p className="mt-2 text-muted-foreground">
                Generate thousands of unique images in seconds. Launch your collection in minutes, not weeks.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-7 w-7 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-semibold">Secure & Private</h3>
              <p className="mt-2 text-muted-foreground">
                Your assets are protected with enterprise-grade security. Your API keys stay encrypted.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-7 w-7 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-semibold">Built for Teams</h3>
              <p className="mt-2 text-muted-foreground">
                Invite collaborators, assign roles, and work together on your NFT project seamlessly.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border/50 bg-muted/30" aria-labelledby="cta-heading">
          <div className="container mx-auto px-6 py-20 text-center">
            <h2 id="cta-heading" className="font-display text-3xl font-bold sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Whether you're collecting or creating, AnonForge has everything you need to explore the world of NFTs on Cardano.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild className="px-8">
                <Link to="/marketplace">
                  <Store className="mr-2 h-4 w-4" aria-hidden="true" />
                  Explore Marketplace
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/register">
                  Create Account
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
            <Link to="/terms" className="transition-colors hover:text-foreground">Terms</Link>
            <Link to="/marketplace" className="transition-colors hover:text-foreground">Marketplace</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
