import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, ExternalLink, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'anonforge-welcome-seen';

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(STORAGE_KEY);
    if (!hasSeenWelcome) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Layers className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Welcome to AnonForge</DialogTitle>
          <Badge variant="outline" className="mx-auto mt-2 w-fit">
            <Sparkles className="mr-1 h-3 w-3" />
            Beta
          </Badge>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
                href="https://www.jpg.store/collection/anonforge"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Check out Anon Collection
              </a>
            </Button>
          </div>
        </div>

        <Button onClick={handleClose} className="w-full">
          Let's Explore!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
