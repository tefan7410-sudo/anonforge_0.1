import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/Logo';
import {
  ArrowLeft,
  Upload,
  Palette,
  Sparkles,
  Settings,
  Users,
  CreditCard,
  Store,
  Shield,
  Zap,
  LayoutGrid,
  FileImage,
  Sliders,
  Link2,
  Check,
  AlertCircle,
  Search,
  List,
  GitBranch,
  Ban,
  ArrowLeftRight,
  Heart,
  Menu
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function Documentation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Zap,
      keywords: ['account', 'signup', 'register', 'login', 'project', 'new', 'first', 'begin', 'start', 'create', 'dashboard'],
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Welcome to AnonForge! This guide will help you get started with creating and launching your NFT collection on Cardano.
          </p>
          
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-2">
                  <span className="text-lg font-bold text-primary">1</span>
                </div>
                <CardTitle className="text-base">Create Account</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Sign up with your email to get started. You'll receive a confirmation email to verify your account.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-2">
                  <span className="text-lg font-bold text-primary">2</span>
                </div>
                <CardTitle className="text-base">Create Project</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  From your dashboard, click "New Project" to create your first NFT collection. Give it a name and description.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-2">
                  <span className="text-lg font-bold text-primary">3</span>
                </div>
                <CardTitle className="text-base">Upload Layers</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Upload your PNG layers with transparency. Organize them into categories like "Background", "Body", "Eyes", etc.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Pro Tip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Make sure all your layer images have the same dimensions (e.g., 1000x1000 pixels) for consistent output.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'layer-management',
      title: 'Layer Management',
      icon: Palette,
      keywords: ['layer', 'upload', 'png', 'rarity', 'weight', 'exclusion', 'trait', 'category', 'zip', 'image', 'name', 'naming', 'file', 'filename', 'display_name', 'trait_name', 'convention', 'organize', 'folder', 'structure', 'transparent', 'transparency', 'dimensions', 'size', 'resolution', 'visual', 'view', 'node', 'toggle', 'connection', 'edge', 'effect', 'switch', 'drag', 'graph', 'list'],
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Layers are the building blocks of your generative NFT collection. Each layer represents a trait category that will be combined to create unique NFTs.
          </p>

          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              Uploading Layers
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground ml-6">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Use PNG format with transparent backgrounds
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Maximum resolution: 3000×3000 pixels
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Keep all images the same dimensions
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Name files descriptively (e.g., "blue_eyes.png", "red_hat.png")
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                You can upload individual files or ZIP archives
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              Rarity Weights
            </h4>
            <p className="text-sm text-muted-foreground">
              Each layer can have a rarity weight that determines how often it appears in generated NFTs. Higher weights mean more common traits, lower weights create rarer traits.
            </p>
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <p className="text-sm font-mono">
                Example: If you have 3 backgrounds with weights 50, 30, and 20, they will appear approximately 50%, 30%, and 20% of the time respectively.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              Layer Exclusions
            </h4>
            <p className="text-sm text-muted-foreground">
              Sometimes certain traits shouldn't appear together. Use layer exclusions to prevent incompatible combinations (e.g., a hat that clips through certain hairstyles).
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-primary" />
              View Modes
            </h4>
            <p className="text-sm text-muted-foreground">
              The Layers tab offers two ways to view and manage your layers:
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card">
                <div className="h-8 w-8 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                  <List className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">List View</p>
                  <p className="text-xs text-muted-foreground">Traditional list with categories as cards. Edit rarity weights and manage exclusions via modals.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card">
                <div className="h-8 w-8 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                  <GitBranch className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Visual View</p>
                  <p className="text-xs text-muted-foreground">Node-based graph showing all layers and connections. Drag between layers to create relationships.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" />
              Visual Connection Editor
            </h4>
            <p className="text-sm text-muted-foreground">
              The Visual View displays layers as nodes with connection handles. Create and manage layer relationships by dragging connections between nodes.
            </p>
            
            <div className="space-y-2">
              <p className="font-medium text-sm">Connection Types:</p>
              <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                <li className="flex items-start gap-2">
                  <div className="h-4 w-6 flex items-center shrink-0">
                    <div className="h-0.5 w-full rounded bg-destructive" style={{ backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--destructive)) 0, hsl(var(--destructive)) 4px, transparent 4px, transparent 8px)' }} />
                  </div>
                  <span><Ban className="inline h-3 w-3 text-destructive mr-1" /><strong className="text-destructive">Exclusion</strong> — Layers that cannot appear together</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-4 w-6 flex items-center shrink-0">
                    <div className="h-0.5 w-full rounded bg-primary" />
                  </div>
                  <span><Sparkles className="inline h-3 w-3 text-primary mr-1" /><strong className="text-primary">Effect Link</strong> — Links effect layers to parent layers</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-4 w-6 flex items-center shrink-0">
                    <div className="h-0.5 w-full rounded bg-warning" />
                  </div>
                  <span><ArrowLeftRight className="inline h-3 w-3 text-warning mr-1" /><strong className="text-warning">Layer Switch</strong> — Swaps render order when combined</span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Quick Actions</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Drag from a layer's handle to another layer to create a connection. Click any connection line and press Delete or Backspace to remove it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'nft-generation',
      title: 'NFT Generation',
      icon: Sparkles,
      keywords: ['generate', 'batch', 'single', 'unique', 'combination', 'history', 'favorite', 'metadata', 'comment', 'random', 'manual', 'select', 'preview', 'resolution', 'download', 'image', 'json', 'token', 'id', 'prefix', 'weight', 'rarity', 'trait', 'attribute', 'jpg', 'jpeg', 'format', 'quality'],
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Once your layers are set up, you can generate unique NFT combinations. AnonForge ensures each generated NFT is unique.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileImage className="h-4 w-4 text-primary" />
                  Single Generation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Generate one NFT at a time to preview combinations. Great for testing your layer setup and checking for visual issues.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-primary" />
                  Batch Generation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Generate multiple NFTs at once. Specify the batch size and AnonForge will create that many unique combinations.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              Technical Specifications
            </h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card">
                <div className="h-8 w-8 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                  <FileImage className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Export Format</p>
                  <p className="text-xs text-muted-foreground">High-quality JPG (92% quality)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card">
                <div className="h-8 w-8 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                  <LayoutGrid className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Full Resolution</p>
                  <p className="text-xs text-muted-foreground">Up to 3000×3000 pixels</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card">
                <div className="h-8 w-8 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Preview Mode</p>
                  <p className="text-xs text-muted-foreground">384×384 pixels for faster generation</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card">
                <div className="h-8 w-8 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">File Size</p>
                  <p className="text-xs text-muted-foreground">Displayed in real-time during generation</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Generation History</h4>
            <p className="text-sm text-muted-foreground">
              All generated NFTs are saved in your project's generation history. You can:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground ml-6">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Mark favorites to easily find your best generations
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Add comments for team collaboration
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                View metadata for each generated NFT
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Select generations to upload for minting
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'nmkr-integration',
      title: 'NMKR Integration',
      icon: CreditCard,
      keywords: ['nmkr', 'api', 'key', 'mint', 'cardano', 'upload', 'nft', 'blockchain', 'policy', 'tier', 'pricing', 'payment', 'link'],
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            AnonForge integrates with NMKR to enable native Cardano minting. Follow these steps to connect and start minting.
          </p>

          <div className="space-y-4">
            <h4 className="font-semibold">Setup Steps</h4>
            <div className="space-y-3">
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Get your NMKR API Key</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sign up at <span className="text-primary">nmkr.io</span> and generate an API key from your dashboard.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Enter API Key in AnonForge</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Go to your project's Publish tab and enter your NMKR API key. It will be securely encrypted.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Create NMKR Project</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use the setup wizard to create a new NMKR project linked to your AnonForge collection.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-sm font-bold text-primary">4</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Configure Multi-Tier Pricing</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set up multiple price tiers with different counts and prices. Each tier must be configured explicitly in NMKR.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-sm font-bold text-primary">5</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Generate Payment Link</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generate a payment link to enable the Product Page tab. This is required before you can schedule your launch.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex gap-3">
              <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Security Note</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your NMKR API key is encrypted and stored securely. Only you can access projects created with your key.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'publishing-workflow',
      title: 'Publishing Workflow',
      icon: Zap,
      keywords: ['publish', 'workflow', 'unlock', 'tab', 'milestone', 'progress', 'schedule', 'launch', 'calendar', 'live'],
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            AnonForge uses a progressive tab system to guide you through publishing your collection. Complete each step to unlock the next.
          </p>

          <div className="space-y-4">
            <h4 className="font-semibold">Progressive Tab Unlocking</h4>
            <div className="space-y-3">
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary shrink-0">
                  <span className="text-sm font-bold text-primary-foreground">1</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Publish Tab (Always Available)</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set up your NMKR integration, configure pricing tiers, and generate a payment link.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/50 shrink-0">
                  <span className="text-sm font-bold text-primary-foreground">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Product Page (Unlocked after payment link)</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create your collection's landing page with banner, logo, tagline, and social links. Schedule your launch date.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/30 shrink-0">
                  <span className="text-sm font-bold text-primary-foreground">3</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Marketing (Unlocked after Product Page setup)</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Apply for featured spotlight placement on the marketplace homepage.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Schedule Launch</h4>
            <p className="text-sm text-muted-foreground">
              Use the Schedule Launch feature to set a specific date and time for your collection to go live. Key details:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground ml-6">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Minimum 24 hours advance notice required
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Select date and time using the calendar picker
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Scheduled collections show a countdown timer on the marketplace
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Collections go live automatically at the scheduled time
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Milestone Celebrations</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You'll see celebration modals when completing key milestones, guiding you to the next step in the workflow.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'product-page',
      title: 'Product Page',
      icon: LayoutGrid,
      keywords: ['product', 'landing', 'page', 'banner', 'logo', 'tagline', 'social', 'twitter', 'discord', 'website', 'founder', 'portfolio', 'schedule', 'launch', 'unlock'],
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Create a stunning landing page for your NFT collection. Your product page is what collectors see when browsing your project.
          </p>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 mb-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">How to Unlock</p>
                <p className="text-sm text-muted-foreground mt-1">
                  The Product Page tab is unlocked after generating a payment link in the Publish tab. Complete NMKR setup first.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Customization Options</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card">
                <div className="h-8 w-8 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                  <FileImage className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Banner & Logo</p>
                  <p className="text-xs text-muted-foreground">Upload custom banner and logo images</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card">
                <div className="h-8 w-8 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Tagline</p>
                  <p className="text-xs text-muted-foreground">Short description that captures your project</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card">
                <div className="h-8 w-8 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                  <Link2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Social Links</p>
                  <p className="text-xs text-muted-foreground">Twitter, Discord, and website links</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card">
                <div className="h-8 w-8 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Founder Info</p>
                  <p className="text-xs text-muted-foreground">Showcase the team behind the project</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Schedule Launch</h4>
            <p className="text-sm text-muted-foreground">
              Click "Schedule Launch" to open the calendar picker and select your launch date and time. 
              The minimum scheduling window is 24 hours from now. Collectors will see a countdown timer until launch.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Portfolio Showcase</h4>
            <p className="text-sm text-muted-foreground">
              Display sample NFTs from your collection on the product page. Collectors can browse examples before minting.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'team-collaboration',
      title: 'Team Collaboration',
      icon: Users,
      keywords: ['team', 'invite', 'member', 'role', 'admin', 'editor', 'viewer', 'permission', 'collaborate'],
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Work together with your team on NFT projects. Invite members and assign roles based on their responsibilities.
          </p>

          <div className="space-y-4">
            <h4 className="font-semibold">Team Roles</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-card">
                <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  Admin
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Full access to all project features including settings, team management, and NMKR integration.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-card">
                <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
                  Editor
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Can upload layers, generate NFTs, and manage generations. Cannot access project settings or NMKR.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-card">
                <div className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                  Viewer
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Read-only access to view layers, generations, and project details. Can add comments.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Inviting Team Members</h4>
            <p className="text-sm text-muted-foreground">
              Go to Project Settings → Team to invite members by email. They'll receive an invitation that expires after 7 days.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'royalties',
      title: 'Royalties & Monetization',
      icon: CreditCard,
      keywords: ['royalty', 'royalties', 'monetization', 'earn', 'secondary', 'sales', 'percentage', 'wallet', 'payment', 'address'],
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Set up royalties to earn from secondary sales of your NFTs. Configure percentages and payment addresses in your project settings.
          </p>

          <div className="space-y-4">
            <h4 className="font-semibold">Setting Up Royalties</h4>
            <ul className="space-y-2 text-sm text-muted-foreground ml-6">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Navigate to Project Settings → Royalties tab
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Enter your royalty percentage (e.g., 5%)
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Add your Cardano wallet address for receiving payments
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Royalties are embedded in your NFT metadata
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Important</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Royalty settings should be configured before minting. Changes after minting won't affect already-minted NFTs.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'creator-verification',
      title: 'Creator Verification',
      icon: Shield,
      keywords: ['verification', 'verified', 'badge', 'creator', 'twitter', 'trust', 'approve', 'request', 'founder'],
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Get verified as a creator to build trust with collectors. Verified creators display a badge on all their collections.
          </p>

          <div className="space-y-4">
            <h4 className="font-semibold">How to Get Verified</h4>
            <div className="space-y-3">
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Go to Product Page Tab</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Navigate to your project's Product Page tab.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Request Verification</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    In the "Founder / Creator" section, click "Request Verification".
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Submit Details</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter your Twitter handle and optional bio, then submit for admin review.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Verification Status</h4>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                <div className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium">
                  Pending
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                <div className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                  Approved
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                <div className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-medium">
                  Rejected
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              If rejected, you can update your information and resubmit for review.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'credits-system',
      title: 'Credits System',
      icon: CreditCard,
      keywords: ['credits', 'balance', 'purchase', 'buy', 'cost', 'price', 'ada', 'free', 'monthly', 'reset', 'generation', 'preview', 'full resolution'],
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            AnonForge uses a credit system for generating images. Every user receives free monthly credits, and you can purchase more for larger batch generations.
          </p>

          <div className="space-y-4">
            <h4 className="font-semibold">Credit Costs</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card">
                <div className="h-8 w-8 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                  <FileImage className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Full Resolution (3000×3000)</p>
                  <p className="text-xs text-muted-foreground">0.1 credits per image</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card">
                <div className="h-8 w-8 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Preview Mode (384×384)</p>
                  <p className="text-xs text-muted-foreground">0.005 credits per image (20x cheaper!)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Free Monthly Credits</h4>
            <ul className="space-y-2 text-sm text-muted-foreground ml-6">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Every user receives <strong className="text-foreground">100 free credits</strong> each month</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Credits reset on your registration anniversary date each month</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>100 credits = 1,000 full resolution exports OR 20,000 preview exports</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Purchase Credits</h4>
            <p className="text-sm text-muted-foreground">
              Need to generate thousands of assets for a large collection? Purchase additional credits that never expire.
            </p>
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span>1,000 credits</span>
                  <span className="font-semibold">25 ADA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>2,500 credits</span>
                  <span className="font-semibold">50 ADA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>5,000 credits</span>
                  <span className="font-semibold">80 ADA</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Purchased Credits Never Expire</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Unlike free monthly credits, purchased credits remain in your account indefinitely. Free credits are always used first.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex gap-3">
              <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Secure Blockchain Payments</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Credit purchases are paid in ADA and verified automatically via blockchain. Each payment includes a unique dust amount for automatic verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'marketing-spotlight',
      title: 'Marketing & Spotlight',
      icon: Sparkles,
      keywords: ['marketing', 'spotlight', 'featured', 'promote', 'promotion', 'hero', 'banner', 'marquee', 'ada', 'payment', 'campaign'],
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Get your collection featured prominently on AnonForge. The spotlight program puts your project in front of collectors through hero placement, featured badges, and marquee banners.
          </p>

          <div className="space-y-4">
            <h4 className="font-semibold">What You Get</h4>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card">
                <div className="h-8 w-8 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Featured Badge</p>
                  <p className="text-xs text-muted-foreground">Stand out in the marketplace</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card">
                <div className="h-8 w-8 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                  <FileImage className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Hero Placement</p>
                  <p className="text-xs text-muted-foreground">Landing page spotlight section</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card">
                <div className="h-8 w-8 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                  <Link2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Marquee Banner</p>
                  <p className="text-xs text-muted-foreground">Scrolling promotion across pages</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">How It Works</h4>
            <div className="space-y-3">
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Select Your Dates</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Go to Marketing tab in your project. Select 1-5 consecutive days on the calendar. Unavailable dates are marked.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Submit Request</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Optionally upload a custom hero image (16:9 recommended). Submit your request for admin review.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Complete Payment</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Once approved, you have 24 hours to pay. Send exact ADA amount (includes unique dust amount for verification) to the provided address.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-sm font-bold text-primary">4</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Campaign Goes Live</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your spotlight activates automatically at 00:01 UTC on your start date.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-medium">Price</span>
                <span className="font-semibold">25 ADA per day</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Maximum duration</span>
                <span>5 consecutive days</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Payment Verification</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Payments are verified automatically via blockchain. The unique dust amount ensures your payment is correctly identified. Do not round the amount.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'marketplace',
      title: 'Marketplace Listing',
      icon: Store,
      keywords: ['marketplace', 'listing', 'live', 'publish', 'discover', 'collectors', 'review', 'approval', 'visibility', '24 hours', 'automatic'],
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Get your collection discovered by listing it on the AnonForge marketplace. Collectors can browse and mint directly from your product page.
          </p>

          <div className="space-y-4">
            <h4 className="font-semibold">Going Live</h4>
            <div className="space-y-3">
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Complete Your Product Page</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fill in all required fields including banner, description, and social links.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Submit for Review</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Toggle your page to "Live" status. It will enter a 24-hour review period.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Automatic or Early Approval</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Collections automatically go live after 24 hours, or admin can approve early.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">24-Hour Review Period</p>
                <p className="text-sm text-muted-foreground mt-1">
                  After setting your page to "Live", there's a 24-hour waiting period. Admin can approve early or reject during this time. If not rejected, your collection automatically goes live after 24 hours.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Visibility</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You can hide your collection from the marketplace at any time while still allowing direct access via your collection URL.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Want More Visibility?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Check out our Marketing & Spotlight feature to get your collection featured prominently on the landing page and marketplace.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Helper to extract text content from JSX for searching
  const extractTextFromJSX = (element: React.ReactNode): string => {
    if (typeof element === 'string') return element;
    if (typeof element === 'number') return String(element);
    if (!element) return '';
    if (Array.isArray(element)) return element.map(extractTextFromJSX).join(' ');
    if (typeof element === 'object' && 'props' in element) {
      const props = element.props as { children?: React.ReactNode };
      return extractTextFromJSX(props.children);
    }
    return '';
  };

  // Filter sections based on search query - search title, keywords, AND content
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const query = searchQuery.toLowerCase();
    return sections.filter((section) => {
      // Match title
      if (section.title.toLowerCase().includes(query)) return true;
      // Match keywords
      if (section.keywords.some((keyword) => keyword.toLowerCase().includes(query))) return true;
      // Match content text
      const contentText = extractTextFromJSX(section.content);
      if (contentText.toLowerCase().includes(query)) return true;
      return false;
    });
  }, [searchQuery]);

  return (
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

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 sm:mb-12">
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Documentation
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Everything you need to know about creating, managing, and launching your NFT collection on AnonForge.
            </p>
          </div>

          {/* Search */}
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quick Navigation - only show when not searching */}
          {!searchQuery && (
            <div className="mb-8 p-4 rounded-lg border border-border/50 bg-muted/30">
              <h2 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">
                Quick Navigation
              </h2>
              <div className="flex flex-wrap gap-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-border/50 bg-background hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <section.icon className="h-3.5 w-3.5" />
                    {section.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Sections */}
          {filteredSections.length > 0 ? (
            <Accordion type="multiple" defaultValue={searchQuery ? filteredSections.map(s => s.id) : ['getting-started']} className="space-y-4">
              {filteredSections.map((section) => (
                <AccordionItem
                  key={section.id}
                  value={section.id}
                  id={section.id}
                  className="border border-border/50 rounded-lg px-6 bg-card"
                >
                  <AccordionTrigger className="hover:no-underline py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <section.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-display text-lg font-semibold">
                        {section.title}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 pt-2">
                    {section.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-12 px-4 rounded-lg border border-border/50 bg-muted/30">
              <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try searching for different keywords like "layer", "mint", "team", or "royalty".
              </p>
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-12 text-center p-8 rounded-lg border border-border/50 bg-muted/30">
            <h2 className="font-display text-2xl font-bold mb-3">
              Ready to create your collection?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Start building your NFT project today. It only takes a few minutes to get started.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/register">
                  Create Account
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/marketplace">
                  <Store className="mr-2 h-4 w-4" />
                  Browse Marketplace
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Logo size="sm" />
              <span className="font-semibold">AnonForge</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <Link to="/terms-of-service" className="transition-colors hover:text-foreground">Terms</Link>
              <Link to="/marketplace" className="transition-colors hover:text-foreground">Marketplace</Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
