import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AmbassadorRequest {
  id: string;
  user_id: string;
  reason: string | null;
  portfolio_links: string[];
  twitter_link: string | null;
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

interface AmbassadorWithProfile {
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

// Get pending ambassador requests
export function usePendingAmbassadorRequests() {
  return useQuery({
    queryKey: ['pending-ambassador-requests'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('ambassador_requests' as any)
        .select(`
          *,
          profile:profiles!ambassador_requests_user_id_fkey(id, display_name, email, avatar_url)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true }));

      if (error) {
        // Fallback without join if the FK doesn't exist
        const { data: fallbackData, error: fallbackError } = await (supabase
          .from('ambassador_requests' as any)
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: true }));
        
        if (fallbackError) throw fallbackError;
        return fallbackData as unknown as AmbassadorRequest[];
      }
      return data as unknown as AmbassadorRequest[];
    },
  });
}

// Get all users with ambassador role
export function useAllAmbassadors() {
  return useQuery({
    queryKey: ['all-ambassadors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          profile:profiles!user_roles_user_id_fkey(id, display_name, email, avatar_url)
        `)
        .eq('role', 'ambassador');

      if (error) {
        // Fallback without join
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('role', 'ambassador');
        
        if (fallbackError) throw fallbackError;
        return fallbackData as unknown as AmbassadorWithProfile[];
      }
      return data as unknown as AmbassadorWithProfile[];
    },
  });
}

// Approve an ambassador request
export function useApproveAmbassadorRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, userId }: { requestId: string; userId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update the request status
      const { error: requestError } = await (supabase
        .from('ambassador_requests' as any)
        .update({ 
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId));

      if (requestError) throw requestError;

      // Add ambassador role to user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: userId,
          role: 'ambassador'
        });

      if (roleError && !roleError.message.includes('duplicate')) throw roleError;

      // Log admin action
      await logAdminAction({
        actionType: 'approve_ambassador',
        targetTable: 'ambassador_requests',
        targetId: requestId,
        targetUserId: userId,
        newValues: { status: 'approved', role: 'ambassador' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-ambassador-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-ambassadors'] });
      queryClient.invalidateQueries({ queryKey: ['is-ambassador'] });
      toast.success('Ambassador approved!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });
}

// Reject an ambassador request
export function useRejectAmbassadorRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user_id for audit log
      const { data: request } = await (supabase
        .from('ambassador_requests' as any)
        .select('user_id')
        .eq('id', requestId)
        .single()) as unknown as { data: { user_id: string } | null };

      const { error } = await (supabase
        .from('ambassador_requests' as any)
        .update({ 
          status: 'rejected',
          rejection_reason: reason,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId));

      if (error) throw error;

      // Log admin action
      await logAdminAction({
        actionType: 'reject_ambassador',
        targetTable: 'ambassador_requests',
        targetId: requestId,
        targetUserId: request?.user_id,
        newValues: { status: 'rejected', rejection_reason: reason },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-ambassador-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-ambassador-request'] });
      toast.success('Ambassador request rejected');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject: ${error.message}`);
    },
  });
}

// Remove ambassador role from a user
export function useRemoveAmbassadorRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'ambassador');

      if (error) throw error;

      // Log admin action
      await logAdminAction({
        actionType: 'remove_ambassador_role',
        targetTable: 'user_roles',
        targetUserId: userId,
        oldValues: { role: 'ambassador' },
        newValues: { role: null },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-ambassadors'] });
      queryClient.invalidateQueries({ queryKey: ['is-ambassador'] });
      toast.success('Ambassador role removed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove role: ${error.message}`);
    },
  });
}
