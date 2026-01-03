import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Layers, ExternalLink, Sparkles } from 'lucide-react';
import { TutorialOptInModal } from '@/components/tutorial/TutorialOptInModal';
import { useTutorial } from '@/contexts/TutorialContext';

const STORAGE_KEY = 'anonforge-welcome-seen';

interface Particle {
  id: number;
  x: string;
  y: string;
  size: number;
  delay: string;
  duration: string;
}

function generateParticles(): Particle[] {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: `${Math.random() * 100}%`,
    y: `${60 + Math.random() * 40}%`,
    size: 4 + Math.random() * 4,
    delay: `${Math.random() * 0.5}s`,
    duration: `${1.5 + Math.random() * 1}s`,
  }));
}

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showTutorialOptIn, setShowTutorialOptIn] = useState(false);
  const particles = useMemo(() => generateParticles(), []);
  const { hasSeenPrompt, loading: tutorialLoading } = useTutorial();

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(STORAGE_KEY);
    if (!hasSeenWelcome) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setOpen(false);
  };

  const handleExplore = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
    
    // Show tutorial opt-in if user hasn't seen it yet
    if (!tutorialLoading && !hasSeenPrompt) {
      setShowTutorialOptIn(true);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="sm:max-w-md overflow-hidden">
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
              <Layers className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl">Welcome to AnonForge</DialogTitle>
            <Badge variant="outline" className="mx-auto mt-2 w-fit">
              <Sparkles className="mr-1 h-3 w-3" />
              Beta
            </Badge>
          </DialogHeader>

          <div className="space-y-4 py-4 relative z-10">
            <p className="text-center text-muted-foreground">
              Hi! I'm{' '}
              <a
                href="https://x.com/bajuzki"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                @bajuzki
              </a>
              , and I built AnonForge to help independent artists on Cardano publish their work without the technical hassle.
            </p>

            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <h4 className="mb-2 font-medium text-foreground">Beta Notice</h4>
              <p className="text-sm text-muted-foreground">
                This platform has been tested and is working, but there may be edge cases I haven't covered yet. Your patience and feedback are greatly appreciated!
              </p>
            </div>

            <div className="text-center">
              <p className="mb-3 text-sm text-muted-foreground">
                I launched my own collection using this tool. If you'd like to support AnonForge's growth, check it out!
              </p>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://24f02d5b-359d-40ba-8edd-d8a8c0ad3888.lovableproject.com/collection/a1cab3d9-2351-4df9-9988-5f0621e40085"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Anon Collection
                </a>
              </Button>
            </div>

            {/* Don't show again */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="dont-show-welcome"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              />
              <Label htmlFor="dont-show-welcome" className="text-sm text-muted-foreground cursor-pointer">
                Don't show this again
              </Label>
            </div>
          </div>

          <Button onClick={handleExplore} className="w-full relative z-10">
            Let's Explore!
          </Button>
        </DialogContent>
      </Dialog>

      <TutorialOptInModal 
        open={showTutorialOptIn} 
        onOpenChange={setShowTutorialOptIn} 
      />
    </>
  );
}
