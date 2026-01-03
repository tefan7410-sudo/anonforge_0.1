import { useQuery } from "@tanstack/react-query";

const ADA_PRICE_URL = "https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd";

export function useAdaPrice() {
  return useQuery({
    queryKey: ["ada-price"],
    queryFn: async () => {
      const res = await fetch(ADA_PRICE_URL);
      if (!res.ok) throw new Error("Failed to fetch ADA price");
      const data = await res.json();
      return data.cardano.usd as number;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });
}
