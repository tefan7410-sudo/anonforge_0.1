import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Wallet, 
  FileSignature,
  ExternalLink,
  CalendarCheck,
} from 'lucide-react';
import { MarketingWalletPaymentStep } from '@/hooks/use-marketing-wallet-payment';
import { format } from 'date-fns';

interface MarketingWalletPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: MarketingWalletPaymentStep;
  error: string | null;
  txHash: string | null;
  startDate: string | null;
  endDate: string | null;
  priceAda: number;
  onRetry: () => void;
  onClose: () => void;
}

const stepConfig: Record<MarketingWalletPaymentStep, { 
  title: string; 
  description: string; 
  icon: React.ReactNode;
}> = {
  idle: {
    title: 'Ready to Purchase',
    description: 'Click to start the payment process',
    icon: <Wallet className="h-8 w-8 text-primary" />,
  },
  building: {
    title: 'Building Transaction...',
    description: 'Preparing your payment transaction',
    icon: <Loader2 className="h-8 w-8 text-primary animate-spin" />,
  },
  signing: {
    title: 'Sign in Your Wallet',
    description: 'Please approve the transaction in your wallet',
    icon: <FileSignature className="h-8 w-8 text-primary" />,
  },
  submitting: {
    title: 'Submitting Transaction...',
    description: 'Broadcasting your transaction to the blockchain',
    icon: <Loader2 className="h-8 w-8 text-primary animate-spin" />,
  },
  complete: {
    title: 'Payment Complete!',
    description: 'Your spotlight has been scheduled',
    icon: <CheckCircle2 className="h-8 w-8 text-success" />,
  },
  error: {
    title: 'Payment Failed',
    description: 'Something went wrong with your payment',
    icon: <XCircle className="h-8 w-8 text-destructive" />,
  },
};

export function MarketingWalletPaymentModal({
  open,
  onOpenChange,
  step,
  error,
  txHash,
  startDate,
  endDate,
  priceAda,
  onRetry,
  onClose,
}: MarketingWalletPaymentModalProps) {
  const config = stepConfig[step];
  const isProcessing = step === 'building' || step === 'signing' || step === 'submitting';

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!isProcessing) {
        onOpenChange(open);
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Marketing Payment
          </DialogTitle>
          <DialogDescription>
            Featured Spotlight - {priceAda} ADA
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-6 space-y-4">
          {/* Step Icon */}
          <div className="p-4 rounded-full bg-muted/50">
            {config.icon}
          </div>

          {/* Step Title */}
          <h3 className="text-lg font-semibold text-center">{config.title}</h3>

          {/* Step Description */}
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            {config.description}
          </p>

          {/* Step Indicator */}
          {isProcessing && (
            <div className="flex items-center gap-2">
              {['building', 'signing', 'submitting'].map((s, i) => (
                <div
                  key={s}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    step === s 
                      ? 'bg-primary' 
                      : ['building', 'signing', 'submitting'].indexOf(step) > i
                        ? 'bg-primary/70'
                        : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Success Content */}
          {step === 'complete' && (
            <div className="space-y-4 w-full">
              <div className="rounded-lg border border-success/30 bg-success/10 p-4">
                {/* Scheduled Dates */}
                {startDate && endDate && (
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">Spotlight Scheduled</span>
                    </div>
                    <Badge variant="outline" className="text-success border-success">
                      {format(new Date(startDate), 'MMM d')} - {format(new Date(endDate), 'MMM d')}
                    </Badge>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mb-3">
                  Your collection will be featured on the homepage starting at 00:01 UTC on {startDate ? format(new Date(startDate), 'MMM d, yyyy') : 'the scheduled date'}.
                </p>

                {txHash && (
                  <div className="pt-3 border-t border-border/50">
                    <span className="text-xs text-muted-foreground block mb-1">Transaction Hash</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-foreground/80 break-all">
                        {txHash.slice(0, 20)}...{txHash.slice(-20)}
                      </code>
                      <a
                        href={`https://cardanoscan.io/transaction/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Content */}
          {step === 'error' && error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 w-full">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {step === 'error' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={onRetry}>
                Try Again
              </Button>
            </>
          )}
          
          {step === 'complete' && (
            <Button onClick={onClose} className="w-full">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Done
            </Button>
          )}

          {step === 'signing' && (
            <p className="text-xs text-muted-foreground text-center w-full">
              Check your wallet extension for the signing prompt
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
