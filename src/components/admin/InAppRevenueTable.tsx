import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { CreditPurchase, MarketingPayment } from "@/hooks/use-admin-costs";

interface InAppRevenueTableProps {
  purchases: CreditPurchase[];
  marketingPayments: MarketingPayment[];
  adaPrice: number | undefined;
}

type RevenueItem = {
  id: string;
  type: 'credits' | 'marketing';
  date: string;
  user: string;
  description: string;
  price_ada: number;
};

export function InAppRevenueTable({ purchases, marketingPayments, adaPrice }: InAppRevenueTableProps) {
  const formatUsd = (ada: number) => {
    if (!adaPrice) return "-";
    const usd = ada * adaPrice;
    return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Combine and sort all revenue items
  const allRevenue: RevenueItem[] = [
    ...purchases.map(p => ({
      id: p.id,
      type: 'credits' as const,
      date: p.completed_at || p.created_at,
      user: p.user_display_name || p.user_email || 'Unknown',
      description: `${p.credits_amount} credits`,
      price_ada: p.price_ada,
    })),
    ...marketingPayments.map(p => ({
      id: p.id,
      type: 'marketing' as const,
      date: p.completed_at || p.created_at,
      user: p.user_display_name || p.user_email || 'Unknown',
      description: p.project_name ? `Spotlight: ${p.project_name}` : 'Marketing Spotlight',
      price_ada: p.price_ada,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>💰</span> In-App Purchase Revenue
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allRevenue.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            No purchases yet
          </p>
        ) : (
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">ADA</TableHead>
                  <TableHead className="text-right">USD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRevenue.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm">
                      {format(new Date(item.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={item.type === 'credits' 
                          ? 'text-primary border-primary/50' 
                          : 'text-amber-600 border-amber-500/50'
                        }
                      >
                        {item.type === 'credits' ? 'Credits' : 'Marketing'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.user}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.description}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {item.price_ada} ₳
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatUsd(item.price_ada)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
