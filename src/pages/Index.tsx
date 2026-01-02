import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Layers, ArrowRight, Sparkles, Palette, Download, Zap, Shield, Globe } from 'lucide-react';
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

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-24 text-center" aria-labelledby="hero-heading">
          <div className="mx-auto max-w-3xl">
            <h1 id="hero-heading" className="font-display text-5xl font-bold tracking-tight sm:text-6xl">
              Generate unique
              <span className="text-primary"> profile pictures</span>
              <br />with layered traits
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Upload your layer assets, configure rarities, and generate thousands of unique 
              combinations. Perfect for NFT collections, avatars, and generative art projects.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild className="px-8">
                <Link to="/register">
                  Start creating
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-border/50 bg-muted/30" aria-labelledby="features-heading">
          <div className="container mx-auto px-6 py-20">
            <h2 id="features-heading" className="sr-only">Features</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <article className="rounded-xl border border-border/50 bg-card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Palette className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-semibold">Layer Management</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload layers via drag-drop or sync from GitHub. Auto-parse filenames and 
                  customize trait names.
                </p>
              </article>
              <article className="rounded-xl border border-border/50 bg-card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-semibold">Rarity Configuration</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Set weights for each trait, preview distributions, and ensure your collection 
                  has the perfect balance.
                </p>
              </article>
              <article className="rounded-xl border border-border/50 bg-card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Download className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-semibold">Batch Generation</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Generate single previews or batch thousands. Export images with complete 
                  metadata in one click.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="container mx-auto px-6 py-20" aria-labelledby="benefits-heading">
          <h2 id="benefits-heading" className="mb-12 text-center font-display text-3xl font-bold">
            Why choose AnonForge?
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-semibold">Lightning Fast</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Generate thousands of unique images in seconds with our optimized engine.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-semibold">Secure & Private</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Your assets are protected with enterprise-grade security and encryption.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Globe className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-semibold">Collaborate Anywhere</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Invite team members to collaborate on projects from anywhere in the world.
              </p>
            </div>
          </div>
        </section>

        {/* Marketplace Section */}
        <MarketplaceSection />

        {/* CTA Section */}
        <section className="border-t border-border/50 bg-muted/30" aria-labelledby="cta-heading">
          <div className="container mx-auto px-6 py-20 text-center">
            <h2 id="cta-heading" className="font-display text-3xl font-bold">Ready to build your collection?</h2>
            <p className="mt-4 text-muted-foreground">
              Join creators using AnonForge to generate unique profile pictures.
            </p>
            <Button size="lg" className="mt-8" asChild>
              <Link to="/register">
                Create free account
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50">
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
