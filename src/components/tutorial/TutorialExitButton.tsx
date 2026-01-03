import React from 'react';
import { Button } from '@/components/ui/button';
import { X, GraduationCap } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const TutorialExitButton: React.FC = () => {
  const { isActive, skipTutorial, currentStep, totalSteps } = useTutorial();

  if (!isActive) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9998] flex items-center gap-2">
      <div className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1.5 shadow-lg">
        <GraduationCap className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          Tutorial {currentStep}/{totalSteps}
        </span>
      </div>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full shadow-lg"
            onClick={skipTutorial}
          >
            <X className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          Exit tutorial
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
