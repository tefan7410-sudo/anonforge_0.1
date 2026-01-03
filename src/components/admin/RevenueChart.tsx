import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import type { CreditPurchase, OperationalCost } from "@/hooks/use-admin-costs";
import { calculateTotalMonthlyOperatingCosts } from "@/hooks/use-admin-costs";

interface RevenueChartProps {
  purchases: CreditPurchase[];
  costs: OperationalCost[];
  adaPrice: number | undefined;
}

type TimeRange = "7d" | "30d" | "90d" | "all";

export function RevenueChart({ purchases, costs, adaPrice }: RevenueChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const chartData = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "7d":
        startDate = subDays(now, 7);
        break;
      case "30d":
        startDate = subDays(now, 30);
        break;
      case "90d":
        startDate = subDays(now, 90);
        break;
      case "all":
        const oldestPurchase = purchases.reduce((oldest, p) => {
          const date = p.completed_at ? new Date(p.completed_at) : now;
          return date < oldest ? date : oldest;
        }, now);
        startDate = oldestPurchase;
        break;
    }

    const days = eachDayOfInterval({ start: startOfDay(startDate), end: startOfDay(now) });
    // Daily cost in USD (monthly costs / 30)
    const dailyCostUsd = calculateTotalMonthlyOperatingCosts(costs) / 30;

    return days.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayRevenueAda = purchases
        .filter((p) => {
          if (!p.completed_at) return false;
          const date = new Date(p.completed_at);
          return date >= dayStart && date < dayEnd;
        })
        .reduce((sum, p) => sum + p.price_ada, 0);

      // Convert ADA revenue to USD
      const dayRevenueUsd = adaPrice ? dayRevenueAda * adaPrice : 0;

      return {
        date: format(day, "MMM dd"),
        revenue: Math.round(dayRevenueUsd * 100) / 100,
        costs: Math.round(dailyCostUsd * 100) / 100,
      };
    });
  }, [purchases, costs, timeRange, adaPrice]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Revenue vs Costs (USD)</CardTitle>
        <div className="flex gap-1">
          {(["7d", "30d", "90d", "all"] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === "all" ? "All" : range}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name="Revenue ($)"
              />
              <Line
                type="monotone"
                dataKey="costs"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={false}
                name="Daily Cost ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
