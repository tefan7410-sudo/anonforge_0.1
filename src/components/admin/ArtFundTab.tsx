import { useState } from 'react';
import { Heart, Plus, Pencil, Trash2, Wallet, Save, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  useArtFundSources,
  useArtFundSettings,
  useWalletBalance,
  useAddFundSource,
  useUpdateFundSource,
  useDeleteFundSource,
  useUpdateArtFundSettings,
  type ArtFundSource,
} from '@/hooks/use-art-fund';
import { useAdaPrice } from '@/hooks/use-ada-price';

const CATEGORY_OPTIONS = [
  { value: 'fees', label: 'Platform Fees', color: 'text-primary' },
  { value: 'special_sale', label: 'Special Sales', color: 'text-purple-500' },
  { value: 'donation', label: 'Donations', color: 'text-blue-500' },
  { value: 'other', label: 'Other', color: 'text-muted-foreground' },
] as const;

type Category = typeof CATEGORY_OPTIONS[number]['value'];

function SummaryCards({
  totalAllocated,
  walletBalance,
  isLoading,
  adaPrice,
}: {
  totalAllocated: number;
  walletBalance: number;
  isLoading: boolean;
  adaPrice: number | null;
}) {
  const difference = walletBalance - totalAllocated;
  const differenceUsd = adaPrice ? difference * adaPrice : null;

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Allocated</CardDescription>
          <CardTitle className="text-2xl">
            {isLoading ? <Skeleton className="h-8 w-24" /> : `${totalAllocated.toLocaleString()} ₳`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Sum of all fund sources</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Wallet Balance</CardDescription>
          <CardTitle className="text-2xl text-primary">
            {isLoading ? <Skeleton className="h-8 w-24" /> : `${walletBalance.toLocaleString()} ₳`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Live balance from Blockfrost</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Unallocated</CardDescription>
          <CardTitle className={`text-2xl ${difference >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              `${difference >= 0 ? '+' : ''}${difference.toLocaleString()} ₳`
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {differenceUsd !== null ? `≈ $${Math.abs(differenceUsd).toFixed(2)} USD` : 'Wallet - Allocated'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SourceFormDialog({
  source,
  open,
  onOpenChange,
  onSave,
  isSaving,
}: {
  source?: ArtFundSource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    name: string;
    description?: string;
    amount_ada: number;
    category: Category;
    source_date: string;
  }) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(source?.name || '');
  const [description, setDescription] = useState(source?.description || '');
  const [amountAda, setAmountAda] = useState(source?.amount_ada?.toString() || '');
  const [category, setCategory] = useState<Category>(source?.category || 'fees');
  const [sourceDate, setSourceDate] = useState(
    source?.source_date || new Date().toISOString().split('T')[0]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amountAda || !category || !sourceDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSave({
      name,
      description: description || undefined,
      amount_ada: parseFloat(amountAda),
      category,
      source_date: sourceDate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{source ? 'Edit Fund Source' : 'Add Fund Source'}</DialogTitle>
          <DialogDescription>
            {source ? 'Update the fund source details.' : 'Add a new contribution to the Art Fund.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Platform Fees Q1 2025"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (ADA) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amountAda}
                onChange={(e) => setAmountAda(e.target.value)}
                placeholder="1000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Source Date *</Label>
            <Input
              id="date"
              type="date"
              value={sourceDate}
              onChange={(e) => setSourceDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details about this contribution..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : source ? 'Update' : 'Add Source'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ArtFundTab() {
  const { data: settings, isLoading: settingsLoading } = useArtFundSettings();
  const { data: sources, isLoading: sourcesLoading } = useArtFundSources();
  const { data: walletData, isLoading: balanceLoading } = useWalletBalance(settings?.wallet_address);
  const { data: adaPrice } = useAdaPrice();

  const addSource = useAddFundSource();
  const updateSource = useUpdateFundSource();
  const deleteSource = useDeleteFundSource();
  const updateSettings = useUpdateArtFundSettings();

  const [walletAddress, setWalletAddress] = useState('');
  const [description, setDescription] = useState('');
  const [settingsEdited, setSettingsEdited] = useState(false);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<ArtFundSource | null>(null);

  // Initialize settings form when data loads
  useState(() => {
    if (settings && !settingsEdited) {
      setWalletAddress(settings.wallet_address);
      setDescription(settings.description || '');
    }
  });

  const totalAllocated = sources?.reduce((sum, s) => sum + Number(s.amount_ada), 0) || 0;

  const handleSaveSettings = async () => {
    if (!settings) return;
    try {
      await updateSettings.mutateAsync({
        id: settings.id,
        wallet_address: walletAddress,
        description,
      });
      toast.success('Settings saved');
      setSettingsEdited(false);
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const handleAddSource = async (data: Parameters<typeof addSource.mutateAsync>[0]) => {
    try {
      await addSource.mutateAsync(data);
      toast.success('Fund source added');
      setAddDialogOpen(false);
    } catch (error) {
      toast.error('Failed to add fund source');
    }
  };

  const handleUpdateSource = async (data: Parameters<typeof addSource.mutateAsync>[0]) => {
    if (!editingSource) return;
    try {
      await updateSource.mutateAsync({ id: editingSource.id, ...data });
      toast.success('Fund source updated');
      setEditingSource(null);
    } catch (error) {
      toast.error('Failed to update fund source');
    }
  };

  const handleDeleteSource = async (id: string) => {
    try {
      await deleteSource.mutateAsync(id);
      toast.success('Fund source deleted');
    } catch (error) {
      toast.error('Failed to delete fund source');
    }
  };

  const getCategoryBadge = (category: string) => {
    const opt = CATEGORY_OPTIONS.find((o) => o.value === category);
    return (
      <Badge variant="outline" className={opt?.color}>
        {opt?.label || category}
      </Badge>
    );
  };

  const isLoading = settingsLoading || sourcesLoading || balanceLoading;

  return (
    <div className="space-y-6">
      <SummaryCards
        totalAllocated={totalAllocated}
        walletBalance={walletData?.balance_ada || 0}
        isLoading={isLoading}
        adaPrice={adaPrice}
      />

      {/* Wallet Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <CardTitle>Wallet Settings</CardTitle>
          </div>
          <CardDescription>Configure the wallet address to track for the Art Fund</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settingsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="wallet-address">Wallet Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="wallet-address"
                    value={walletAddress || settings?.wallet_address || ''}
                    onChange={(e) => {
                      setWalletAddress(e.target.value);
                      setSettingsEdited(true);
                    }}
                    placeholder="addr1..."
                    className="font-mono text-sm"
                  />
                  {settings?.wallet_address && (
                    <Button variant="outline" size="icon" asChild>
                      <a
                        href={`https://cardanoscan.io/address/${settings.wallet_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Public Description</Label>
                <Textarea
                  id="description"
                  value={description || settings?.description || ''}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setSettingsEdited(true);
                  }}
                  placeholder="Describe what the Art Fund is about..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={!settingsEdited || updateSettings.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Fund Sources */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <CardTitle>Fund Sources</CardTitle>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </div>
          <CardDescription>Manage contributions to the Art Fund</CardDescription>
        </CardHeader>
        <CardContent>
          {sourcesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : sources && sources.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount (ADA)</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{source.name}</p>
                        {source.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {source.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryBadge(source.category)}</TableCell>
                    <TableCell className="font-medium">
                      {Number(source.amount_ada).toLocaleString()} ₳
                    </TableCell>
                    <TableCell>{format(new Date(source.source_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant={source.is_active ? 'default' : 'secondary'}>
                        {source.is_active ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingSource(source)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete fund source?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{source.name}" from the Art Fund sources.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSource(source.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No fund sources yet</p>
              <p className="text-sm">Add your first contribution to the Art Fund</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <SourceFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSave={handleAddSource}
        isSaving={addSource.isPending}
      />

      {/* Edit Dialog */}
      <SourceFormDialog
        source={editingSource || undefined}
        open={!!editingSource}
        onOpenChange={(open) => !open && setEditingSource(null)}
        onSave={handleUpdateSource}
        isSaving={updateSource.isPending}
      />
    </div>
  );
}
