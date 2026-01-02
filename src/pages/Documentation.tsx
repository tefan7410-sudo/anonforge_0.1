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
import {
  Layers,
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
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';

export default function Documentation() {
  const [searchQuery, setSearchQuery] = useState('');
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
      keywords: ['layer', 'upload', 'png', 'rarity', 'weight', 'exclusion', 'trait', 'category', 'zip', 'image', 'name', 'naming', 'file', 'filename', 'display_name', 'trait_name', 'convention', 'organize', 'folder', 'structure', 'transparent', 'transparency', 'dimensions', 'size', 'resolution'],
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
                  <p className="text-xs text-muted-foreground">~1-3MB per image at full resolution</p>
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
      keywords: ['nmkr', 'api', 'key', 'mint', 'cardano', 'upload', 'nft', 'blockchain', 'policy'],
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
                  <p className="font-medium text-sm">Upload NFTs</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select generations from your history and upload them to NMKR for minting.
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
      id: 'product-page',
      title: 'Product Page',
      icon: LayoutGrid,
      keywords: ['product', 'landing', 'page', 'banner', 'logo', 'tagline', 'social', 'twitter', 'discord', 'website', 'founder', 'portfolio'],
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Create a stunning landing page for your NFT collection. Your product page is what collectors see when browsing your project.
          </p>

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

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
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

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Link to="/" className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary">
                <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg sm:text-xl font-bold">AnonForge</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground border-muted-foreground/30">BETA</Badge>
            </Link>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSelector />
            <ThemeToggle />
            <Button variant="outline" asChild className="hidden sm:inline-flex">
              <Link to="/register">Get Started</Link>
            </Button>
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
              <Layers className="h-4 w-4" />
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
