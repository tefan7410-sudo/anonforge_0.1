import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import type { CreditPurchase } from "@/hooks/use-admin-costs";

interface CreditPurchasesTableProps {
  purchases: CreditPurchase[];
}

export function CreditPurchasesTable({ purchases }: CreditPurchasesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>💰</span> Credit Purchase Revenue
        </CardTitle>
      </CardHeader>
      <CardContent>
        {purchases.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            No credit purchases yet
          </p>
        ) : (
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead className="text-right">Amount (₳)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="text-sm">
                      {purchase.completed_at
                        ? format(new Date(purchase.completed_at), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {purchase.user_display_name || purchase.user_email || "Unknown"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {purchase.credits_amount}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {purchase.price_ada} ₳
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
