import { useOperationalCosts, useCompletedCreditPurchases, useCompletedMarketingPayments } from "@/hooks/use-admin-costs";
import { useAdaPrice } from "@/hooks/use-ada-price";
import { CostsSummaryCards } from "./CostsSummaryCards";
import { RevenueChart } from "./RevenueChart";
import { InAppRevenueTable } from "./InAppRevenueTable";
import { OperationalCostsTable } from "./OperationalCostsTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export function CostsAnalyticsTab() {
  const { data: costs = [], isLoading: costsLoading } = useOperationalCosts();
  const { data: purchases = [], isLoading: purchasesLoading } = useCompletedCreditPurchases();
  const { data: marketingPayments = [], isLoading: marketingLoading } = useCompletedMarketingPayments();
  const { data: adaPrice, isLoading: adaPriceLoading, isError: adaPriceError } = useAdaPrice();

  const isLoading = costsLoading || purchasesLoading || marketingLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
        <Skeleton className="h-[350px]" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {adaPriceError && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm">Unable to fetch ADA price. USD values may be inaccurate.</span>
          </CardContent>
        </Card>
      )}
      
      <CostsSummaryCards 
        costs={costs} 
        purchases={purchases} 
        marketingPayments={marketingPayments}
        adaPrice={adaPrice}
        adaPriceLoading={adaPriceLoading}
      />
      <RevenueChart purchases={purchases} marketingPayments={marketingPayments} costs={costs} adaPrice={adaPrice} />
      <div className="grid gap-6 lg:grid-cols-2">
        <InAppRevenueTable purchases={purchases} marketingPayments={marketingPayments} adaPrice={adaPrice} />
        <OperationalCostsTable costs={costs} />
      </div>
    </div>
  );
}
