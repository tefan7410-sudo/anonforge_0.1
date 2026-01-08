import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SEOHead } from '@/components/SEOHead';
import { PageTransition } from '@/components/PageTransition';
import { PROMO_TUTORIAL_STEPS, getTotalPromoSteps } from '@/lib/promo-tutorial-steps';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  FolderPlus,
  Upload,
  Sliders,
  Sparkles,
  Image,
  Rocket,
  ArrowRight,
  Store,
  X,
  Layers,
  Check,
  Megaphone,
  Star,
  Users,
  TrendingUp,
} from 'lucide-react';

// Visual mockup components for each step
function ProjectCreationVisual() {
  return (
    <Card className="p-6 bg-card/50 backdrop-blur border-border/50 max-w-md mx-auto">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Project Name</label>
          <div className="h-10 rounded-md border border-primary bg-background px-3 flex items-center">
            <span className="text-foreground">Cosmic Creatures</span>
            <span className="animate-pulse ml-0.5">|</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Token Prefix</label>
          <div className="h-10 rounded-md border border-border bg-background px-3 flex items-center">
            <span className="text-muted-foreground">COSMIC</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Description</label>
          <div className="h-20 rounded-md border border-border bg-background px-3 py-2">
            <span className="text-muted-foreground text-sm">A collection of 10,000 unique cosmic creatures...</span>
          </div>
        </div>
        <Button className="w-full" disabled>
          <FolderPlus className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </div>
    </Card>
  );
}

function LayerUploadVisual() {
  const categories = [
    { name: 'Background', count: 12, color: 'bg-blue-500/20 border-blue-500/30' },
    { name: 'Body', count: 8, color: 'bg-green-500/20 border-green-500/30' },
    { name: 'Eyes', count: 15, color: 'bg-purple-500/20 border-purple-500/30' },
    { name: 'Accessories', count: 20, color: 'bg-orange-500/20 border-orange-500/30' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
      {categories.map((cat, i) => (
        <Card 
          key={cat.name} 
          className={cn(
            "p-4 border-2 border-dashed transition-all",
            cat.color,
            i === 0 && "animate-pulse"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">{cat.name}</span>
            <Badge variant="secondary" className="text-xs">{cat.count} layers</Badge>
          </div>
          <div className="flex gap-1">
            {[...Array(4)].map((_, j) => (
              <div 
                key={j} 
                className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center"
              >
                <Layers className="h-4 w-4 text-muted-foreground/50" />
              </div>
            ))}
          </div>
        </Card>
      ))}
      <Card className="col-span-2 p-6 border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-2">
        <Upload className="h-8 w-8 text-primary animate-bounce" />
        <span className="text-sm text-muted-foreground">Drop your PNG files here</span>
      </Card>
    </div>
  );
}

function RarityWeightsVisual() {
  const traits = [
    { name: 'Common Background', rarity: 50, color: 'bg-muted' },
    { name: 'Rare Eyes', rarity: 25, color: 'bg-blue-500' },
    { name: 'Epic Accessory', rarity: 15, color: 'bg-purple-500' },
    { name: 'Legendary Crown', rarity: 5, color: 'bg-amber-500' },
    { name: 'Mythic Aura', rarity: 1, color: 'bg-gradient-to-r from-pink-500 to-violet-500' },
  ];

  return (
    <Card className="p-6 bg-card/50 backdrop-blur border-border/50 max-w-md mx-auto">
      <div className="space-y-4">
        {traits.map((trait, i) => (
          <div key={trait.name} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className={cn(
                i === 4 && "bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent font-semibold"
              )}>
                {trait.name}
              </span>
              <span className="font-mono text-muted-foreground">{trait.rarity}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all", trait.color)}
                style={{ width: `${trait.rarity}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function GenerationVisual() {
  return (
    <Card className="p-6 bg-card/50 backdrop-blur border-border/50 max-w-md mx-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Generating NFTs</span>
          <Badge variant="outline" className="animate-pulse">
            <Sparkles className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        </div>
        <Progress value={67} className="h-3" />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>6,700 / 10,000 generated</span>
          <span>~2 min remaining</span>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className={cn(
                "aspect-square rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center",
                i < 6 && "ring-2 ring-green-500/50"
              )}
            >
              {i < 6 ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function PreviewVisual() {
  return (
    <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
      {[...Array(6)].map((_, i) => (
        <Card 
          key={i} 
          className={cn(
            "aspect-square p-2 bg-gradient-to-br overflow-hidden relative group",
            i === 0 && "from-blue-500/20 to-purple-500/20",
            i === 1 && "from-green-500/20 to-teal-500/20",
            i === 2 && "from-orange-500/20 to-red-500/20",
            i === 3 && "from-pink-500/20 to-rose-500/20",
            i === 4 && "from-indigo-500/20 to-blue-500/20",
            i === 5 && "from-amber-500/20 to-yellow-500/20"
          )}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <Image className="h-8 w-8 text-foreground/20" />
          </div>
          <div className="absolute bottom-1 left-1 right-1">
            <Badge variant="secondary" className="text-[10px] w-full justify-center">
              #{1001 + i}
            </Badge>
          </div>
          {i === 0 && (
            <div className="absolute top-1 right-1">
              <Badge className="bg-amber-500/80 text-[10px]">★</Badge>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function PublishVisual() {
  return (
    <Card className="p-6 bg-card/50 backdrop-blur border-border/50 max-w-md mx-auto">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="font-medium text-green-500">NMKR Connected</p>
            <p className="text-xs text-muted-foreground">Ready to mint on Cardano</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Collection Size</span>
            <span className="font-mono">10,000 NFTs</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Mint Price</span>
            <span className="font-mono">50 ₳</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Royalties</span>
            <span className="font-mono">5%</span>
          </div>
        </div>
        <Button className="w-full" disabled>
          <Rocket className="mr-2 h-4 w-4" />
          Publish to Marketplace
        </Button>
      </div>
    </Card>
  );
}

function MarketingVisual() {
  return (
    <Card className="p-6 bg-card/50 backdrop-blur border-border/50 max-w-md mx-auto">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="font-medium text-amber-500">Marketing Tools</p>
            <p className="text-xs text-muted-foreground">Boost your collection visibility</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center">
                <Star className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">Featured Spotlight</span>
            </div>
            <Badge variant="outline">Available</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-purple-500/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-500" />
              </div>
              <span className="text-sm">Creator Network</span>
            </div>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <span className="text-sm">Audience Analytics</span>
            </div>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CTAVisual() {
  return (
    <div className="text-center space-y-6 max-w-md mx-auto">
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-32 w-32 rounded-full bg-primary/20 animate-ping" />
        </div>
        <div className="relative h-32 w-32 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
          <Rocket className="h-16 w-16 text-primary-foreground" />
        </div>
      </div>
      <div className="space-y-4">
        <Button size="lg" className="px-8" asChild>
          <Link to="/register">
            Become a Creator
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <div className="text-sm text-muted-foreground">or</div>
        <Button size="lg" variant="outline" asChild>
          <Link to="/marketplace">
            <Store className="mr-2 h-4 w-4" />
            Explore Marketplace
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Map visual types to components
const visualComponents: Record<string, React.FC> = {
  'project-creation': ProjectCreationVisual,
  'layer-upload': LayerUploadVisual,
  'rarity-weights': RarityWeightsVisual,
  'generation': GenerationVisual,
  'preview': PreviewVisual,
  'publish': PublishVisual,
  'marketing': MarketingVisual,
  'cta': CTAVisual,
};

// Icon map for step indicators
const stepIcons: Record<string, React.FC<{ className?: string }>> = {
  'project-creation': FolderPlus,
  'layer-upload': Upload,
  'rarity-weights': Sliders,
  'generation': Sparkles,
  'preview': Image,
  'publish': Rocket,
  'marketing': Megaphone,
  'cta': ArrowRight,
};

export default function Tutorial() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = getTotalPromoSteps();
  const step = PROMO_TUTORIAL_STEPS[currentStep - 1];
  const goToNext = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const goToPrev = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'Escape') {
        navigate('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, navigate]);

  const VisualComponent = visualComponents[step.visual];
  const StepIcon = stepIcons[step.visual];
  const progress = (currentStep / totalSteps) * 100;

  return (
    <PageTransition>
      <SEOHead
        title="How It Works - Create NFTs in Minutes"
        description="Learn how to create, generate, and publish your NFT collection on AnonForge in just a few simple steps."
        url="/tutorial"
        keywords={["NFT tutorial", "create NFT collection", "Cardano NFT guide", "NFT minting tutorial"]}
      />
      <div className="min-h-screen bg-background flex flex-col relative">
        {/* Exit Button */}
        <div className="absolute top-4 right-4 z-50">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-muted/50 hover:bg-muted">
            <Link to="/">
              <X className="h-5 w-5" />
              <span className="sr-only">Exit tutorial</span>
            </Link>
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted/30">
          <Progress value={progress} className="h-1 rounded-none" />
        </div>

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-8 sm:py-12 flex flex-col">
          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {PROMO_TUTORIAL_STEPS.map((s, i) => {
              const Icon = stepIcons[s.visual];
              const isActive = s.id === currentStep;
              const isCompleted = s.id < currentStep;
              
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(s.id)}
                  className={cn(
                    "flex items-center justify-center rounded-full transition-all",
                    isActive 
                      ? "h-10 w-10 bg-primary text-primary-foreground" 
                      : isCompleted 
                        ? "h-8 w-8 bg-primary/20 text-primary hover:bg-primary/30" 
                        : "h-8 w-8 bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                  aria-label={`Go to step ${s.id}: ${s.title}`}
                >
                  <Icon className={cn(isActive ? "h-5 w-5" : "h-4 w-4")} />
                </button>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            <div className="text-center max-w-2xl mx-auto animate-fade-in" key={currentStep}>
              <Badge variant="outline" className="mb-4">
                Step {currentStep} of {totalSteps}
              </Badge>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                {step.title}
              </h1>
              <p className="text-lg text-muted-foreground">
                {step.description}
              </p>
            </div>

            {/* Visual Component */}
            <div className="w-full max-w-2xl animate-scale-in" key={`visual-${currentStep}`}>
              <VisualComponent />
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/50">
            <Button
              variant="ghost"
              onClick={goToPrev}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            <div className="text-sm text-muted-foreground">
              Use <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">→</kbd> to navigate
            </div>

            {!step.isFinal ? (
              <Button onClick={goToNext} className="gap-2">
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button asChild className="gap-2">
                <Link to="/register">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
