import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OperationalCost {
  id: string;
  name: string;
  category: string;
  amount_usd: number;
  billing_period: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface CreditPurchase {
  id: string;
  user_id: string;
  credits_amount: number;
  price_ada: number;
  status: string;
  completed_at: string | null;
  created_at: string;
  user_email?: string;
  user_display_name?: string;
}

export interface MarketingPayment {
  id: string;
  user_id: string;
  marketing_request_id: string;
  price_ada: number;
  status: string;
  completed_at: string | null;
  created_at: string;
  user_email?: string;
  user_display_name?: string;
  project_name?: string;
}

export const COST_CATEGORIES = [
  { value: "infrastructure", label: "Infrastructure" },
  { value: "api", label: "API Services" },
  { value: "marketing", label: "Marketing" },
  { value: "domain", label: "Domain" },
  { value: "other", label: "Other" },
] as const;

export function useOperationalCosts() {
  return useQuery({
    queryKey: ["operational-costs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operational_costs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as OperationalCost[];
    },
  });
}

export function useAddOperationalCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cost: Omit<OperationalCost, "id" | "created_at" | "created_by">) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("operational_costs")
        .insert({
          ...cost,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational-costs"] });
      toast.success("Cost added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add cost: " + error.message);
    },
  });
}

export function useUpdateOperationalCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...cost }: Partial<OperationalCost> & { id: string }) => {
      const { data, error } = await supabase
        .from("operational_costs")
        .update(cost)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational-costs"] });
      toast.success("Cost updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update cost: " + error.message);
    },
  });
}

export function useDeleteOperationalCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("operational_costs")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational-costs"] });
      toast.success("Cost deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete cost: " + error.message);
    },
  });
}

export function useCompletedCreditPurchases() {
  return useQuery({
    queryKey: ["completed-credit-purchases"],
    queryFn: async () => {
      // Get completed payments from pending_credit_payments table
      const { data: purchases, error: purchasesError } = await supabase
        .from("pending_credit_payments")
        .select("*")
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

      if (purchasesError) throw purchasesError;
      if (!purchases || !purchases.length) return [] as CreditPurchase[];

      // Get unique user IDs
      const userIds = [...new Set(purchases.map((p) => p.user_id))];

      // Fetch profiles for those users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Map profiles to purchases
      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return purchases.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        credits_amount: p.credits_amount,
        price_ada: Number(p.price_ada),
        status: p.status,
        completed_at: p.completed_at,
        created_at: p.created_at,
        user_email: profileMap.get(p.user_id)?.email,
        user_display_name: profileMap.get(p.user_id)?.display_name,
      })) as CreditPurchase[];
    },
  });
}

export function useCompletedMarketingPayments() {
  return useQuery({
    queryKey: ["completed-marketing-payments"],
    queryFn: async () => {
      // Get completed marketing payments
      const { data: payments, error: paymentsError } = await supabase
        .from("pending_marketing_payments")
        .select("*, marketing_requests!inner(project_id, projects!inner(name))")
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

      if (paymentsError) throw paymentsError;
      if (!payments || !payments.length) return [] as MarketingPayment[];

      // Get unique user IDs
      const userIds = [...new Set(payments.map((p) => p.user_id))];

      // Fetch profiles for those users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return payments.map((p) => {
        const marketingRequest = p.marketing_requests as any;
        return {
          id: p.id,
          user_id: p.user_id,
          marketing_request_id: p.marketing_request_id,
          price_ada: Number(p.price_ada),
          status: p.status,
          completed_at: p.completed_at,
          created_at: p.created_at,
          user_email: profileMap.get(p.user_id)?.email,
          user_display_name: profileMap.get(p.user_id)?.display_name,
          project_name: marketingRequest?.projects?.name,
        };
      }) as MarketingPayment[];
    },
  });
}

export function calculateMonthlyEquivalent(cost: OperationalCost): number {
  switch (cost.billing_period) {
    case "monthly":
      return cost.amount_usd;
    case "yearly":
      return cost.amount_usd / 12;
    case "one-time":
      return 0; // One-time costs are not recurring
    default:
      return 0;
  }
}

export function calculateTotalMonthlyOperatingCosts(costs: OperationalCost[]): number {
  const now = new Date();
  
  return costs
    .filter((cost) => {
      const startDate = new Date(cost.start_date);
      const endDate = cost.end_date ? new Date(cost.end_date) : null;
      return startDate <= now && (!endDate || endDate >= now);
    })
    .reduce((total, cost) => total + calculateMonthlyEquivalent(cost), 0);
}

export function calculateTotalRevenue(purchases: CreditPurchase[], marketingPayments: MarketingPayment[] = []): number {
  const creditRevenue = purchases.reduce((total, purchase) => total + purchase.price_ada, 0);
  const marketingRevenue = marketingPayments.reduce((total, payment) => total + payment.price_ada, 0);
  return creditRevenue + marketingRevenue;
}
