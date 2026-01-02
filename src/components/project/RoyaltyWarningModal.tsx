import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface RoyaltyWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dontShowAgain: boolean) => void;
  onCancel: () => void;
}

export function RoyaltyWarningModal({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: RoyaltyWarningModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfirm = () => {
    onConfirm(dontShowAgain);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Royalty Token Not Created
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              You haven't created a royalty token for this project. Without it, 
              you will <strong>NOT receive any royalties</strong> from secondary sales 
              on marketplaces like jpg.store.
            </p>
            <p>
              <strong>Recommended:</strong> Set up royalties (1-10%, typically 5%) 
              before selling your NFTs. This is a one-time setup that ensures you 
              earn from every resale.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-3">
          <div className="flex items-center space-x-2 mr-auto">
            <Checkbox
              id="dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <Label htmlFor="dont-show-again" className="text-sm cursor-pointer">
              Don't show this again, I understand
            </Label>
          </div>
          <div className="flex gap-2">
            <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Continue Without Royalties
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
