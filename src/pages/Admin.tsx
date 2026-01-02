import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin, useAdminCollections, useToggleFounderVerified, useToggleCollectionHidden } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Layers, 
  ArrowLeft, 
  Shield, 
  BadgeCheck, 
  Eye, 
  EyeOff,
  ExternalLink,
  Store,
} from 'lucide-react';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: collections, isLoading: collectionsLoading } = useAdminCollections();
  const toggleVerified = useToggleFounderVerified();
  const toggleHidden = useToggleCollectionHidden();

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
            Manage founder verification and collection visibility
          </p>
        </div>

        {/* Collections Table */}
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
                    {collections.map((collection) => (
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
                          <span className="text-sm">
                            {collection.founder_name || 'Anonymous'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {collection.is_live ? (
                              <Badge variant="default" className="bg-green-600">Live</Badge>
                            ) : (
                              <Badge variant="secondary">Draft</Badge>
                            )}
                            {collection.is_hidden && (
                              <Badge variant="destructive">Hidden</Badge>
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
                                  verified: checked 
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
                          {collection.is_live && (
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={`/collection/${collection.project_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
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
      </main>
    </div>
  );
}
