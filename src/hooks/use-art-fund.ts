import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ArtFundSource {
  id: string;
  name: string;
  description: string | null;
  amount_ada: number;
  category: 'fees' | 'special_sale' | 'donation' | 'other';
  source_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ArtFundSettings {
  id: string;
  wallet_address: string;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface WalletBalance {
  balance_ada: number;
  balance_lovelace: string;
  last_updated: string;
}

export function useArtFundSources() {
  return useQuery({
    queryKey: ['art-fund-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('art_fund_sources')
        .select('*')
        .order('source_date', { ascending: false });

      if (error) throw error;
      return data as ArtFundSource[];
    },
  });
}

export function useArtFundSettings() {
  return useQuery({
    queryKey: ['art-fund-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('art_fund_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return data as ArtFundSettings;
    },
  });
}

export function useWalletBalance(address: string | undefined) {
  return useQuery({
    queryKey: ['wallet-balance', address],
    queryFn: async () => {
      if (!address) return null;

      const { data, error } = await supabase.functions.invoke('get-wallet-balance', {
        body: { address },
      });

      if (error) throw error;
      return data as WalletBalance;
    },
    enabled: !!address,
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useAddFundSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (source: {
      name: string;
      description?: string;
      amount_ada: number;
      category: 'fees' | 'special_sale' | 'donation' | 'other';
      source_date: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('art_fund_sources')
        .insert({
          ...source,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['art-fund-sources'] });
    },
  });
}

export function useUpdateFundSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ArtFundSource> & { id: string }) => {
      const { data, error } = await supabase
        .from('art_fund_sources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['art-fund-sources'] });
    },
  });
}

export function useDeleteFundSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('art_fund_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['art-fund-sources'] });
    },
  });
}

export function useUpdateArtFundSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, wallet_address, description }: {
      id: string;
      wallet_address: string;
      description?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('art_fund_settings')
        .update({
          wallet_address,
          description,
          updated_by: user?.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['art-fund-settings'] });
    },
  });
}
