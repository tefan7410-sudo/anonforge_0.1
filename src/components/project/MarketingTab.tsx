import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDropzone } from 'react-dropzone';
import { DateRange } from 'react-day-picker';
import {
  useProjectMarketingRequest,
  useCreateMarketingRequest,
  useUploadMarketingImage,
  useMarketingBookings,
  calculateMarketingPrice,
} from '@/hooks/use-marketing';
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
} from 'lucide-react';
import { formatDistanceToNow, format, differenceInDays, eachDayOfInterval, isWithinInterval, addDays, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface MarketingTabProps {
  projectId: string;
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

export function MarketingTab({ projectId }: MarketingTabProps) {
  const { user } = useAuth();
  const { data: marketingRequest, isLoading } = useProjectMarketingRequest(projectId);
  const { data: bookings = [] } = useMarketingBookings();
  const createRequest = useCreateMarketingRequest();
  const uploadImage = useUploadMarketingImage();

  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [message, setMessage] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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

      if (booking.status === 'active' || booking.status === 'approved') {
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

  const hasOverlapWithPending = useMemo(() => {
    if (!selectedRange?.from || !selectedRange?.to) return false;
    const selectedDays = eachDayOfInterval({ start: selectedRange.from, end: selectedRange.to });
    return selectedDays.some(day => 
      pendingDates.some(pendingDay => 
        startOfDay(day).getTime() === startOfDay(pendingDay).getTime()
      )
    );
  }, [selectedRange, pendingDates]);

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

  // Disable dates that are booked or in the past
  const disabledDays = [
    { before: startOfDay(new Date()) },
    ...bookedDates.map(date => startOfDay(date)),
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // Show current status if there's an existing request
  if (marketingRequest) {
    return (
      <div className="space-y-6">
        {/* Current Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Marketing Status
              </CardTitle>
              <StatusBadge status={marketingRequest.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {marketingRequest.status === 'pending' && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-600 dark:text-amber-400">
                      Request Pending Review
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your marketing request is being reviewed by our team. You'll be notified once approved.
                    </p>
                    {marketingRequest.start_date && marketingRequest.end_date && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Requested dates: {format(new Date(marketingRequest.start_date), 'MMM d')} - {format(new Date(marketingRequest.end_date), 'MMM d, yyyy')}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Submitted {formatDistanceToNow(new Date(marketingRequest.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {marketingRequest.status === 'approved' && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Request Approved!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your marketing will go live soon. Complete payment to activate.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {marketingRequest.status === 'active' && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-primary">Currently Featured!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your collection is being promoted across AnonForge.
                    </p>
                    {marketingRequest.end_date && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Ends {format(new Date(marketingRequest.end_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {marketingRequest.status === 'rejected' && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                <div className="flex items-start gap-3">
                  <X className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Request Rejected</p>
                    {marketingRequest.admin_notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Reason: {marketingRequest.admin_notes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      You can submit a new request after addressing the feedback.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">{marketingRequest.duration_days} day(s)</p>
              </div>
              <div>
                <p className="text-muted-foreground">Price</p>
                <p className="font-medium">{marketingRequest.price_ada} ADA</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Section */}
        <ComingSoonSection />
      </div>
    );
  }

  // Show request form
  return (
    <div className="space-y-6">
      {/* Spotlight Request Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <CardTitle>AnonForge Spotlight</CardTitle>
          </div>
          <CardDescription>
            Get your collection featured on our landing page and marketplace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-2 rounded-lg border border-border/50 p-3">
              <Sparkles className="h-4 w-4 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Featured Badge</p>
                <p className="text-xs text-muted-foreground">Stand out in marketplace</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-border/50 p-3">
              <ImageIcon className="h-4 w-4 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Hero Placement</p>
                <p className="text-xs text-muted-foreground">Landing page spotlight</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-border/50 p-3">
              <Globe className="h-4 w-4 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Marquee Banner</p>
                <p className="text-xs text-muted-foreground">Scrolling promotion</p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-2xl font-bold">25 ADA</p>
                <p className="text-sm text-muted-foreground">per day</p>
              </div>
              <Badge variant="outline">Max 5 days</Badge>
            </div>
          </div>

          {/* Calendar Date Selector */}
          <div className="space-y-2">
            <Label>Select Dates</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedRange?.from ? (
                    selectedRange.to ? (
                      <>
                        {format(selectedRange.from, "MMM d")} - {format(selectedRange.to, "MMM d, yyyy")}
                        <Badge variant="secondary" className="ml-auto">
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
                    // Enforce max 5 days
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
                  className="p-3 pointer-events-auto"
                />
                {/* Legend */}
                <div className="border-t p-3 space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-destructive/20 border border-destructive/50" />
                    <span className="text-muted-foreground">Booked (unavailable)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded border border-dashed border-amber-500 bg-amber-500/20" />
                    <span className="text-muted-foreground">Pending request</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Validation messages */}
            {durationDays > 5 && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Maximum 5 consecutive days allowed
              </p>
            )}
            {hasOverlapWithBooked && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Selected dates overlap with an existing booking
              </p>
            )}
            {hasOverlapWithPending && !hasOverlapWithBooked && (
              <p className="text-sm text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Note: Some dates have pending requests (yours may be queued)
              </p>
            )}
          </div>

          {/* Hero Image Upload (Optional) */}
          <div className="space-y-2">
            <Label>Hero Image (optional, 16:9 recommended)</Label>
            <div
              {...getRootProps()}
              className={cn(
                'relative rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer',
                isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
                uploading && 'opacity-50 pointer-events-none'
              )}
            >
              <input {...getInputProps()} />
              {heroImageUrl ? (
                <div className="space-y-2">
                  <img
                    src={heroImageUrl}
                    alt="Hero preview"
                    className="mx-auto max-h-40 rounded-lg object-cover"
                  />
                  <p className="text-xs text-muted-foreground">Click or drag to replace</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {uploading ? (
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {isDragActive ? 'Drop image here' : 'Upload a 16:9 image (optional)'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Without an image, the default gradient will be used
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Message to Admin (optional)</Label>
            <Textarea
              placeholder="Any additional information..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Total & Submit */}
          <div className="flex items-center justify-between rounded-lg bg-muted p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{totalPrice} ADA</p>
            </div>
            <Button
              size="lg"
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

          {/* Note */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              Only one collection can be featured at a time. Requests are reviewed within 24-48 hours.
              Payment is required upon approval.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Section */}
      <ComingSoonSection />
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
      <CardHeader>
        <CardTitle className="text-muted-foreground">Coming Soon</CardTitle>
        <CardDescription>More marketing options are on the way</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          {COMING_SOON_OPTIONS.map((option) => (
            <div
              key={option.title}
              className="relative rounded-lg border border-border/50 bg-muted/30 p-4 opacity-60"
            >
              <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <option.icon className="mb-3 h-6 w-6 text-muted-foreground" />
              <p className="font-medium">{option.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
