import { useNmkrCounts } from '@/hooks/use-nmkr';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface MintStatusCardProps {
  nmkrProjectUid: string | undefined;
  maxSupply?: number | null;
}

export function MintStatusCard({ nmkrProjectUid, maxSupply }: MintStatusCardProps) {
  const { data: counts, isLoading } = useNmkrCounts(nmkrProjectUid);

  if (!nmkrProjectUid) return null;

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-4 mb-8">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-2 w-full mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (!counts) return null;

  const total = maxSupply || counts.total;
  const minted = counts.sold;
  const available = counts.free;
  const reserved = counts.reserved;
  const progress = total > 0 ? (minted / total) * 100 : 0;
  const isSoldOut = available === 0 && total > 0;

  return (
    <div className="rounded-xl border bg-card p-4 mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Mint Progress</h3>
        {isSoldOut ? (
          <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">
            Sold Out
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-green-500/10 text-green-500">
            {available.toLocaleString()} Available
          </Badge>
        )}
      </div>
      
      <Progress value={progress} className="h-2 mb-3" />
      
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div>
          <span className="font-medium text-foreground">{minted.toLocaleString()}</span>
          <span className="ml-1">minted</span>
        </div>
        {reserved > 0 && (
          <div>
            <span className="font-medium text-foreground">{reserved.toLocaleString()}</span>
            <span className="ml-1">reserved</span>
          </div>
        )}
        <div>
          <span className="font-medium text-foreground">{total.toLocaleString()}</span>
          <span className="ml-1">total</span>
        </div>
      </div>
    </div>
  );
}
