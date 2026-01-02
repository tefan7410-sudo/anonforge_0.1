import { NmkrProject } from '@/hooks/use-nmkr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RoyaltySetupCard } from './RoyaltySetupCard';
import { AlertTriangle, Info } from 'lucide-react';

interface RoyaltiesTabProps {
  nmkrProject: NmkrProject;
}

export function RoyaltiesTab({ nmkrProject }: RoyaltiesTabProps) {
  const settings = nmkrProject.settings as Record<string, unknown> || {};
  const isRoyaltyMinted = settings.royaltyMinted === true;
  const payoutWallet = (settings.payoutWalletAddress as string) || '';

  return (
    <div className="space-y-6">
      {/* Royalty Warning Banner */}
      {!isRoyaltyMinted && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-700 dark:text-yellow-400">
                Royalty Token Not Created
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                You haven't minted a royalty token yet. This is required to receive 
                royalties from secondary sales on marketplaces like jpg.store.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Royalty Setup Card */}
      <RoyaltySetupCard 
        nmkrProject={nmkrProject} 
        payoutWallet={payoutWallet}
      />

      {/* Educational Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Info className="h-5 w-5 text-primary" />
            About CIP-27 Royalties
          </CardTitle>
          <CardDescription>
            Understanding how royalties work on Cardano
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">What are CIP-27 Royalties?</strong><br />
              CIP-27 is a Cardano Improvement Proposal that defines a standard for 
              on-chain royalty tokens. When you mint a royalty token, it's permanently 
              linked to your policy ID and recognized by all compatible marketplaces.
            </p>
            <p>
              <strong className="text-foreground">How do they work?</strong><br />
              When someone resells your NFT on a marketplace like jpg.store, the 
              marketplace automatically sends the royalty percentage to your specified 
              wallet address. This happens for every secondary sale, forever.
            </p>
            <p>
              <strong className="text-foreground">Best Practices:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>5% is the industry standard royalty rate</li>
              <li>Higher rates (7-10%) may discourage secondary sales</li>
              <li>Lower rates (1-3%) are collector-friendly but reduce your earnings</li>
              <li>Royalty tokens can only be minted once per policy</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
