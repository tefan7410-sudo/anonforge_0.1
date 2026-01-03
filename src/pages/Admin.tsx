import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useIsAdmin, 
  useAdminCollections, 
  usePendingCollections,
  usePendingVerificationRequests,
  useToggleCollectionHidden,
  useApproveCollection,
  useRejectCollection,
  useApproveVerification,
  useRejectVerification,
  useAllUserCredits,
  useUserCreditTransactions,
  useAdminAdjustCredits,
} from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CountdownTimer } from '@/components/CountdownTimer';
import { 
  Layers, 
  ArrowLeft, 
  Shield, 
  BadgeCheck, 
  Eye, 
  EyeOff,
  ExternalLink,
  Store,
  Clock,
  Check,
  X,
  Copy,
  AlertTriangle,
  UserCheck,
  Twitter,
  Coins,
  History,
  Plus,
  Minus,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { FloatingHelpButton } from '@/components/FloatingHelpButton';
import { formatDistanceToNow, format } from 'date-fns';
import { formatCredits } from '@/lib/credit-constants';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: collections, isLoading: collectionsLoading } = useAdminCollections();
  const { data: pendingCollections, isLoading: pendingLoading } = usePendingCollections();
  const { data: pendingVerifications, isLoading: verificationsLoading } = usePendingVerificationRequests();
  const { data: userCredits, isLoading: creditsLoading } = useAllUserCredits();
  const toggleHidden = useToggleCollectionHidden();
  const approveCollection = useApproveCollection();
  const rejectCollection = useRejectCollection();
  const approveVerification = useApproveVerification();
  const rejectVerification = useRejectVerification();
  const adjustCredits = useAdminAdjustCredits();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectType, setRejectType] = useState<'collection' | 'verification'>('collection');
  
  // Credit management state
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [creditAdjustType, setCreditAdjustType] = useState<'add' | 'remove'>('add');
  const [creditReason, setCreditReason] = useState('');
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transactionUserId, setTransactionUserId] = useState<string | null>(null);
  const [creditSearchQuery, setCreditSearchQuery] = useState('');
  
  const { data: userTransactions, isLoading: transactionsLoading } = useUserCreditTransactions(transactionUserId);

  const copyCollectionLink = (projectId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/collection/${projectId}`);
    toast.success('Link copied!');
  };

  const handleEditCredits = (userId: string, email: string) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(email);
    setCreditAmount('');
    setCreditAdjustType('add');
    setCreditReason('');
    setCreditDialogOpen(true);
  };

  const handleCreditAdjustConfirm = async () => {
    if (!selectedUserId || !creditAmount || !creditReason.trim()) return;
    
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }
    
    await adjustCredits.mutateAsync({
      userId: selectedUserId,
      amount,
      type: creditAdjustType,
      reason: creditReason,
    });
    
    setCreditDialogOpen(false);
    setSelectedUserId(null);
    setCreditAmount('');
    setCreditReason('');
  };

  const handleViewTransactions = (userId: string) => {
    setTransactionUserId(userId);
    setTransactionDialogOpen(true);
  };

  // Filter credits by search
  const filteredCredits = userCredits?.filter(credit => {
    if (!creditSearchQuery) return true;
    const query = creditSearchQuery.toLowerCase();
    const email = (credit.profile as any)?.email?.toLowerCase() || '';
    const name = (credit.profile as any)?.display_name?.toLowerCase() || '';
    return email.includes(query) || name.includes(query);
  });

  const handleRejectClick = (id: string, type: 'collection' | 'verification') => {
    setRejectingId(id);
    setRejectType(type);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingId || !rejectReason.trim()) return;
    
    if (rejectType === 'collection') {
      await rejectCollection.mutateAsync({ productPageId: rejectingId, reason: rejectReason });
    } else {
      await rejectVerification.mutateAsync({ requestId: rejectingId, reason: rejectReason });
    }
    
    setRejectDialogOpen(false);
    setRejectingId(null);
    setRejectReason('');
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const renderCollectionRow = (collection: NonNullable<typeof collections>[0], showApprovalActions = false) => {
    const isScheduled = collection.scheduled_launch_at && new Date(collection.scheduled_launch_at) > new Date();
    
    return (
      <TableRow key={collection.id}>
        <TableCell>
          <div className="flex items-center gap-3">
            {collection.logo_url ? (
              <img 
                src={collection.logo_url} 
                alt="" 
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Store className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-medium">{collection.project.name}</p>
              {collection.tagline && (
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {collection.tagline}
                </p>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="space-y-1">
            <span className="text-sm">
              {collection.founder_name || 'Anonymous'}
            </span>
            {collection.founder_twitter && (
              <p className="text-xs text-muted-foreground">@{collection.founder_twitter.replace('@', '')}</p>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 flex-wrap">
            {isScheduled ? (
              <>
                <Badge variant="default" className="bg-amber-500 gap-1">
                  <Clock className="h-3 w-3" />
                  Scheduled
                </Badge>
                <CountdownTimer 
                  targetDate={new Date(collection.scheduled_launch_at!)} 
                  compact 
                  className="text-xs text-muted-foreground"
                />
              </>
            ) : collection.is_live ? (
              <Badge variant="default" className="bg-green-600">Live</Badge>
            ) : (
              <Badge variant="secondary">Draft</Badge>
            )}
            {collection.is_hidden && (
              <Badge variant="destructive">Hidden</Badge>
            )}
            {collection.admin_approved && (
              <Badge variant="outline" className="text-green-600 border-green-600">Approved</Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Switch
              checked={!collection.is_hidden}
              onCheckedChange={(checked) => 
                toggleHidden.mutate({ 
                  productPageId: collection.id, 
                  hidden: !checked 
                })
              }
              disabled={toggleHidden.isPending}
            />
            {collection.is_hidden ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-green-600" />
            )}
          </div>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            {showApprovalActions && isScheduled && !collection.admin_approved && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-green-600 hover:text-green-700 hover:bg-green-100"
                  onClick={() => approveCollection.mutate({ productPageId: collection.id })}
                  disabled={approveCollection.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRejectClick(collection.id, 'collection')}
                  disabled={rejectCollection.isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => copyCollectionLink(collection.project_id)}
              title="Copy link"
            >
              <Copy className="h-4 w-4" />
            </Button>
            {collection.is_live && (
              <Button variant="ghost" size="icon" asChild>
                <a
                  href={`/collection/${collection.project_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderVerificationRow = (request: NonNullable<typeof pendingVerifications>[0]) => {
    const profile = request.profile;
    const displayName = profile?.display_name || profile?.email || 'Unknown';
    
    return (
      <TableRow key={request.id}>
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <a 
            href={`https://twitter.com/${request.twitter_handle.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm hover:text-primary"
          >
            <Twitter className="h-4 w-4" />
            @{request.twitter_handle.replace('@', '')}
          </a>
        </TableCell>
        <TableCell>
          <p className="text-sm text-muted-foreground line-clamp-2 max-w-[300px]">
            {request.bio || 'No bio provided'}
          </p>
        </TableCell>
        <TableCell>
          <span className="text-xs text-muted-foreground">
            {new Date(request.created_at).toLocaleDateString()}
          </span>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-green-600 hover:text-green-700 hover:bg-green-100"
              onClick={() => approveVerification.mutate({ 
                requestId: request.id, 
                userId: request.user_id 
              })}
              disabled={approveVerification.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Verify
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleRejectClick(request.id, 'verification')}
              disabled={rejectVerification.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <nav className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold">AnonForge</span>
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              Admin
            </Badge>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Manage collection launches, creator verifications, and platform visibility
          </p>
        </div>

        {/* Tabs for different admin functions */}
        <Tabs defaultValue="pending-launches" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending-launches" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending Launches
              {pendingCollections && pendingCollections.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center">
                  {pendingCollections.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="verification-requests" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Verification Requests
              {pendingVerifications && pendingVerifications.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center">
                  {pendingVerifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all-collections" className="gap-2">
              <Store className="h-4 w-4" />
              All Collections
            </TabsTrigger>
            <TabsTrigger value="user-credits" className="gap-2">
              <Coins className="h-4 w-4" />
              User Credits
            </TabsTrigger>
          </TabsList>

          {/* Pending Launches Tab */}
          <TabsContent value="pending-launches">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Pending Launch Approval
                </CardTitle>
                <CardDescription>
                  Scheduled collections awaiting admin review before going live (24h default wait)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : pendingCollections && pendingCollections.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Collection</TableHead>
                          <TableHead>Founder</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-center">Visible</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingCollections.map((collection) => renderCollectionRow(collection, true))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Check className="h-12 w-12 mx-auto text-green-500/30" />
                    <p className="mt-4 text-muted-foreground">No collections pending launch approval</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Requests Tab */}
          <TabsContent value="verification-requests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                  Creator Verification Requests
                </CardTitle>
                <CardDescription>
                  Creators requesting to be verified. Verified status applies to all their collections.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {verificationsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : pendingVerifications && pendingVerifications.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Creator</TableHead>
                          <TableHead>Twitter</TableHead>
                          <TableHead>Bio</TableHead>
                          <TableHead>Requested</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingVerifications.map((request) => renderVerificationRow(request))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BadgeCheck className="h-12 w-12 mx-auto text-muted-foreground/30" />
                    <p className="mt-4 text-muted-foreground">No pending verification requests</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Collections Tab */}
          <TabsContent value="all-collections">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  All Collections
                </CardTitle>
                <CardDescription>
                  Manage visibility for all product pages across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {collectionsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : collections && collections.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Collection</TableHead>
                          <TableHead>Founder</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-center">Visible</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {collections.map((collection) => renderCollectionRow(collection, false))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Store className="h-12 w-12 mx-auto text-muted-foreground/30" />
                    <p className="mt-4 text-muted-foreground">No collections found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Credits Tab */}
          <TabsContent value="user-credits">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  User Credits
                </CardTitle>
                <CardDescription>
                  Monitor and manage user credit balances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="Search by email or name..."
                    value={creditSearchQuery}
                    onChange={(e) => setCreditSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                {creditsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredCredits && filteredCredits.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead className="text-right">Free Credits</TableHead>
                          <TableHead className="text-right">Purchased</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Next Reset</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCredits.map((credit) => {
                          const profile = credit.profile as any;
                          const displayName = profile?.display_name || profile?.email || 'Unknown';
                          const totalCredits = credit.free_credits + credit.purchased_credits;
                          
                          return (
                            <TableRow key={credit.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={profile?.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">{displayName}</p>
                                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCredits(credit.free_credits)}
                              </TableCell>
                              <TableCell className="text-right font-medium text-green-600">
                                {formatCredits(credit.purchased_credits)}
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                {formatCredits(totalCredits)}
                              </TableCell>
                              <TableCell>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(credit.next_reset_at), 'MMM d, yyyy')}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewTransactions(credit.user_id)}
                                  >
                                    <History className="h-4 w-4 mr-1" />
                                    History
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditCredits(credit.user_id, profile?.email || 'Unknown')}
                                  >
                                    <Coins className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Coins className="h-12 w-12 mx-auto text-muted-foreground/30" />
                    <p className="mt-4 text-muted-foreground">No users found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {rejectType === 'collection' ? 'Reject Collection' : 'Reject Verification Request'}
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be shown to the creator.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || rejectCollection.isPending || rejectVerification.isPending}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Credits Dialog */}
      <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Adjust Credits
            </DialogTitle>
            <DialogDescription>
              Adjust credits for {selectedUserEmail}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup value={creditAdjustType} onValueChange={(v) => setCreditAdjustType(v as 'add' | 'remove')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="add" />
                <Label htmlFor="add" className="flex items-center gap-1 cursor-pointer">
                  <Plus className="h-4 w-4 text-green-600" />
                  Add Credits
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="remove" id="remove" />
                <Label htmlFor="remove" className="flex items-center gap-1 cursor-pointer">
                  <Minus className="h-4 w-4 text-red-600" />
                  Remove Credits
                </Label>
              </div>
            </RadioGroup>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.1"
                placeholder="Enter amount..."
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason <span className="text-destructive">*</span></Label>
              <Input
                id="reason"
                placeholder="Enter reason for adjustment..."
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreditAdjustConfirm}
              disabled={!creditAmount || !creditReason.trim() || adjustCredits.isPending}
            >
              {adjustCredits.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : creditAdjustType === 'add' ? (
                <Plus className="mr-2 h-4 w-4" />
              ) : (
                <Minus className="mr-2 h-4 w-4" />
              )}
              {creditAdjustType === 'add' ? 'Add' : 'Remove'} Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction History Dialog */}
      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Transaction History
            </DialogTitle>
            <DialogDescription>
              Recent credit transactions for this user
            </DialogDescription>
          </DialogHeader>
          {transactionsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : userTransactions && userTransactions.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
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
                  {userTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {tx.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tx.description || '-'}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-orange-500'}`}>
                        {tx.amount > 0 ? '+' : ''}{formatCredits(tx.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No transactions found</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransactionDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FloatingHelpButton />
    </div>
  );
}
