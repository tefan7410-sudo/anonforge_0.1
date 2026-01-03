import { useOperationalCosts, useCompletedCreditPurchases } from "@/hooks/use-admin-costs";
import { CostsSummaryCards } from "./CostsSummaryCards";
import { RevenueChart } from "./RevenueChart";
import { CreditPurchasesTable } from "./CreditPurchasesTable";
import { OperationalCostsTable } from "./OperationalCostsTable";
import { Skeleton } from "@/components/ui/skeleton";

export function CostsAnalyticsTab() {
  const { data: costs = [], isLoading: costsLoading } = useOperationalCosts();
  const { data: purchases = [], isLoading: purchasesLoading } = useCompletedCreditPurchases();

  const isLoading = costsLoading || purchasesLoading;

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
      <CostsSummaryCards costs={costs} purchases={purchases} />
      <RevenueChart purchases={purchases} costs={costs} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CreditPurchasesTable purchases={purchases} />
        <OperationalCostsTable costs={costs} />
      </div>
    </div>
  );
}
