import { useState, useEffect } from 'react';
import { NmkrProject, useUpdateNmkrProjectSettings, useDeleteNmkrProject } from '@/hooks/use-nmkr';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Trash2 } from 'lucide-react';

interface NmkrSettingsModalProps {
  nmkrProject: NmkrProject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NmkrSettingsModal({ nmkrProject, open, onOpenChange }: NmkrSettingsModalProps) {
  const settings = nmkrProject.settings as Record<string, unknown> || {};
  
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [payoutWalletAddress, setPayoutWalletAddress] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateSettings = useUpdateNmkrProjectSettings();
  const deleteProject = useDeleteNmkrProject();

  // Initialize form values from settings
  useEffect(() => {
    if (open) {
      setProjectName((settings.nmkrProjectName as string) || '');
      setDescription((settings.description as string) || '');
      setPayoutWalletAddress((settings.payoutWalletAddress as string) || '');
      setProjectUrl((settings.projectUrl as string) || '');
      setTwitterHandle((settings.twitterHandle as string) || '');
    }
  }, [open, settings]);

  const handleSave = async () => {
    await updateSettings.mutateAsync({
      nmkrProjectId: nmkrProject.id,
      settings: {
        nmkrProjectName: projectName,
        description,
        payoutWalletAddress,
        projectUrl,
        twitterHandle,
      },
    });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    await deleteProject.mutateAsync({
      nmkrProjectId: nmkrProject.id,
    });
    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  const isValidWallet = payoutWalletAddress.startsWith('addr1') && payoutWalletAddress.length >= 58;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">NMKR Project Settings</DialogTitle>
            <DialogDescription>
              Update your NMKR project settings. Some settings are stored locally only.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My NFT Collection"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your collection..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payout-wallet">Payout Wallet Address</Label>
              <Input
                id="payout-wallet"
                value={payoutWalletAddress}
                onChange={(e) => setPayoutWalletAddress(e.target.value)}
                placeholder="addr1..."
                className={payoutWalletAddress && !isValidWallet ? 'border-destructive' : ''}
              />
              {payoutWalletAddress && !isValidWallet && (
                <p className="text-xs text-destructive">
                  Please enter a valid Cardano mainnet address
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-url">Project URL (optional)</Label>
              <Input
                id="project-url"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="https://yourproject.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter Handle (optional)</Label>
              <Input
                id="twitter"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                placeholder="@yourproject"
              />
            </div>

            {/* Read-only settings */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <p className="text-sm font-medium">Read-only Settings</p>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>NMKR Project UID:</span>
                  <span className="font-mono text-xs">{nmkrProject.nmkr_project_uid}</span>
                </div>
                <div className="flex justify-between">
                  <span>Policy ID:</span>
                  <span className="font-mono text-xs truncate max-w-[200px]">
                    {nmkrProject.nmkr_policy_id || 'Not yet created'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Network:</span>
                  <span className="capitalize">{nmkrProject.network}</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage Provider:</span>
                  <span className="capitalize">{(settings.storageProvider as string) || 'IPFS'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Token Prefix:</span>
                  <span>{(settings.tokenNamePrefix as string) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Supply:</span>
                  <span>{(settings.maxNftSupply as number) || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-3">
              <p className="text-sm font-medium text-destructive">Danger Zone</p>
              <p className="text-xs text-muted-foreground">
                Disconnecting will remove the NMKR project link from this collection. 
                The project will still exist on NMKR but you'll need to set it up again.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/50 hover:bg-destructive/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Disconnect NMKR Project
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={updateSettings.isPending || (payoutWalletAddress && !isValidWallet)}
            >
              {updateSettings.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect NMKR Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the connection to your NMKR project. The project will still exist 
              on NMKR, but you'll need to set it up again in this app. Any uploaded NFTs will 
              remain on NMKR.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deleteProject.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProject.isPending ? 'Disconnecting...' : 'Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
