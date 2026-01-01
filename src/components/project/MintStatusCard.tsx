import { NmkrCounts } from '@/hooks/use-nmkr';
import { Progress } from '@/components/ui/progress';

interface MintStatusCardProps {
  counts: NmkrCounts | null | undefined;
  priceInLovelace: number | null;
  network: string;
}

export function MintStatusCard({ counts, priceInLovelace, network }: MintStatusCardProps) {
  const total = counts?.total || 0;
  const sold = counts?.sold || 0;
  const reserved = counts?.reserved || 0;
  const free = counts?.free || 0;

  const soldPercentage = total > 0 ? (sold / total) * 100 : 0;
  const reservedPercentage = total > 0 ? (reserved / total) * 100 : 0;

  const priceAda = priceInLovelace ? priceInLovelace / 1_000_000 : null;
  const estimatedRevenue = priceAda ? sold * priceAda : null;

  return (
    <div className="space-y-4">
      {/* Quick stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{total}</div>
          <div className="text-xs text-muted-foreground">Total NFTs</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">{sold}</div>
          <div className="text-xs text-muted-foreground">Sold</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-500">{reserved}</div>
          <div className="text-xs text-muted-foreground">Reserved</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">{free}</div>
          <div className="text-xs text-muted-foreground">Available</div>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Sales Progress</span>
            <span>{soldPercentage.toFixed(1)}% sold</span>
          </div>
          <div className="relative h-3 overflow-hidden rounded-full bg-muted">
            <div 
              className="absolute left-0 top-0 h-full bg-green-500 transition-all"
              style={{ width: `${soldPercentage}%` }}
            />
            <div 
              className="absolute top-0 h-full bg-yellow-500 transition-all"
              style={{ left: `${soldPercentage}%`, width: `${reservedPercentage}%` }}
            />
          </div>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Sold</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">Reserved</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              <span className="text-muted-foreground">Available</span>
            </div>
          </div>
        </div>
      )}

      {/* Price and revenue info */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-muted/30 p-3">
        {priceAda !== null && (
          <div>
            <span className="text-xs text-muted-foreground">Price: </span>
            <span className="font-medium">{priceAda.toFixed(2)} ADA</span>
          </div>
        )}
        {estimatedRevenue !== null && estimatedRevenue > 0 && (
          <div>
            <span className="text-xs text-muted-foreground">Revenue: </span>
            <span className="font-medium text-green-500">
              {estimatedRevenue.toFixed(2)} ADA
            </span>
          </div>
        )}
        <div>
          <span className="text-xs text-muted-foreground">Network: </span>
          <span className={`font-medium capitalize ${
            network === 'mainnet' ? 'text-green-500' : 'text-yellow-500'
          }`}>
            {network}
          </span>
        </div>
      </div>
    </div>
  );
}
