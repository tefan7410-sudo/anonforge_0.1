import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCreditBalance, useCreditTransactions } from '@/hooks/use-credits';
import { CREDIT_TIERS, MONTHLY_FREE_CREDITS, CREDIT_COSTS, formatCredits } from '@/lib/credit-constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Layers,
  Coins,
  Sparkles,
  Clock,
  ExternalLink,
  History,
  Zap,
  Image as ImageIcon,
  LogOut,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MobileNav } from '@/components/MobileNav';
import { FloatingHelpButton } from '@/components/FloatingHelpButton';

export default function Credits() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const {
    credits,
    isLoading,
    totalCredits,
    freeCredits,
    purchasedCredits,
    fullResGenerationsRemaining,
    previewGenerationsRemaining,
    nextResetAt,
    daysUntilReset,
    isLowCredits,
  } = useCreditBalance();
  
  const { data: transactions, isLoading: transactionsLoading } = useCreditTransactions(20);

  const handlePurchase = (tier: typeof CREDIT_TIERS[number]) => {
    // Open NMKR payment link - for now just show toast
    toast({
      title: 'Coming Soon',
      description: `Payment integration for ${tier.credits} credits (${tier.priceAda} ADA) will be available soon.`,
    });
    // TODO: Integrate with NMKR payment links
    // window.open(`https://pay.nmkr.io/...`, '_blank');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase': return 'Purchase';
      case 'monthly_reset': return 'Monthly Reset';
      case 'admin_add': return 'Admin Credit';
      case 'admin_remove': return 'Admin Adjustment';
      case 'credits_depleted': return 'Credits Depleted';
      default: return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'text-green-500';
      case 'monthly_reset': return 'text-blue-500';
      case 'admin_add': return 'text-green-500';
      case 'admin_remove': return 'text-orange-500';
      case 'credits_depleted': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Coins className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-base sm:text-xl font-semibold">Credits</h1>
                <p className="hidden sm:block text-sm text-muted-foreground">Manage your generation credits</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={handleSignOut} className="hidden md:inline-flex">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
            <MobileNav />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-6 py-8">
        <div className="space-y-8">
          {/* Credit Balance Card */}
          <Card className={isLowCredits ? 'border-orange-500/50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Coins className="h-5 w-5" />
                Credit Balance
                {isLowCredits && (
                  <Badge variant="outline" className="border-orange-500 text-orange-500 ml-2">
                    Low Balance
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Your current credits and generation capacity</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Total Credits */}
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Sparkles className="h-4 w-4" />
                      Total Credits
                    </div>
                    <p className="text-3xl font-bold">{formatCredits(totalCredits)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCredits(freeCredits)} free + {formatCredits(purchasedCredits)} purchased
                    </p>
                  </div>

                  {/* Full Resolution Capacity */}
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <ImageIcon className="h-4 w-4" />
                      Full Resolution
                    </div>
                    <p className="text-3xl font-bold">{fullResGenerationsRemaining.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      3000×3000 exports remaining
                    </p>
                  </div>

                  {/* Preview Capacity */}
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Zap className="h-4 w-4" />
                      Preview Mode
                    </div>
                    <p className="text-3xl font-bold">{previewGenerationsRemaining.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      384×384 exports remaining
                    </p>
                  </div>
                </div>
              )}

              {/* Next Reset Info */}
              {nextResetAt && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Free credits reset in <span className="font-medium text-foreground">{daysUntilReset} days</span>
                    {' '}({format(new Date(nextResetAt), 'MMM d, yyyy')})
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credit Info - How Credits Work */}
          <Card className="border-border/50 bg-muted/20">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">How Credits Work</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Every user receives <strong className="text-foreground">{MONTHLY_FREE_CREDITS} free credits</strong> each month, resetting on your registration anniversary.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ImageIcon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Full resolution (3000×3000) exports cost <strong className="text-foreground">{CREDIT_COSTS.FULL_RESOLUTION} credits</strong> each.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Preview (384×384) exports cost only <strong className="text-foreground">{CREDIT_COSTS.PREVIEW} credits</strong> each — 20x cheaper!</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Free credits reset monthly. Purchased credits <strong className="text-foreground">never expire</strong>.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <TrendingUp className="h-5 w-5" />
                Buy More Credits
              </CardTitle>
              <CardDescription>
                Purchase additional credits for larger batch generations. Credits never expire.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {CREDIT_TIERS.map((tier) => (
                  <Card 
                    key={tier.id} 
                    className={`relative border-2 transition-all hover:border-primary/50 ${
                      tier.badge ? 'border-primary/30' : 'border-border/50'
                    }`}
                  >
                    {tier.badge && (
                      <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                        {tier.badge}
                      </Badge>
                    )}
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-2xl font-display">{tier.label}</CardTitle>
                      <div className="mt-2">
                        <span className="text-4xl font-bold">{tier.credits.toLocaleString()}</span>
                        <span className="text-muted-foreground ml-1">credits</span>
                      </div>
                      <div className="text-2xl font-semibold text-primary">
                        {tier.priceAda} ADA
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Separator />
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-primary shrink-0" />
                          <span>{tier.fullResExports.toLocaleString()} full-res exports</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary shrink-0" />
                          <span>{tier.previewExports.toLocaleString()} preview exports</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary shrink-0" />
                          <span>Never expires</span>
                        </li>
                      </ul>
                      <Button 
                        className="w-full" 
                        variant={tier.badge ? 'default' : 'outline'}
                        onClick={() => handlePurchase(tier)}
                      >
                        Buy Now
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <p className="text-sm text-muted-foreground text-center mt-6">
                All payments are processed securely through NMKR Pay in ADA.
              </p>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <History className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>Your recent credit activity</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : transactions && transactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getTransactionTypeColor(tx.transaction_type)}>
                            {getTransactionTypeLabel(tx.transaction_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {tx.description || (tx.generation_type === 'full_resolution' ? 'Full resolution generation' : tx.generation_type === 'preview' ? 'Preview generation' : '-')}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${tx.amount > 0 ? 'text-green-500' : 'text-orange-500'}`}>
                          {tx.amount > 0 ? '+' : ''}{formatCredits(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Start generating to see your credit activity</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>

      <FloatingHelpButton />
    </div>
  );
}
