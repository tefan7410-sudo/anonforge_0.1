import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MilestoneAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary';
}

interface MilestoneSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  primaryAction?: MilestoneAction;
  secondaryAction?: MilestoneAction;
  icon?: React.ReactNode;
}

export function MilestoneSuccessModal({
  open,
  onOpenChange,
  title,
  description,
  primaryAction,
  secondaryAction,
  icon,
}: MilestoneSuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {icon || (
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            )}
          </div>
          <DialogTitle className="text-xl font-display">{title}</DialogTitle>
          <DialogDescription className="text-center pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-2 pt-4">
          {primaryAction && (
            <Button
              onClick={() => {
                primaryAction.onClick();
                onOpenChange(false);
              }}
              className="w-full"
              variant={primaryAction.variant || 'default'}
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={() => {
                secondaryAction.onClick();
                onOpenChange(false);
              }}
              variant={secondaryAction.variant || 'outline'}
              className="w-full"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
