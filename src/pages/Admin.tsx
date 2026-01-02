import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useIsAdmin, 
  useAdminCollections, 
  usePendingCollections,
  useToggleFounderVerified, 
  useToggleCollectionHidden,
  useApproveCollection,
  useRejectCollection,
} from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
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
} from 'lucide-react';
import { toast } from 'sonner';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: collections, isLoading: collectionsLoading } = useAdminCollections();
  const { data: pendingCollections, isLoading: pendingLoading } = usePendingCollections();
  const toggleVerified = useToggleFounderVerified();
  const toggleHidden = useToggleCollectionHidden();
  const approveCollection = useApproveCollection();
  const rejectCollection = useRejectCollection();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const copyCollectionLink = (projectId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/collection/${projectId}`);
    toast.success('Link copied!');
  };

  const handleRejectClick = (productPageId: string) => {
    setRejectingId(productPageId);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingId || !rejectReason.trim()) return;
    await rejectCollection.mutateAsync({ productPageId: rejectingId, reason: rejectReason });
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
              checked={collection.founder_verified}
              onCheckedChange={(checked) => 
                toggleVerified.mutate({ 
                  productPageId: collection.id, 
                  verified: checked,
                  founderTwitter: collection.founder_twitter,
                  ownerId: collection.project.owner_id,
                })
              }
              disabled={toggleVerified.isPending}
            />
            {collection.founder_verified && (
              <BadgeCheck className="h-4 w-4 text-primary" />
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
                  onClick={() => handleRejectClick(collection.id)}
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
            Manage founder verification, collection visibility, and review scheduled launches
          </p>
        </div>

        {/* Tabs for Pending Review / All Collections */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending Review
              {pendingCollections && pendingCollections.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center">
                  {pendingCollections.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <Store className="h-4 w-4" />
              All Collections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Pending Approval
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
                          <TableHead className="text-center">Verified</TableHead>
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
                    <p className="mt-4 text-muted-foreground">No collections pending review</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  All Collections
                </CardTitle>
                <CardDescription>
                  Manage all product pages across the platform
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
                          <TableHead className="text-center">Verified</TableHead>
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
        </Tabs>
      </main>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Collection</DialogTitle>
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
              disabled={!rejectReason.trim() || rejectCollection.isPending}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}