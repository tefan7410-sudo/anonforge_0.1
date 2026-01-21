import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { toast } from 'sonner';

export interface ArtFundSource {
  _id: Id<"art_fund_sources">;
  id?: string;
  name: string;
  description?: string;
  amount_ada: number;
  category: 'fees' | 'special_sale' | 'donation' | 'other';
  source_date: string;
  is_active: boolean;
  created_by?: string;
  _creationTime: number;
}

export interface ArtFundSettings {
  _id: Id<"art_fund_settings">;
  id?: string;
  wallet_address: string;
  description?: string;
  updated_at?: string;
  updated_by?: string;
}

export interface WalletBalance {
  balance_ada: number;
  balance_lovelace: string;
  last_updated: string;
}

export function useArtFundSources() {
  const sources = useQuery(api.artFund.getSources);

  return {
    data: sources as ArtFundSource[] | undefined,
    isLoading: sources === undefined,
    error: null,
  };
}

export function useArtFundSettings() {
  const settings = useQuery(api.artFund.getSettings);

  return {
    data: settings as ArtFundSettings | undefined,
    isLoading: settings === undefined,
    error: null,
  };
}

export function useWalletBalance(address: string | undefined) {
  // This would need a Convex action to query blockchain
  // For now, return null
  return {
    data: null as WalletBalance | null,
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}

export function useAddFundSource() {
  const addSource = useMutation(api.artFund.addSource);

  return {
    mutateAsync: async (source: {
      name: string;
      description?: string;
      amount_ada: number;
      category: 'fees' | 'special_sale' | 'donation' | 'other';
      source_date: string;
    }) => {
      await addSource({
        name: source.name,
        description: source.description,
        amountAda: source.amount_ada,
        category: source.category,
        sourceDate: source.source_date,
      });
      toast.success('Fund source added');
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useUpdateFundSource() {
  const updateSource = useMutation(api.artFund.updateSource);

  return {
    mutateAsync: async ({ id, ...updates }: Partial<ArtFundSource> & { id: string }) => {
      await updateSource({
        id: id as Id<"art_fund_sources">,
        name: updates.name,
        description: updates.description,
        amountAda: updates.amount_ada,
        category: updates.category,
        sourceDate: updates.source_date,
        isActive: updates.is_active,
      });
      toast.success('Fund source updated');
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useDeleteFundSource() {
  const deleteSource = useMutation(api.artFund.deleteSource);

  return {
    mutateAsync: async (id: string) => {
      await deleteSource({ id: id as Id<"art_fund_sources"> });
      toast.success('Fund source deleted');
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useUpdateArtFundSettings() {
  const updateSettings = useMutation(api.artFund.updateSettings);

  return {
    mutateAsync: async ({ id, wallet_address, description }: {
      id: string;
      wallet_address: string;
      description?: string;
    }) => {
      await updateSettings({
        walletAddress: wallet_address,
        description,
      });
      toast.success('Art fund settings updated');
    },
    mutate: () => {},
    isPending: false,
  };
}
