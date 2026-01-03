import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentIntent, usePaymentStatus, useCancelPayment } from '@/hooks/use-payment-intent';
import { CountdownTimer } from '@/components/CountdownTimer';
import { useQueryClient } from '@tanstack/react-query';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentIntent: PaymentIntent | null;
}

export function PaymentModal({ open, onOpenChange, paymentIntent }: PaymentModalProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const queryClient = useQueryClient();
  const cancelPayment = useCancelPayment();

  const { data: paymentStatus } = usePaymentStatus(paymentIntent?.paymentId || null, open);

  // Handle payment completion
  useEffect(() => {
    if (paymentStatus?.status === 'completed') {
      // Invalidate credits queries to refresh balance
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      queryClient.invalidateQueries({ queryKey: ['credit-balance'] });
      queryClient.invalidateQueries({ queryKey: ['credit-transactions'] });
      toast.success(`Payment received! ${paymentIntent?.credits} credits added to your account.`);
    }
  }, [paymentStatus?.status, paymentIntent?.credits, queryClient]);

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
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
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

  const handleExpiry = () => {
    queryClient.invalidateQueries({ queryKey: ['payment-status', paymentIntent?.paymentId] });
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
            {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {isExpired && <XCircle className="h-5 w-5 text-destructive" />}
            {!isCompleted && !isExpired && <Clock className="h-5 w-5 text-primary" />}
            {isCompleted ? 'Payment Complete!' : isExpired ? 'Payment Expired' : 'Complete Payment'}
          </DialogTitle>
          <DialogDescription>
            {isCompleted 
              ? `${paymentIntent.credits} credits have been added to your account.`
              : isExpired
              ? 'This payment has expired. Please create a new one.'
              : `Send exactly ${paymentIntent.displayAmount} ADA to receive ${paymentIntent.credits} credits.`
            }
          </DialogDescription>
        </DialogHeader>

        {isCompleted ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="rounded-full bg-green-500/10 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <p className="text-center text-muted-foreground">
              Transaction confirmed: {paymentStatus?.tx_hash?.slice(0, 16)}...
            </p>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Done
            </Button>
          </div>
        ) : isExpired ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="rounded-full bg-destructive/10 p-4">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <p className="text-center text-muted-foreground">
              Please start a new payment to continue.
            </p>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Timer */}
            <div className="flex items-center justify-center gap-2 rounded-lg bg-muted p-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Expires in:</span>
              <CountdownTimer 
                targetDate={new Date(paymentIntent.expiresAt)} 
                compact 
                onComplete={handleExpiry}
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (exact)</label>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg border bg-muted/50 p-3 font-mono text-lg font-semibold">
                  {paymentIntent.displayAmount} ADA
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(paymentIntent.displayAmount, 'amount')}
                >
                  {copiedAmount ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ Send the exact amount. Different amounts won't be recognized.
              </p>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Send to address</label>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg border bg-muted/50 p-3 font-mono text-xs break-all">
                  {paymentIntent.address}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(paymentIntent.address, 'address')}
                >
                  {copiedAddress ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Status indicator with warning */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-primary">Waiting for payment...</span>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Do not close this window. Transaction confirmation can take 1-2 minutes.
              </p>
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
