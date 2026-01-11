import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Wand2, 
  CreditCard, 
  Store, 
  Coins,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { TutorialOptInModal } from '@/components/tutorial/TutorialOptInModal';
import { useTutorial } from '@/contexts/TutorialContext';

const STORAGE_KEY = 'anonforge-new-account-onboarding-seen';

interface Particle {
  id: number;
  x: string;
  y: string;
  size: number;
  delay: string;
  duration: string;
}

function generateParticles(): Particle[] {
  return Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: `${Math.random() * 100}%`,
    y: `${60 + Math.random() * 40}%`,
    size: 4 + Math.random() * 4,
    delay: `${Math.random() * 0.5}s`,
    duration: `${1.5 + Math.random() * 1}s`,
  }));
}

interface NewAccountWelcomeModalProps {
  onClose?: () => void;
}

export function NewAccountWelcomeModal({ onClose }: NewAccountWelcomeModalProps) {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showTutorialOptIn, setShowTutorialOptIn] = useState(false);
  const particles = useMemo(() => generateParticles(), []);
  const { hasSeenPrompt, loading: tutorialLoading } = useTutorial();

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(STORAGE_KEY);
    if (!hasSeenOnboarding) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setOpen(false);
    onClose?.();
  };

  // When closing, check if we should show tutorial opt-in
  const handleGetStarted = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
    
    // Show tutorial opt-in if user hasn't seen it yet
    if (!tutorialLoading && !hasSeenPrompt) {
      setShowTutorialOptIn(true);
    } else {
      onClose?.();
    }
  };

  const handleTutorialOptInClose = (open: boolean) => {
    setShowTutorialOptIn(open);
    if (!open) {
      onClose?.();
    }
  };

  const features = [
    {
      icon: Sparkles,
      title: 'Layer System',
      description: 'Upload and organize your artwork layers with rarity weights',
    },
    {
      icon: Wand2,
      title: 'Generation Engine',
      description: 'Combine layers to create unique NFTs with metadata',
    },
    {
      icon: CreditCard,
      title: 'NMKR Integration',
      description: 'Mint your collection directly to Cardano blockchain',
    },
    {
      icon: Store,
      title: 'Product Pages',
      description: 'Create beautiful storefronts for your collections',
    },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {/* Particle animation */}
          {open && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {particles.map((particle) => (
                <div
                  key={particle.id}
                  className="absolute rounded-full bg-primary/60 shadow-[0_0_6px_hsl(var(--primary)/0.6)] animate-particle-float"
                  style={{
                    left: particle.x,
                    top: particle.y,
                    width: particle.size,
                    height: particle.size,
                    animationDelay: particle.delay,
                    animationDuration: particle.duration,
                  }}
                />
              ))}
            </div>
          )}

          <DialogHeader className="text-center sm:text-center relative z-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl">Welcome to Your Dashboard!</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 relative z-10">
            {/* Features grid */}
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-lg border border-border/50 bg-muted/30 p-3"
                >
                  <feature.icon className="mb-2 h-5 w-5 text-primary" />
                  <h4 className="text-sm font-medium">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Important note */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="mb-2 font-medium text-foreground flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                Already have your assets?
              </h4>
              <p className="text-sm text-muted-foreground">
                You don't need to use our layer/generation tools! If you're an indie artist with ready assets, 
                jump straight to <span className="text-primary font-medium">Publish</span> and create your product page.
              </p>
            </div>

            {/* Credits explanation */}
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <h4 className="mb-2 font-medium text-foreground flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                About Credits
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• <span className="text-foreground font-medium">Generation is the only paid feature</span></li>
                <li>• Free accounts include <span className="text-primary font-medium">100 monthly credits</span> - perfect for indie artists</li>
                <li>• Need thousands of assets? Check out our credit packages</li>
              </ul>
            </div>

            {/* Don't show again */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="dont-show-onboarding"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              />
              <Label htmlFor="dont-show-onboarding" className="text-sm text-muted-foreground cursor-pointer">
                Don't show this again
              </Label>
            </div>
          </div>

          <Button onClick={handleGetStarted} className="w-full relative z-10">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogContent>
      </Dialog>

      <TutorialOptInModal 
        open={showTutorialOptIn} 
        onOpenChange={handleTutorialOptInClose} 
      />
    </>
  );
}
