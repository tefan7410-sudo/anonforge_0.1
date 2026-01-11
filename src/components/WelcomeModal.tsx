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
import { Sparkles } from 'lucide-react';
import { Logo } from '@/components/Logo';

const STORAGE_KEY = 'anonforge-welcome-seen';
const SESSION_KEY = 'anonforge-welcome-seen-session';

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
  const particles = useMemo(() => generateParticles(), []);

  useEffect(() => {
    // Check permanent preference first
    const hasSeenPermanent = localStorage.getItem(STORAGE_KEY);
    // Then check session preference
    const hasSeenSession = sessionStorage.getItem(SESSION_KEY);
    
    if (!hasSeenPermanent && !hasSeenSession) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    // Always save to session storage (won't show again this session)
    sessionStorage.setItem(SESSION_KEY, 'true');
    
    // Save to localStorage only if checkbox is checked
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setOpen(false);
  };

  const handleExplore = () => {
    // Mark as seen permanently (user actively engaged)
    localStorage.setItem(STORAGE_KEY, 'true');
    sessionStorage.setItem(SESSION_KEY, 'true');
    setOpen(false);
  };

  return (
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary p-3">
            <Logo className="h-full w-full" />
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
  );
}
