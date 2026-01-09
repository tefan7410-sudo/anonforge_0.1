import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PromoterRequest {
  id: string;
  user_id: string;
  reason: string | null;
  portfolio_links: string[];
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

interface PromoterWithProfile {
  id: string;
  user_id: string;
  role: string;
  profile?: {
    id: string;
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

// Helper function to log admin actions
async function logAdminAction({
  actionType,
  targetTable,
  targetId,
  targetUserId,
  oldValues,
  newValues,
  metadata,
}: {
  actionType: string;
  targetTable: string;
  targetId?: string;
  targetUserId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase.from('admin_audit_logs') as unknown as { insert: (data: Record<string, unknown>) => Promise<unknown> }).insert({
      admin_user_id: user.id,
      action_type: actionType,
      target_table: targetTable,
      target_id: targetId,
      target_user_id: targetUserId,
      old_values: oldValues,
      new_values: newValues,
      metadata,
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

// Get pending promoter requests
export function usePendingPromoterRequests() {
  return useQuery({
    queryKey: ['pending-promoter-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promoter_requests')
        .select(`
          *,
          profile:profiles!promoter_requests_user_id_fkey(id, display_name, email, avatar_url)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        // Fallback without join if the FK doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('promoter_requests')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: true });
        
        if (fallbackError) throw fallbackError;
        return fallbackData as unknown as PromoterRequest[];
      }
      return data as unknown as PromoterRequest[];
    },
  });
}

// Get all users with promoter role
export function useAllPromoters() {
  return useQuery({
    queryKey: ['all-promoters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          profile:profiles!user_roles_user_id_fkey(id, display_name, email, avatar_url)
        `)
        .eq('role', 'promoter');

      if (error) {
        // Fallback without join
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('role', 'promoter');
        
        if (fallbackError) throw fallbackError;
        return fallbackData as unknown as PromoterWithProfile[];
      }
      return data as unknown as PromoterWithProfile[];
    },
  });
}

// Approve a promoter request
export function useApprovePromoterRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, userId }: { requestId: string; userId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update the request status
      const { error: requestError } = await supabase
        .from('promoter_requests')
        .update({ 
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Add promoter role to user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: userId,
          role: 'promoter'
        });

      if (roleError && !roleError.message.includes('duplicate')) throw roleError;

      // Log admin action
      await logAdminAction({
        actionType: 'approve_promoter',
        targetTable: 'promoter_requests',
        targetId: requestId,
        targetUserId: userId,
        newValues: { status: 'approved', role: 'promoter' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-promoter-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-promoters'] });
      queryClient.invalidateQueries({ queryKey: ['is-promoter'] });
      toast.success('Promoter approved!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });
}

// Reject a promoter request
export function useRejectPromoterRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user_id for audit log
      const { data: request } = await supabase
        .from('promoter_requests')
        .select('user_id')
        .eq('id', requestId)
        .single();

      const { error } = await supabase
        .from('promoter_requests')
        .update({ 
          status: 'rejected',
          rejection_reason: reason,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      // Log admin action
      await logAdminAction({
        actionType: 'reject_promoter',
        targetTable: 'promoter_requests',
        targetId: requestId,
        targetUserId: request?.user_id,
        newValues: { status: 'rejected', rejection_reason: reason },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-promoter-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-promoter-request'] });
      toast.success('Promoter request rejected');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject: ${error.message}`);
    },
  });
}

// Remove promoter role from a user
export function useRemovePromoterRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'promoter');

      if (error) throw error;

      // Log admin action
      await logAdminAction({
        actionType: 'remove_promoter_role',
        targetTable: 'user_roles',
        targetUserId: userId,
        oldValues: { role: 'promoter' },
        newValues: { role: null },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-promoters'] });
      queryClient.invalidateQueries({ queryKey: ['is-promoter'] });
      toast.success('Promoter role removed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove role: ${error.message}`);
    },
  });
}
