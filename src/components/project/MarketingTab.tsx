import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDropzone } from 'react-dropzone';
import { DateRange } from 'react-day-picker';
import {
  useProjectMarketingRequest,
  useCreateMarketingRequest,
  useUploadMarketingImage,
  useMarketingBookings,
  useCreateMarketingPaymentIntent,
  useExistingMarketingPayment,
  calculateMarketingPrice,
  type MarketingPaymentIntent,
} from '@/hooks/use-marketing';
import { useProductPage } from '@/hooks/use-product-page';
import { useProject } from '@/hooks/use-project';
import { useMarketingWalletPayment } from '@/hooks/use-marketing-wallet-payment';
import { CountdownTimer } from '@/components/CountdownTimer';
import { MarketingPaymentModal } from '@/components/credits/MarketingPaymentModal';
import { MarketingWalletPaymentModal } from '@/components/credits/MarketingWalletPaymentModal';
import { WalletReconnectModal } from '@/components/credits/WalletReconnectModal';
import { MarketingPreviewModal } from './MarketingPreviewModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Sparkles,
  Clock,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  Users,
  Globe,
  Star,
  Lock,
  Loader2,
  AlertCircle,
  CalendarIcon,
  CalendarCheck,
  Wallet,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format, differenceInDays, eachDayOfInterval, addDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface MarketingTabProps {
  projectId: string;
  isLocked?: boolean;
  onSwitchTab?: (tab: string) => void;
}

const COMING_SOON_OPTIONS = [
  {
    icon: Users,
    title: 'Market with Top Creators',
    description: 'Collaborate with verified creators for cross-promotion',
  },
  {
    icon: Globe,
    title: 'Cross-Platform Promotion',
    description: 'Reach audiences on Twitter and Discord',
  },
  {
    icon: Star,
    title: 'Influencer Partnerships',
    description: 'Partner with NFT influencers for maximum reach',
  },
];

export function MarketingTab({ projectId, isLocked, onSwitchTab }: MarketingTabProps) {
  const { user } = useAuth();
  const { data: marketingRequest, isLoading } = useProjectMarketingRequest(projectId);
  const { data: productPage } = useProductPage(projectId);
  const { data: project } = useProject(projectId);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const { data: bookings = [] } = useMarketingBookings();
  const createRequest = useCreateMarketingRequest();
  const uploadImage = useUploadMarketingImage();
  const createPaymentIntent = useCreateMarketingPaymentIntent();

  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [message, setMessage] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<MarketingPaymentIntent | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [walletPaymentModalOpen, setWalletPaymentModalOpen] = useState(false);
  const [walletConnectModalOpen, setWalletConnectModalOpen] = useState(false);

  // Wallet payment hook
  const walletPayment = useMarketingWalletPayment();

  // Check for existing pending payment (session persistence)
  const { data: existingPayment } = useExistingMarketingPayment(
    marketingRequest?.status === 'approved' ? marketingRequest.id : null
  );

  // Auto-resume existing payment session by calling the edge function
  // (which will return the existing payment with full details including address)
  useEffect(() => {
    const resumePayment = async () => {
      if (existingPayment && marketingRequest?.status === 'approved' && !paymentIntent) {
        try {
          // Call the edge function which will return the existing payment details
          const intent = await createPaymentIntent.mutateAsync(marketingRequest.id);
          setPaymentIntent(intent);
          setPaymentModalOpen(true);
        } catch {
          // Error handled by hook
        }
      }
    };
    resumePayment();
  }, [existingPayment, marketingRequest?.status, marketingRequest?.id]);

  // Payment deadline for approved requests (24h from approval)
  const paymentDeadline = useMemo(() => {
    if (marketingRequest?.status === 'approved' && marketingRequest.approved_at) {
      const deadline = new Date(marketingRequest.approved_at);
      deadline.setHours(deadline.getHours() + 24);
      return deadline;
    }
    return null;
  }, [marketingRequest]);

  const isPaymentExpired = paymentDeadline ? new Date() > paymentDeadline : false;

  // Check if user can create a new request (terminal states)
  const canCreateNewRequest = 
    marketingRequest?.status === 'rejected' || 
    marketingRequest?.status === 'completed' || 
    marketingRequest?.status === 'expired' ||
    marketingRequest?.status === 'cancelled' ||
    (marketingRequest?.status === 'approved' && isPaymentExpired);

  // Calculate duration and price from selected range
  const durationDays = useMemo(() => {
    if (!selectedRange?.from || !selectedRange?.to) return 0;
    return differenceInDays(selectedRange.to, selectedRange.from) + 1;
  }, [selectedRange]);

  const totalPrice = calculateMarketingPrice(durationDays);

  // Categorize booked dates
  const { bookedDates, pendingDates } = useMemo(() => {
    const booked: Date[] = [];
    const pending: Date[] = [];

    bookings.forEach((booking) => {
      if (!booking.start_date || !booking.end_date) return;
      
      const start = new Date(booking.start_date);
      const end = new Date(booking.end_date);
      const days = eachDayOfInterval({ start, end });

      if (booking.status === 'active' || booking.status === 'approved' || booking.status === 'paid') {
        booked.push(...days);
      } else if (booking.status === 'pending') {
        pending.push(...days);
      }
    });

    return { bookedDates: booked, pendingDates: pending };
  }, [bookings]);

  // Check if selected range overlaps with booked dates
  const hasOverlapWithBooked = useMemo(() => {
    if (!selectedRange?.from || !selectedRange?.to) return false;
    const selectedDays = eachDayOfInterval({ start: selectedRange.from, end: selectedRange.to });
    return selectedDays.some(day => 
      bookedDates.some(bookedDay => 
        startOfDay(day).getTime() === startOfDay(bookedDay).getTime()
      )
    );
  }, [selectedRange, bookedDates]);

  // Note: hasOverlapWithPending removed - pending dates are now disabled in calendar

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage.mutateAsync({ file, projectId });
      setHeroImageUrl(url);
    } finally {
      setUploading(false);
    }
  }, [projectId, uploadImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleSubmit = async () => {
    if (!user || !selectedRange?.from || !selectedRange?.to) return;
    if (durationDays > 5 || hasOverlapWithBooked) return;

    await createRequest.mutateAsync({
      projectId,
      userId: user.id,
      durationDays,
      startDate: selectedRange.from.toISOString(),
      endDate: selectedRange.to.toISOString(),
      message: message || undefined,
      heroImageUrl: heroImageUrl || undefined,
    });
  };

  // Handle starting payment flow
  const handleStartPayment = async () => {
    if (!marketingRequest) return;
    
    try {
      const intent = await createPaymentIntent.mutateAsync(marketingRequest.id);
      setPaymentIntent(intent);
      setPaymentModalOpen(true);
    } catch {
      // Error handled by hook
    }
  };

  // Disable dates that are booked, pending, in the past, or today (can never purchase for today)
  const tomorrow = addDays(startOfDay(new Date()), 1);
  const disabledDays = [
    { before: tomorrow }, // Can't select today or earlier
    ...bookedDates.map(date => startOfDay(date)),
    ...pendingDates.map(date => startOfDay(date)), // Also disable pending dates
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Show locked state if product page not set up
  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Card className="max-w-lg w-full text-center">
          <CardHeader className="pb-3">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="font-display text-lg">Set Up Your Product Page First</CardTitle>
            <CardDescription className="text-sm">
              Complete your Product Page to unlock marketing options.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="text-left rounded-lg border bg-muted/30 p-3">
              <h4 className="text-xs font-medium mb-2">What you'll unlock:</h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Featured Spotlight on homepage
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5" />
                  Priority placement in marketplace
                </li>
                <li className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5" />
                  Increased visibility for your collection
                </li>
              </ul>
            </div>
            <Button 
              className="w-full" 
              onClick={() => onSwitchTab?.('product')}
            >
              Go to Product Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show current status if there's an existing request (unless user chose to create new)
  if (marketingRequest && !showNewRequestForm) {
    return (
      <div className="space-y-4">
        {/* Current Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Marketing Status
            </CardTitle>
              <StatusBadge status={marketingRequest.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {marketingRequest.status === 'pending' && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-primary">Request Pending Review</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Being reviewed. You'll be notified once approved.
                    </p>
                    {marketingRequest.start_date && marketingRequest.end_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Dates: {format(new Date(marketingRequest.start_date), 'MMM d')} - {format(new Date(marketingRequest.end_date), 'MMM d, yyyy')} · Submitted {formatDistanceToNow(new Date(marketingRequest.created_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {marketingRequest.status === 'approved' && !isPaymentExpired && paymentDeadline && (
              <div className="space-y-3">
                <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Request Approved!</p>
                      <p className="text-xs text-muted-foreground">Complete payment within 24h to activate.</p>
                    </div>
                  </div>
                </div>

                {/* Spotlight Dates Confirmation */}
                {marketingRequest.start_date && marketingRequest.end_date && (
                  <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        {format(new Date(marketingRequest.start_date), 'MMM d')} - {format(new Date(marketingRequest.end_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-5">
                      Goes live at 00:01 UTC on {format(new Date(marketingRequest.start_date), 'MMM d')}
                    </p>
                  </div>
                )}

                {/* Payment Card */}
                <div className="rounded-lg border-2 border-primary/50 bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Complete Payment</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className="h-3.5 w-3.5 text-destructive" />
                      <CountdownTimer 
                        targetDate={paymentDeadline} 
                        compact 
                        className="text-destructive font-medium"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted p-3 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Amount Due</p>
                    <p className="text-xl font-bold">{marketingRequest.price_ada} ADA</p>
                  </div>

                  {/* Wallet Payment Option */}
                  <div className="space-y-2">
                    {walletPayment.isWalletConnected ? (
                      <Button 
                        className="w-full" 
                        onClick={() => {
                          setWalletPaymentModalOpen(true);
                          walletPayment.purchaseMarketingWithWallet(marketingRequest.id);
                        }}
                        disabled={walletPayment.isProcessing}
                      >
                        {walletPayment.isProcessing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Wallet className="mr-2 h-4 w-4" />
                        )}
                        Pay with Wallet ({marketingRequest.price_ada} ADA)
                      </Button>
                    ) : walletPayment.lastWalletKey ? (
                      <Button 
                        className="w-full" 
                        onClick={() => walletPayment.connectWallet(walletPayment.lastWalletKey!)}
                        disabled={walletPayment.isConnecting}
                      >
                        {walletPayment.isConnecting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Reconnect Wallet to Pay
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={() => setWalletConnectModalOpen(true)}
                      >
                        <Wallet className="mr-2 h-4 w-4" />
                        Connect Wallet to Pay
                      </Button>
                    )}

                    {/* Fallback: Manual Payment */}
                    <Button 
                      variant="outline"
                      className="w-full" 
                      onClick={handleStartPayment}
                      disabled={createPaymentIntent.isPending}
                    >
                      {createPaymentIntent.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Pay Manually
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Wallet payment is instant. Manual payment requires sending ADA to an address.
                  </p>
                </div>
              </div>
            )}

            {marketingRequest.status === 'approved' && isPaymentExpired && (
              <div className="space-y-3">
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-destructive shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Payment Window Expired</p>
                      <p className="text-xs text-muted-foreground">Submit a new request to continue.</p>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowNewRequestForm(true)}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Request New Campaign
                </Button>
              </div>
            )}

            {marketingRequest.status === 'paid' && (
              <div className={cn(
                "rounded-lg border p-3",
                (marketingRequest as any).is_free_promo 
                  ? "border-primary/30 bg-primary/10" 
                  : "border-primary/30 bg-primary/10"
              )}>
                <div className="flex items-start gap-2">
                  <CalendarCheck className={cn(
                    "h-4 w-4 shrink-0",
                    (marketingRequest as any).is_free_promo ? "text-primary" : "text-primary"
                  )} />
                  <div>
                    {(marketingRequest as any).is_free_promo ? (
                      <p className="text-sm font-medium text-primary">🎉 Complimentary Spotlight Scheduled!</p>
                    ) : (
                      <p className="text-sm font-medium text-primary">Payment Confirmed - Scheduled!</p>
                    )}
                    {marketingRequest.start_date && marketingRequest.end_date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(marketingRequest.start_date), 'MMM d')} - {format(new Date(marketingRequest.end_date), 'MMM d, yyyy')} · Goes live at 00:01 UTC
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {marketingRequest.status === 'active' && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-primary">Currently Featured!</p>
                    <p className="text-xs text-muted-foreground">
                      Your collection is being promoted{marketingRequest.end_date && ` · Ends ${format(new Date(marketingRequest.end_date), 'MMM d, yyyy')}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {marketingRequest.status === 'rejected' && (
              <div className="space-y-3">
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                  <div className="flex items-start gap-2">
                    <X className="h-4 w-4 text-destructive shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Request Rejected</p>
                      {marketingRequest.admin_notes && (
                        <p className="text-xs text-muted-foreground mt-0.5">Reason: {marketingRequest.admin_notes}</p>
                      )}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowNewRequestForm(true)}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Request New Campaign
                </Button>
              </div>
            )}

            {marketingRequest.status === 'completed' && (
              <div className="space-y-3">
                <div className="rounded-lg border border-muted bg-muted/50 p-3">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Campaign Completed</p>
                      {marketingRequest.start_date && marketingRequest.end_date && (
                        <p className="text-xs text-muted-foreground">
                          Ran: {format(new Date(marketingRequest.start_date), 'MMM d')} - {format(new Date(marketingRequest.end_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowNewRequestForm(true)}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Request New Campaign
                </Button>
              </div>
            )}

            {marketingRequest.status === 'cancelled' && (
              <div className="space-y-3">
                <div className="rounded-lg border border-muted bg-muted/50 p-3">
                  <div className="flex items-start gap-2">
                    <X className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Campaign Cancelled</p>
                      {marketingRequest.admin_notes && (
                        <p className="text-xs text-muted-foreground">Reason: {marketingRequest.admin_notes}</p>
                      )}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowNewRequestForm(true)}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Request New Campaign
                </Button>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs pt-2 border-t">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{marketingRequest.duration_days} day(s)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Price:</span>
                {(marketingRequest as any).is_free_promo ? (
                  <span className="font-medium text-purple-500">FREE</span>
                ) : (
                  <span className="font-medium">{marketingRequest.price_ada} ADA</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Modal (Manual) */}
        <MarketingPaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          paymentIntent={paymentIntent}
        />

        {/* Wallet Payment Modal */}
        <MarketingWalletPaymentModal
          open={walletPaymentModalOpen}
          onOpenChange={setWalletPaymentModalOpen}
          step={walletPayment.step}
          error={walletPayment.error}
          txHash={walletPayment.txHash}
          startDate={walletPayment.startDate}
          endDate={walletPayment.endDate}
          priceAda={marketingRequest.price_ada}
          onRetry={() => {
            walletPayment.reset();
            walletPayment.purchaseMarketingWithWallet(marketingRequest.id);
          }}
          onClose={() => {
            setWalletPaymentModalOpen(false);
            walletPayment.reset();
          }}
        />

        {/* Wallet Connect Modal */}
        <WalletReconnectModal
          open={walletConnectModalOpen}
          onClose={() => setWalletConnectModalOpen(false)}
          onConnect={async (walletKey) => {
            await walletPayment.connectWallet(walletKey);
            setWalletConnectModalOpen(false);
          }}
        />

        {/* Coming Soon Section */}
        <ComingSoonSection />
      </div>
    );
  }

  // Show request form
  return (
    <div className="space-y-4">
      {/* Spotlight Request Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">AnonForge Spotlight</CardTitle>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setPreviewOpen(true)}
                className="text-muted-foreground hover:text-foreground h-8 px-2 sm:px-3"
              >
                <Eye className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold">25 ADA</span>
                <span className="text-xs text-muted-foreground">/day</span>
              </div>
              <Badge variant="outline" className="text-xs hidden sm:inline-flex">Max 5 days</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Benefits */}
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-md border border-border/50 p-2">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs font-medium">Featured Badge</span>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border/50 p-2">
              <ImageIcon className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs font-medium">Hero Placement</span>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border/50 p-2">
              <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs font-medium">Marquee Banner</span>
            </div>
          </div>

          {/* Calendar Date Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Select Dates</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-left font-normal h-9",
                    !selectedRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {selectedRange?.from ? (
                    selectedRange.to ? (
                      <>
                        {format(selectedRange.from, "MMM d")} - {format(selectedRange.to, "MMM d, yyyy")}
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {durationDays} day{durationDays !== 1 ? 's' : ''}
                        </Badge>
                      </>
                    ) : (
                      format(selectedRange.from, "MMM d, yyyy")
                    )
                  ) : (
                    "Pick your marketing dates"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={selectedRange}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      const days = differenceInDays(range.to, range.from) + 1;
                      if (days > 5) {
                        range.to = addDays(range.from, 4);
                      }
                    }
                    setSelectedRange(range);
                  }}
                  disabled={disabledDays}
                  modifiers={{
                    booked: bookedDates,
                    pending: pendingDates,
                  }}
                  modifiersStyles={{
                    booked: { 
                      backgroundColor: 'hsl(var(--destructive) / 0.2)',
                      color: 'hsl(var(--destructive))',
                      textDecoration: 'line-through',
                    },
                    pending: { 
                      backgroundColor: 'hsl(var(--warning) / 0.2)',
                      border: '1px dashed hsl(var(--warning))',
                    },
                  }}
                  numberOfMonths={1}
                  className="p-2 pointer-events-auto"
                />
                <div className="border-t p-2 flex gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded bg-destructive/20 border border-destructive/50" />
                    <span className="text-muted-foreground">Booked</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded border border-dashed border-muted-foreground bg-muted" />
                    <span className="text-muted-foreground">Pending</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {(durationDays > 5 || hasOverlapWithBooked) && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {durationDays > 5 ? 'Maximum 5 consecutive days' : 'Dates overlap with existing booking'}
              </p>
            )}
          </div>

          {/* Hero Image Upload (Optional) */}
          <div className="space-y-1.5">
            <Label className="text-xs">Hero Image (optional, 16:9)</Label>
            <div
              {...getRootProps()}
              className={cn(
                'relative rounded-lg border-2 border-dashed p-4 text-center transition-colors cursor-pointer',
                isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
                uploading && 'opacity-50 pointer-events-none'
              )}
            >
              <input {...getInputProps()} />
              {heroImageUrl ? (
                <div className="space-y-1">
                  <img
                    src={heroImageUrl}
                    alt="Hero preview"
                    className="mx-auto max-h-24 rounded object-cover"
                  />
                  <p className="text-xs text-muted-foreground">Click to replace</p>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 py-1">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                  <p className="text-xs text-muted-foreground">
                    {isDragActive ? 'Drop image' : 'Upload image or use default gradient'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label className="text-xs">Message (optional)</Label>
            <Textarea
              placeholder="Any additional info..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Total & Submit */}
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-muted-foreground">Total:</span>
              <span className="text-xl font-bold">{totalPrice} ADA</span>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!selectedRange?.from || !selectedRange?.to || durationDays > 5 || hasOverlapWithBooked || createRequest.isPending}
            >
              {createRequest.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Request Spotlight
            </Button>
          </div>

          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            One collection at a time. Reviews take 24-48h. Payment required upon approval.
          </p>
        </CardContent>
      </Card>

      {/* Coming Soon Section */}
      <ComingSoonSection />

      {/* Marketing Preview Modal */}
      <MarketingPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        projectName={project?.name || 'Your Collection'}
        tagline={productPage?.tagline || undefined}
        logoUrl={productPage?.logo_url}
        heroImageUrl={heroImageUrl || productPage?.banner_url}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="gap-1 text-amber-600 border-amber-500/50">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="outline" className="gap-1 text-primary border-primary/50">
          <Check className="h-3 w-3" />
          Approved
        </Badge>
      );
    case 'active':
      return (
        <Badge className="gap-1 bg-amber-500 text-white">
          <Sparkles className="h-3 w-3" />
          Active
        </Badge>
      );
    case 'paid':
      return (
        <Badge variant="outline" className="gap-1 text-primary border-primary/50">
          <CalendarCheck className="h-3 w-3" />
          Scheduled
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="destructive" className="gap-1">
          <X className="h-3 w-3" />
          Rejected
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="secondary" className="gap-1">
          <Check className="h-3 w-3" />
          Completed
        </Badge>
      );
    default:
      return null;
  }
}

function ComingSoonSection() {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">Coming Soon</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-2 sm:grid-cols-3">
          {COMING_SOON_OPTIONS.map((option) => (
            <div
              key={option.title}
              className="relative flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 p-2 opacity-60"
            >
              <option.icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs font-medium truncate">{option.title}</span>
              <Lock className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
