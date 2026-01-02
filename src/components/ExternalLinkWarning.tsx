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
import { ExternalLink, AlertTriangle } from 'lucide-react';

interface ExternalLinkWarningProps {
  isOpen: boolean;
  url: string | null;
  dontShowAgain: boolean;
  onContinue: () => void;
  onCancel: () => void;
  onToggleDontShowAgain: () => void;
}

export function ExternalLinkWarning({
  isOpen,
  url,
  dontShowAgain,
  onContinue,
  onCancel,
  onToggleDontShowAgain,
}: ExternalLinkWarningProps) {
  // Extract hostname for display
  const hostname = url ? (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  })() : '';

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            You are leaving AnonForge
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                You are about to visit an external website:
              </p>
              <div className="rounded-lg border bg-muted/50 p-3 font-mono text-sm break-all">
                {hostname}
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <span>
                  AnonForge is not responsible for content on external websites. 
                  Always verify you're on the correct website before entering any information.
                </span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center gap-2 py-2">
          <Checkbox 
            id="dont-show-again" 
            checked={dontShowAgain}
            onCheckedChange={onToggleDontShowAgain}
          />
          <Label 
            htmlFor="dont-show-again" 
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Don't show this warning again this session
          </Label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onContinue}>
            Continue
            <ExternalLink className="ml-2 h-4 w-4" />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
