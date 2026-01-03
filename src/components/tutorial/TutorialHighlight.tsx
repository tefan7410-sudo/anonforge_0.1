import React, { useEffect, useState, useRef } from 'react';
import { useTutorial } from '@/contexts/TutorialContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const TutorialHighlight: React.FC = () => {
  const { isActive, currentStep, currentStepData, totalSteps, nextStep, previousStep, skipTutorial } = useTutorial();
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !currentStepData?.targetSelector) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const target = document.querySelector(currentStepData.targetSelector);
      if (target) {
        const rect = target.getBoundingClientRect();
        const padding = 8;
        setTargetRect({
          top: rect.top - padding + window.scrollY,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });

        // Position tooltip
        const tooltipWidth = 340;
        const tooltipHeight = 200;
        let top = rect.bottom + window.scrollY + 16;
        let left = rect.left + rect.width / 2 - tooltipWidth / 2;

        // Keep tooltip in viewport
        if (left < 16) left = 16;
        if (left + tooltipWidth > window.innerWidth - 16) {
          left = window.innerWidth - tooltipWidth - 16;
        }
        if (top + tooltipHeight > window.innerHeight + window.scrollY - 16) {
          top = rect.top + window.scrollY - tooltipHeight - 16;
        }

        setTooltipPosition({ top, left });
      } else {
        setTargetRect(null);
      }
    };

    // Initial find
    findTarget();

    // Re-find on resize/scroll
    const handleReposition = () => findTarget();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition);

    // Re-find periodically in case elements load late
    const interval = setInterval(findTarget, 500);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition);
      clearInterval(interval);
    };
  }, [isActive, currentStepData]);

  if (!isActive || !currentStepData) return null;

  const isLastStep = currentStep === totalSteps;
  const isFinalStep = !currentStepData.targetSelector;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dark overlay with spotlight cutout */}
      {targetRect && !isFinalStep && (
        <div
          className="absolute inset-0 pointer-events-auto"
          style={{
            background: `radial-gradient(ellipse ${targetRect.width + 40}px ${targetRect.height + 40}px at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent 0%, transparent 70%, rgba(0, 0, 0, 0.8) 100%)`,
          }}
          onClick={(e) => {
            // Allow clicks through to the target element
            const target = document.querySelector(currentStepData.targetSelector);
            if (target) {
              const rect = target.getBoundingClientRect();
              if (
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom
              ) {
                return;
              }
            }
            e.stopPropagation();
          }}
        />
      )}

      {/* Full overlay for final step */}
      {isFinalStep && (
        <div className="absolute inset-0 bg-black/80 pointer-events-auto" />
      )}

      {/* Spotlight border */}
      {targetRect && !isFinalStep && (
        <div
          className="absolute border-2 border-primary rounded-lg pointer-events-none animate-pulse"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          "absolute pointer-events-auto bg-card border border-border rounded-xl shadow-2xl p-5 w-[340px]",
          isFinalStep && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
        style={!isFinalStep ? { top: tooltipPosition.top, left: tooltipPosition.left } : undefined}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mt-1 -mr-1"
            onClick={skipTutorial}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {currentStepData.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          {currentStepData.description}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={previousStep}
            disabled={currentStep === 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <Button
            size="sm"
            onClick={nextStep}
            className="gap-1"
          >
            {isLastStep ? 'Finish' : 'Next'}
            {!isLastStep && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Skip link */}
        <button
          onClick={skipTutorial}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-4 transition-colors"
        >
          Skip tutorial
        </button>
      </div>
    </div>
  );
};
