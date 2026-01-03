import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Wallet, PiggyBank } from "lucide-react";
import type { OperationalCost, CreditPurchase } from "@/hooks/use-admin-costs";
import { calculateTotalMonthlyOperatingCosts, calculateTotalRevenue } from "@/hooks/use-admin-costs";
import { Skeleton } from "@/components/ui/skeleton";

interface CostsSummaryCardsProps {
  costs: OperationalCost[];
  purchases: CreditPurchase[];
  adaPrice: number | undefined;
  adaPriceLoading: boolean;
}

export function CostsSummaryCards({ costs, purchases, adaPrice, adaPriceLoading }: CostsSummaryCardsProps) {
  const totalRevenueAda = calculateTotalRevenue(purchases);
  const monthlyOperatingCostsUsd = calculateTotalMonthlyOperatingCosts(costs);
  
  // Convert revenue to USD
  const totalRevenueUsd = adaPrice ? totalRevenueAda * adaPrice : 0;
  const netProfitUsd = totalRevenueUsd - monthlyOperatingCostsUsd;
  const profitMargin = totalRevenueUsd > 0 ? ((netProfitUsd / totalRevenueUsd) * 100).toFixed(1) : "0";

  // Calculate this month's revenue
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthRevenueAda = purchases
    .filter((p) => p.completed_at && new Date(p.completed_at) >= startOfMonth)
    .reduce((sum, p) => sum + p.price_ada, 0);
  const thisMonthRevenueUsd = adaPrice ? thisMonthRevenueAda * adaPrice : 0;

  // Calculate last month's revenue for comparison
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthRevenueAda = purchases
    .filter((p) => {
      if (!p.completed_at) return false;
      const date = new Date(p.completed_at);
      return date >= startOfLastMonth && date <= endOfLastMonth;
    })
    .reduce((sum, p) => sum + p.price_ada, 0);
  const lastMonthRevenueUsd = adaPrice ? lastMonthRevenueAda * adaPrice : 0;

  const revenueChange = lastMonthRevenueUsd > 0 
    ? ((thisMonthRevenueUsd - lastMonthRevenueUsd) / lastMonthRevenueUsd * 100).toFixed(0)
    : thisMonthRevenueUsd > 0 ? "100" : "0";

  const formatUsd = (amount: number) => `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {adaPriceLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <>
              <div className="text-2xl font-bold">{formatUsd(totalRevenueUsd)}</div>
              <p className="text-xs text-muted-foreground">
                {totalRevenueAda.toLocaleString()} ₳ @ ${adaPrice?.toFixed(3) || "0"}
              </p>
            </>
          )}
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            {Number(revenueChange) >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={Number(revenueChange) >= 0 ? "text-green-500" : "text-red-500"}>
              {revenueChange}%
            </span>
            {" "}vs last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Costs</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatUsd(monthlyOperatingCostsUsd)}</div>
          <p className="text-xs text-muted-foreground">
            {costs.filter(c => !c.end_date).length} active recurring costs
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {adaPriceLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <>
              <div className={`text-2xl font-bold ${netProfitUsd >= 0 ? "text-green-500" : "text-red-500"}`}>
                {netProfitUsd >= 0 ? "+" : ""}{formatUsd(netProfitUsd)}
              </div>
              <p className="text-xs text-muted-foreground">
                Margin: {profitMargin}%
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
