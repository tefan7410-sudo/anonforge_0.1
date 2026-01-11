import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CountdownTimer } from '@/components/CountdownTimer';
import { 
  useMarketingPaymentStatus,
  useCancelMarketingPayment,
  type MarketingPaymentIntent,
} from '@/hooks/use-marketing';
import { toast } from 'sonner';
import { Check, Copy, Wallet, Loader2, AlertCircle, Sparkles, CalendarCheck } from 'lucide-react';
import { format } from 'date-fns';

interface MarketingPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentIntent: MarketingPaymentIntent | null;
}

export function MarketingPaymentModal({ 
  open, 
  onOpenChange, 
  paymentIntent 
}: MarketingPaymentModalProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const queryClient = useQueryClient();

  const { data: paymentStatus } = useMarketingPaymentStatus(
    paymentIntent?.paymentId ?? null,
    open
  );
  const cancelPayment = useCancelMarketingPayment();

  // Handle payment completion
  useEffect(() => {
    if (paymentStatus?.status === 'completed') {
      queryClient.invalidateQueries({ queryKey: ['marketing-request'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['all-marketing-requests'] });
      toast.success('Payment confirmed! Your spotlight is scheduled.');
    }
  }, [paymentStatus?.status, queryClient]);

  const copyToClipboard = async (text: string, type: 'address' | 'amount') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'address') {
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } else {
        setCopiedAmount(true);
        setTimeout(() => setCopiedAmount(false), 2000);
      }
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleExpiry = () => {
    queryClient.invalidateQueries({ queryKey: ['marketing-payment-status', paymentIntent?.paymentId] });
  };

  const handleCancel = async () => {
    if (!paymentIntent) return;
    try {
      await cancelPayment.mutateAsync(paymentIntent.paymentId);
      onOpenChange(false);
      toast.info('Payment cancelled');
    } catch {
      toast.error('Failed to cancel payment');
    }
  };

  if (!paymentIntent) return null;

  const isCompleted = paymentStatus?.status === 'completed';
  const isExpired = paymentStatus?.status === 'expired' || 
    (paymentIntent.expiresAt && new Date(paymentIntent.expiresAt) < new Date());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            {isCompleted ? 'Payment Complete!' : 'Complete Payment'}
          </DialogTitle>
          <DialogDescription>
            {isCompleted 
              ? 'Your spotlight is scheduled and will go live on the start date.'
              : 'Send the exact amount below to activate your spotlight.'}
          </DialogDescription>
        </DialogHeader>

        {isCompleted ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-2">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Payment Confirmed!</p>
                  <p className="text-sm text-muted-foreground">
                    Transaction verified on blockchain
                  </p>
                </div>
              </div>
            </div>

            {paymentIntent.startDate && paymentIntent.endDate && (
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarCheck className="h-4 w-4 text-primary" />
                  <span className="font-medium">Spotlight Dates</span>
                </div>
                <p className="text-sm">
                  {format(new Date(paymentIntent.startDate), 'MMMM d')} - {format(new Date(paymentIntent.endDate), 'MMMM d, yyyy')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Goes live at 00:01 UTC on the start date
                </p>
              </div>
            )}

            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : isExpired ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Payment Expired</p>
                  <p className="text-sm text-muted-foreground">
                    This payment window has expired. Please try again.
                  </p>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Spotlight Dates Confirmation */}
            {paymentIntent.startDate && paymentIntent.endDate && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarCheck className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-700 dark:text-amber-400">Your Spotlight Dates</span>
                </div>
                <p className="text-sm font-medium">
                  {format(new Date(paymentIntent.startDate), 'MMMM d')} - {format(new Date(paymentIntent.endDate), 'MMMM d, yyyy')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your campaign will go live at 00:01 UTC on {format(new Date(paymentIntent.startDate), 'MMMM d')}
                </p>
              </div>
            )}

            {/* Timer */}
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <span className="text-sm text-muted-foreground">Time remaining:</span>
              <CountdownTimer
                targetDate={new Date(paymentIntent.expiresAt)}
                compact
                className="font-mono font-medium"
                onComplete={handleExpiry}
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Send exactly this amount (includes unique identifier):</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg bg-muted p-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{paymentIntent.amountAda}</span>
                    <span className="text-lg font-medium text-muted-foreground">ADA</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Base: {paymentIntent.priceAda} ADA + {(paymentIntent.dustAmount / 1_000_000).toFixed(6)} ADA identifier
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(paymentIntent.amountAda, 'amount')}
                >
                  {copiedAmount ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">To this address:</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-muted p-3 text-xs font-mono break-all">
                  {paymentIntent.address}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(paymentIntent.address, 'address')}
                >
                  {copiedAddress ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Send <strong>exactly {paymentIntent.amountAda} ADA</strong>. The unique decimal amount
                is used to automatically verify your payment. Your spotlight will be scheduled once confirmed.
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Waiting for payment...
            </div>

            {/* Cancel button */}
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground"
              onClick={handleCancel}
              disabled={cancelPayment.isPending}
            >
              Cancel Payment
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
