import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Wallet, PiggyBank } from "lucide-react";
import type { OperationalCost, CreditPurchase } from "@/hooks/use-admin-costs";
import { calculateTotalMonthlyOperatingCosts, calculateTotalRevenue } from "@/hooks/use-admin-costs";

interface CostsSummaryCardsProps {
  costs: OperationalCost[];
  purchases: CreditPurchase[];
}

export function CostsSummaryCards({ costs, purchases }: CostsSummaryCardsProps) {
  const totalRevenue = calculateTotalRevenue(purchases);
  const monthlyOperatingCosts = calculateTotalMonthlyOperatingCosts(costs);
  const netProfit = totalRevenue - monthlyOperatingCosts;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0";

  // Calculate this month's revenue
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthRevenue = purchases
    .filter((p) => p.completed_at && new Date(p.completed_at) >= startOfMonth)
    .reduce((sum, p) => sum + p.price_ada, 0);

  // Calculate last month's revenue for comparison
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthRevenue = purchases
    .filter((p) => {
      if (!p.completed_at) return false;
      const date = new Date(p.completed_at);
      return date >= startOfLastMonth && date <= endOfLastMonth;
    })
    .reduce((sum, p) => sum + p.price_ada, 0);

  const revenueChange = lastMonthRevenue > 0 
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(0)
    : thisMonthRevenue > 0 ? "100" : "0";

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} ₳</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
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
          <div className="text-2xl font-bold">{monthlyOperatingCosts.toLocaleString()} ₳</div>
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
          <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
            {netProfit >= 0 ? "+" : ""}{netProfit.toLocaleString()} ₳
          </div>
          <p className="text-xs text-muted-foreground">
            Margin: {profitMargin}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
