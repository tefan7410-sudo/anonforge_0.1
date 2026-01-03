import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GraduationCap, Layers, Sparkles, Zap } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';

interface TutorialOptInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TutorialOptInModal: React.FC<TutorialOptInModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { startTutorial, skipTutorial } = useTutorial();

  const handleStart = async () => {
    await startTutorial();
    onOpenChange(false);
  };

  const handleSkip = async () => {
    await skipTutorial();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">Want a Quick Tour?</DialogTitle>
          <DialogDescription className="text-base">
            Learn the basics in just 2 minutes with our interactive tutorial.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Layers className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Organize Layers</p>
              <p className="text-xs text-muted-foreground">
                Learn how to structure your NFT collection
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Generate NFTs</p>
              <p className="text-xs text-muted-foreground">
                Create unique combinations from your layers
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Zap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Explore an Example</p>
              <p className="text-xs text-muted-foreground">
                See a complete project with real layers
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={handleStart} className="w-full">
            Start Tutorial
          </Button>
          <Button variant="ghost" onClick={handleSkip} className="w-full">
            Skip for Now
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          You can restart the tutorial anytime from your Profile settings.
        </p>
      </DialogContent>
    </Dialog>
  );
};
