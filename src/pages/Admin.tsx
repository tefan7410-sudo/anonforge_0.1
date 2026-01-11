import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useIsAdmin, 
  useIsOwner,
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
  useAllUserRoles,
  useAdminSetUserRole,
} from '@/hooks/use-admin';
import {
  usePendingAmbassadorRequests,
  useAllAmbassadors,
  useApproveAmbassadorRequest,
  useRejectAmbassadorRequest,
  useRemoveAmbassadorRole,
} from '@/hooks/use-admin-ambassadors';
import {
  useActionableMarketingRequests,
  useAllMarketingRequests,
  useApproveMarketingRequest,
  useApproveFreeMarketingRequest,
  useRejectMarketingRequest,
  useEndMarketingEarly,
  useCancelScheduledMarketing,
} from '@/hooks/use-marketing';
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
import { Logo } from '@/components/Logo';
import { 
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
  ArrowUpDown,
  Megaphone,
  Sparkles,
  Image as ImageIcon,
  StopCircle,
  Heart,
  Gift,
  Activity,
  UserX,
  ClipboardCheck,
  Users,
  Wallet,
  Settings,
  Crown,
  ShieldCheck,
  Bug,
} from 'lucide-react';
import { CostsAnalyticsTab } from '@/components/admin/CostsAnalyticsTab';
import { SystemStatusTab } from '@/components/admin/SystemStatusTab';
import { ArtFundTab } from '@/components/admin/ArtFundTab';
import { BugReportsTab } from '@/components/admin/BugReportsTab';
import { toast } from 'sonner';
import { FloatingHelpButton } from '@/components/FloatingHelpButton';
import { formatDistanceToNow, format } from 'date-fns';
import { formatCredits } from '@/lib/credit-constants';
import { useBugReportCount } from '@/hooks/use-bug-reports';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: isOwner, isLoading: ownerLoading } = useIsOwner();
  const { data: collections, isLoading: collectionsLoading } = useAdminCollections();
  const { data: pendingCollections, isLoading: pendingLoading } = usePendingCollections();
  const { data: pendingVerifications, isLoading: verificationsLoading } = usePendingVerificationRequests();
  const { data: pendingAmbassadors, isLoading: ambassadorsLoading } = usePendingAmbassadorRequests();
  const { data: allAmbassadors } = useAllAmbassadors();
  const { data: userCredits, isLoading: creditsLoading } = useAllUserCredits();
  const { data: actionableMarketing, isLoading: marketingLoading } = useActionableMarketingRequests();
  const { data: allMarketing } = useAllMarketingRequests();
  const { data: openBugCount } = useBugReportCount();
  const { data: allUserRoles, isLoading: rolesLoading } = useAllUserRoles();
  const toggleHidden = useToggleCollectionHidden();
  const approveCollection = useApproveCollection();
  const rejectCollection = useRejectCollection();
  const approveVerification = useApproveVerification();
  const rejectVerification = useRejectVerification();
  const approveAmbassador = useApproveAmbassadorRequest();
  const rejectAmbassador = useRejectAmbassadorRequest();
  const removeAmbassadorRole = useRemoveAmbassadorRole();
  const adjustCredits = useAdminAdjustCredits();
  const setUserRole = useAdminSetUserRole();
  const approveMarketing = useApproveMarketingRequest();
  const approveFreeMarketing = useApproveFreeMarketingRequest();
  const rejectMarketing = useRejectMarketingRequest();
  const endMarketing = useEndMarketingEarly();
  const cancelMarketing = useCancelScheduledMarketing();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectType, setRejectType] = useState<'collection' | 'verification' | 'marketing' | 'ambassador'>('collection');
  
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
  const [creditSortField, setCreditSortField] = useState<'total' | 'purchased' | 'free' | null>(null);
  const [creditSortOrder, setCreditSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Role management state
  const [roleSearchQuery, setRoleSearchQuery] = useState('');

  const { data: userTransactions, isLoading: transactionsLoading } = useUserCreditTransactions(transactionUserId);

  // Calculate total pending count for Approvals tab badge (includes marketing)
  const totalPendingCount = (pendingCollections?.length || 0) + (pendingVerifications?.length || 0) + (pendingAmbassadors?.length || 0) + (actionableMarketing?.length || 0);

  const toggleCreditSort = (field: 'total' | 'purchased' | 'free') => {
    if (creditSortField === field) {
      setCreditSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setCreditSortField(field);
      setCreditSortOrder('desc');
    }
  };

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

  // Filter and sort credits
  const filteredCredits = userCredits?.filter(credit => {
    if (!creditSearchQuery) return true;
    const query = creditSearchQuery.toLowerCase();
    const email = (credit.profile as any)?.email?.toLowerCase() || '';
    const name = (credit.profile as any)?.display_name?.toLowerCase() || '';
    return email.includes(query) || name.includes(query);
  });

  const sortedCredits = [...(filteredCredits || [])].sort((a, b) => {
    if (!creditSortField) return 0;
    
    let aVal: number, bVal: number;
    switch (creditSortField) {
      case 'total':
        aVal = a.free_credits + a.purchased_credits;
        bVal = b.free_credits + b.purchased_credits;
        break;
      case 'purchased':
        aVal = a.purchased_credits;
        bVal = b.purchased_credits;
        break;
      case 'free':
        aVal = a.free_credits;
        bVal = b.free_credits;
        break;
      default:
        return 0;
    }
    
    return creditSortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const handleRejectClick = (id: string, type: 'collection' | 'verification' | 'marketing' | 'ambassador') => {
    setRejectingId(id);
    setRejectType(type);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingId || !rejectReason.trim()) return;
    
    if (rejectType === 'collection') {
      await rejectCollection.mutateAsync({ productPageId: rejectingId, reason: rejectReason });
    } else if (rejectType === 'verification') {
      await rejectVerification.mutateAsync({ requestId: rejectingId, reason: rejectReason });
    } else if (rejectType === 'marketing') {
      await rejectMarketing.mutateAsync({ requestId: rejectingId, reason: rejectReason });
    } else if (rejectType === 'ambassador') {
      await rejectAmbassador.mutateAsync({ requestId: rejectingId, reason: rejectReason });
    }
    
    setRejectDialogOpen(false);
    setRejectingId(null);
    setRejectReason('');
  };

  if (authLoading || adminLoading || ownerLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  // Helper function to get user's current role display
  const getUserRole = (userRoles: { role: string }[]) => {
    const roles = userRoles.map(r => r.role);
    if (roles.includes('owner')) return 'owner';
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('ambassador')) return 'ambassador';
    return 'creator';
  };

  // Filter users for role management
  const filteredUserRoles = allUserRoles?.filter(user => {
    if (!roleSearchQuery) return true;
    const query = roleSearchQuery.toLowerCase();
    const email = user.email?.toLowerCase() || '';
    const name = user.display_name?.toLowerCase() || '';
    return email.includes(query) || name.includes(query);
  });

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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary p-2">
              <Logo className="h-full w-full" />
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

        {/* Consolidated Tabs */}
        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="approvals" className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Approvals
              {totalPendingCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 p-0 justify-center">
                  {totalPendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="collections" className="gap-2">
              <Store className="h-4 w-4" />
              Collections
            </TabsTrigger>
            {isOwner && (
              <>
                <TabsTrigger value="users" className="gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="treasury" className="gap-2">
                  <Wallet className="h-4 w-4" />
                  Treasury
                </TabsTrigger>
                <TabsTrigger value="operations" className="gap-2">
                  <Activity className="h-4 w-4" />
                  Status
                </TabsTrigger>
                <TabsTrigger value="bugs" className="gap-2">
                  <Bug className="h-4 w-4" />
                  Bug Reports
                  {openBugCount && openBugCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 min-w-5 p-0 justify-center">
                      {openBugCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Approvals Tab - Combines Pending Launches, Verification Requests, Ambassadors */}
          <TabsContent value="approvals" className="space-y-6">
            {/* Pending Launches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Pending Launch Approval
                  {pendingCollections && pendingCollections.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {pendingCollections.length}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Scheduled collections awaiting admin review before going live
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
                  <div className="text-center py-8">
                    <Check className="h-10 w-10 mx-auto text-green-500/30" />
                    <p className="mt-3 text-muted-foreground text-sm">No collections pending launch approval</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verification Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                  Creator Verification Requests
                  {pendingVerifications && pendingVerifications.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {pendingVerifications.length}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Creators requesting to be verified
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
                  <div className="text-center py-8">
                    <BadgeCheck className="h-10 w-10 mx-auto text-muted-foreground/30" />
                    <p className="mt-3 text-muted-foreground text-sm">No pending verification requests</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ambassador Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" />
                  Ambassador Requests
                  {pendingAmbassadors && pendingAmbassadors.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {pendingAmbassadors.length}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Users requesting to become ambassadors
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ambassadorsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : pendingAmbassadors && pendingAmbassadors.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Twitter/X</TableHead>
                          <TableHead>Requested</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingAmbassadors.map((request) => {
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
                                {request.twitter_link ? (
                                  <a 
                                    href={request.twitter_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                                  >
                                    <Twitter className="h-4 w-4" />
                                    {request.twitter_link.replace(/https?:\/\/(twitter\.com|x\.com)\//, '@')}
                                  </a>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
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
                                    onClick={() => approveAmbassador.mutate({ requestId: request.id, userId: request.user_id })}
                                    disabled={approveAmbassador.isPending}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleRejectClick(request.id, 'ambassador')}
                                    disabled={rejectAmbassador.isPending}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Reject
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
                  <div className="text-center py-8">
                    <Megaphone className="h-10 w-10 mx-auto text-muted-foreground/30" />
                    <p className="mt-3 text-muted-foreground text-sm">No pending ambassador requests</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Ambassadors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  Active Ambassadors
                </CardTitle>
                <CardDescription>
                  Users with ambassador role
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allAmbassadors && allAmbassadors.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allAmbassadors.map((ambassador) => {
                          const profile = ambassador.profile;
                          const displayName = profile?.display_name || profile?.email || 'Unknown';
                          return (
                            <TableRow key={ambassador.id}>
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
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => removeAmbassadorRole.mutate({ userId: ambassador.user_id })}
                                  disabled={removeAmbassadorRole.isPending}
                                >
                                  <UserX className="h-4 w-4 mr-1" />
                                  Remove Role
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserCheck className="h-10 w-10 mx-auto text-muted-foreground/30" />
                    <p className="mt-3 text-muted-foreground text-sm">No active ambassadors</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Currently Featured Marketing */}
            {allMarketing?.find(m => m.status === 'active') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Currently Featured
                  </CardTitle>
                  <CardDescription>
                    This collection is currently being promoted across AnonForge
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const active = allMarketing?.find(m => m.status === 'active');
                    if (!active) return null;
                    return (
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-amber-500/5 border-amber-500/20">
                        <div>
                          <p className="font-semibold">{active.project.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Ends: {active.end_date && format(new Date(active.end_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive/50 hover:bg-destructive/10"
                          onClick={() => endMarketing.mutate({ 
                            requestId: active.id, 
                            projectId: active.project_id 
                          })}
                          disabled={endMarketing.isPending}
                        >
                          <StopCircle className="h-4 w-4 mr-1" />
                          End Early
                        </Button>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Marketing Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" />
                  Marketing Requests
                  {actionableMarketing && actionableMarketing.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {actionableMarketing.length}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Pending requests, approved awaiting payment, and paid awaiting activation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {marketingLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : actionableMarketing && actionableMarketing.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Collection</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Hero Image</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {actionableMarketing.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <p className="font-medium">{request.project.name}</p>
                            </TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1">
                                <Badge 
                                  variant={
                                    request.status === 'pending' ? 'secondary' :
                                    request.status === 'approved' ? 'outline' :
                                    request.status === 'paid' ? 'default' : 'secondary'
                                  }
                                  className={
                                    request.status === 'paid' ? 'bg-green-600' :
                                    request.status === 'approved' ? 'text-primary border-primary/50' : ''
                                  }
                                >
                                  {request.status === 'pending' && 'Pending Review'}
                                  {request.status === 'approved' && 'Awaiting Payment'}
                                  {request.status === 'paid' && 'Ready to Activate'}
                                </Badge>
                                {(request as any).is_free_promo && (
                                  <Badge variant="outline" className="text-purple-600 border-purple-600">
                                    <Gift className="h-3 w-3 mr-1" />
                                    Free
                                  </Badge>
                                )}
                              </span>
                            </TableCell>
                            <TableCell>{request.duration_days} day(s)</TableCell>
                            <TableCell>
                              <span className="font-medium">{request.price_ada} ADA</span>
                            </TableCell>
                            <TableCell>
                              {request.hero_image_url ? (
                                <a 
                                  href={request.hero_image_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                                >
                                  <ImageIcon className="h-4 w-4" />
                                  View
                                </a>
                              ) : (
                                <span className="text-muted-foreground text-sm">None</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {request.status === 'pending' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-green-600 hover:text-green-700 hover:bg-green-100"
                                      onClick={() => approveMarketing.mutate({ requestId: request.id })}
                                      disabled={approveMarketing.isPending || approveFreeMarketing.isPending || !!allMarketing?.find(m => m.status === 'active')}
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                                      onClick={() => approveFreeMarketing.mutate({ requestId: request.id })}
                                      disabled={approveMarketing.isPending || approveFreeMarketing.isPending || !!allMarketing?.find(m => m.status === 'active')}
                                      title="Approve as free promotional spotlight"
                                    >
                                      <Gift className="h-4 w-4 mr-1" />
                                      Free Promo
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => handleRejectClick(request.id, 'marketing')}
                                      disabled={rejectMarketing.isPending}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {request.status === 'approved' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground"
                                    disabled
                                  >
                                    <Clock className="h-4 w-4 mr-1" />
                                    Awaiting Payment
                                  </Button>
                                )}
                                {request.status === 'paid' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => cancelMarketing.mutate({ requestId: request.id })}
                                    disabled={cancelMarketing.isPending}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Megaphone className="h-10 w-10 mx-auto text-muted-foreground/30" />
                    <p className="mt-3 text-muted-foreground text-sm">No actionable marketing requests</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Marketing History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Marketing History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allMarketing && allMarketing.filter(m => ['completed', 'approved', 'paid', 'active'].includes(m.status)).length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Collection</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allMarketing
                          .filter(m => ['completed', 'approved', 'paid', 'active'].includes(m.status))
                          .map((request) => (
                            <TableRow key={request.id}>
                              <TableCell>
                                <p className="font-medium">{request.project.name}</p>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    request.status === 'active' ? 'default' :
                                    request.status === 'paid' ? 'secondary' :
                                    request.status === 'approved' ? 'outline' :
                                    'secondary'
                                  }
                                  className={
                                    request.status === 'active' ? 'bg-amber-500' :
                                    request.status === 'paid' ? 'bg-green-600' :
                                    request.status === 'approved' ? 'text-primary border-primary/50' : ''
                                  }
                                >
                                  {request.status === 'active' && 'Active'}
                                  {request.status === 'paid' && 'Scheduled'}
                                  {request.status === 'approved' && 'Awaiting Payment'}
                                  {request.status === 'completed' && 'Completed'}
                                </Badge>
                              </TableCell>
                              <TableCell>{request.duration_days} day(s)</TableCell>
                              <TableCell className="font-medium">
                                {(request as any).is_free_promo ? (
                                  <span className="text-purple-600">FREE</span>
                                ) : (
                                  <span className="text-green-600">{request.price_ada} ADA</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {request.start_date && format(new Date(request.start_date), 'MMM d')} - {request.end_date && format(new Date(request.end_date), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell className="text-right">
                                {request.status === 'active' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => endMarketing.mutate({ 
                                      requestId: request.id, 
                                      projectId: request.project_id 
                                    })}
                                    disabled={endMarketing.isPending}
                                  >
                                    <StopCircle className="h-4 w-4 mr-1" />
                                    End Early
                                  </Button>
                                )}
                                {request.status === 'paid' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => cancelMarketing.mutate({ requestId: request.id })}
                                    disabled={cancelMarketing.isPending}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No marketing history yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections">
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

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Role Management Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Role Management
                </CardTitle>
                <CardDescription>
                  Manually assign or remove user roles for moderation purposes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="Search by email or name..."
                    value={roleSearchQuery}
                    onChange={(e) => setRoleSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                {rolesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredUserRoles && filteredUserRoles.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Wallet</TableHead>
                          <TableHead>Current Role</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUserRoles.map((userRole) => {
                          const displayName = userRole.display_name || userRole.email || 'Unknown';
                          const currentRole = getUserRole(userRole.user_roles || []);
                          const isOwnerUser = currentRole === 'owner';
                          
                          return (
                            <TableRow key={userRole.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={userRole.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">{displayName}</p>
                                    <p className="text-xs text-muted-foreground">{userRole.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {userRole.stake_address ? (
                                  <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-primary" />
                                    <div className="flex flex-col">
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(userRole.stake_address!);
                                          toast.success('Stake address copied!');
                                        }}
                                        className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1"
                                        title={userRole.stake_address}
                                      >
                                        {userRole.stake_address.slice(0, 12)}...{userRole.stake_address.slice(-6)}
                                        <Copy className="h-3 w-3" />
                                      </button>
                                      {userRole.wallet_connected_at && (
                                        <span className="text-[10px] text-muted-foreground">
                                          {formatDistanceToNow(new Date(userRole.wallet_connected_at), { addSuffix: true })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    currentRole === 'owner' ? 'default' :
                                    currentRole === 'admin' ? 'secondary' :
                                    currentRole === 'ambassador' ? 'outline' :
                                    'secondary'
                                  }
                                  className={
                                    currentRole === 'owner' ? 'bg-amber-500 text-white gap-1' :
                                    currentRole === 'admin' ? 'bg-primary/80 text-primary-foreground gap-1' :
                                    currentRole === 'ambassador' ? 'text-green-600 border-green-600/50 gap-1' :
                                    'text-muted-foreground gap-1'
                                  }
                                >
                                  {currentRole === 'owner' && <Crown className="h-3 w-3" />}
                                  {currentRole === 'admin' && <Shield className="h-3 w-3" />}
                                  {currentRole === 'ambassador' && <Megaphone className="h-3 w-3" />}
                                  {currentRole === 'creator' && <Users className="h-3 w-3" />}
                                  {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {isOwnerUser ? (
                                  <span className="text-xs text-muted-foreground italic">Protected</span>
                                ) : (
                                  <div className="flex items-center justify-end gap-1">
                                    {currentRole !== 'creator' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-muted-foreground hover:text-foreground"
                                        onClick={() => setUserRole.mutate({ userId: userRole.id, role: null })}
                                        disabled={setUserRole.isPending}
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        Remove Role
                                      </Button>
                                    )}
                                    {currentRole !== 'ambassador' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-green-600 hover:text-green-700 hover:bg-green-100"
                                        onClick={() => setUserRole.mutate({ userId: userRole.id, role: 'ambassador' })}
                                        disabled={setUserRole.isPending}
                                      >
                                        <Megaphone className="h-4 w-4 mr-1" />
                                        Set Ambassador
                                      </Button>
                                    )}
                                    {currentRole !== 'admin' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-primary hover:text-primary hover:bg-primary/10"
                                        onClick={() => setUserRole.mutate({ userId: userRole.id, role: 'admin' })}
                                        disabled={setUserRole.isPending}
                                      >
                                        <Shield className="h-4 w-4 mr-1" />
                                        Set Admin
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/30" />
                    <p className="mt-4 text-muted-foreground">No users found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Credits Card */}
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
                ) : sortedCredits && sortedCredits.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead 
                            className="text-right cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => toggleCreditSort('free')}
                          >
                            <div className="flex items-center justify-end gap-1">
                              Free Credits
                              <ArrowUpDown className={`h-3 w-3 ${creditSortField === 'free' ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                          </TableHead>
                          <TableHead 
                            className="text-right cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => toggleCreditSort('purchased')}
                          >
                            <div className="flex items-center justify-end gap-1">
                              Purchased
                              <ArrowUpDown className={`h-3 w-3 ${creditSortField === 'purchased' ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                          </TableHead>
                          <TableHead 
                            className="text-right cursor-pointer hover:bg-muted/50 select-none"
                            onClick={() => toggleCreditSort('total')}
                          >
                            <div className="flex items-center justify-end gap-1">
                              Total
                              <ArrowUpDown className={`h-3 w-3 ${creditSortField === 'total' ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                          </TableHead>
                          <TableHead>Next Reset</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedCredits.map((credit) => {
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

          {/* Treasury Tab - Combines Costs & Analytics + Art Fund */}
          <TabsContent value="treasury">
            <Tabs defaultValue="revenue" className="space-y-6">
              <TabsList>
                <TabsTrigger value="revenue" className="gap-2">
                  <Coins className="h-4 w-4" />
                  Revenue & Costs
                </TabsTrigger>
                <TabsTrigger value="art-fund" className="gap-2">
                  <Heart className="h-4 w-4" />
                  Art Fund
                </TabsTrigger>
              </TabsList>
              <TabsContent value="revenue">
                <CostsAnalyticsTab />
              </TabsContent>
              <TabsContent value="art-fund">
                <ArtFundTab />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Status Tab - System Status only */}
          <TabsContent value="operations">
            <SystemStatusTab />
          </TabsContent>

          {/* Bug Reports Tab */}
          <TabsContent value="bugs">
            <BugReportsTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {rejectType === 'collection' 
                ? 'Reject Collection' 
                : rejectType === 'verification' 
                  ? 'Reject Verification Request'
                  : rejectType === 'ambassador'
                    ? 'Reject Ambassador Request'
                    : 'Reject Marketing Request'}
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
              disabled={!rejectReason.trim() || rejectCollection.isPending || rejectVerification.isPending || rejectAmbassador.isPending}
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
