import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { fetchProfilesForUserIds, type ProfileData } from '@/lib/admin-helpers';

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

    // Type assertion needed since admin_audit_logs is not in types.ts
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

interface AdminCollection {
  id: string;
  project_id: string;
  banner_url: string | null;
  logo_url: string | null;
  tagline: string | null;
  is_live: boolean;
  is_hidden: boolean;
  founder_verified: boolean;
  founder_name: string | null;
  founder_twitter: string | null;
  max_supply: number | null;
  created_at: string;
  scheduled_launch_at: string | null;
  admin_approved: boolean;
  rejection_reason: string | null;
  project: {
    id: string;
    name: string;
    owner_id: string;
  };
}

interface VerificationRequest {
  id: string;
  user_id: string;
  twitter_handle: string;
  bio: string | null;
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

interface AdminUserCredit {
  id: string;
  user_id: string;
  free_credits: number;
  purchased_credits: number;
  next_reset_at: string;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

// Check if current user is an admin (admin or owner role)
export function useIsAdmin() {
  return useQuery({
    queryKey: ['is-admin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'owner']);

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }

      return data && data.length > 0;
    },
  });
}

// Check if current user is the owner (only tefan7410@gmail.com)
export function useIsOwner() {
  return useQuery({
    queryKey: ['is-owner'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

      if (error) {
        console.error('Error checking owner status:', error);
        return false;
      }

      return !!data;
    },
  });
}

// User with roles interface
interface UserWithRoles {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  stake_address: string | null;
  wallet_address: string | null;
  wallet_connected_at: string | null;
  user_roles: { role: string }[];
}

// Get all users with their roles (two-step fetch to avoid FK join issues)
export function useAllUserRoles() {
  return useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      // Step 1: Fetch all profiles including wallet info
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, email, avatar_url, stake_address, wallet_address, wallet_connected_at')
        .order('email');

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) return [];

      // Step 2: Fetch all user_roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Build a map of user_id -> roles
      const rolesMap = new Map<string, { role: string }[]>();
      for (const r of roles || []) {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push({ role: r.role });
        rolesMap.set(r.user_id, existing);
      }

      // Merge profiles with their roles
      return profiles.map(profile => ({
        id: profile.id,
        display_name: profile.display_name,
        email: profile.email,
        avatar_url: profile.avatar_url,
        stake_address: profile.stake_address,
        wallet_address: profile.wallet_address,
        wallet_connected_at: profile.wallet_connected_at,
        user_roles: rolesMap.get(profile.id) || [],
      })) as UserWithRoles[];
    },
  });
}

// Set a user's role (admin can set ambassador/admin, cannot set owner)
export function useAdminSetUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      role 
    }: { 
      userId: string; 
      role: 'ambassador' | 'admin' | null;
    }) => {
      // CRITICAL: Never allow setting owner role
      if ((role as string) === 'owner') {
        throw new Error('Owner role cannot be assigned');
      }

      // Get current roles for audit log
      const { data: currentRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      // Delete existing non-owner roles
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .in('role', ['ambassador', 'admin', 'moderator', 'user']);

      if (deleteError) throw deleteError;

      // Insert new role if provided
      if (role) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });

        if (insertError) throw insertError;
      }

      // Log admin action
      await logAdminAction({
        actionType: 'set_user_role',
        targetTable: 'user_roles',
        targetUserId: userId,
        oldValues: { roles: currentRoles?.map(r => r.role) || [] },
        newValues: { role: role || 'creator (no role)' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ambassadors'] });
      queryClient.invalidateQueries({ queryKey: ['all-ambassadors'] });
      toast.success('User role updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });
}

// Get all collections for admin dashboard
export function useAdminCollections() {
  return useQuery({
    queryKey: ['admin-collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_pages')
        .select(`
          id,
          project_id,
          banner_url,
          logo_url,
          tagline,
          is_live,
          is_hidden,
          founder_verified,
          founder_name,
          founder_twitter,
          max_supply,
          created_at,
          scheduled_launch_at,
          admin_approved,
          rejection_reason,
          project:projects!inner(id, name, owner_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as AdminCollection[];
    },
  });
}

// Get pending collections awaiting approval
export function usePendingCollections() {
  return useQuery({
    queryKey: ['pending-collections'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('product_pages')
        .select(`
          id,
          project_id,
          banner_url,
          logo_url,
          tagline,
          is_live,
          is_hidden,
          founder_verified,
          founder_name,
          founder_twitter,
          max_supply,
          created_at,
          scheduled_launch_at,
          admin_approved,
          rejection_reason,
          project:projects!inner(id, name, owner_id)
        `)
        .eq('is_live', true)
        .eq('admin_approved', false)
        .gt('scheduled_launch_at', now)
        .order('scheduled_launch_at', { ascending: true });

      if (error) throw error;
      return data as unknown as AdminCollection[];
    },
  });
}

// Get pending verification requests (two-step fetch)
export function usePendingVerificationRequests() {
  return useQuery({
    queryKey: ['pending-verification-requests'],
    queryFn: async () => {
      // Step 1: Fetch verification requests
      const { data: requests, error } = await supabase
        .from('creator_verification_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!requests || requests.length === 0) return [];

      // Step 2: Fetch profiles for user_ids
      const userIds = requests.map(r => r.user_id);
      const profileMap = await fetchProfilesForUserIds(userIds);

      // Merge profiles into requests
      return requests.map(request => ({
        ...request,
        profile: profileMap.get(request.user_id) || undefined,
      })) as VerificationRequest[];
    },
  });
}

// Toggle collection hidden status
export function useToggleCollectionHidden() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productPageId, hidden }: { productPageId: string; hidden: boolean }) => {
      // Get current state for audit log
      const { data: current } = await supabase
        .from('product_pages')
        .select('is_hidden, project_id')
        .eq('id', productPageId)
        .single();

      const { error } = await supabase
        .from('product_pages')
        .update({ is_hidden: hidden })
        .eq('id', productPageId);

      if (error) throw error;

      // Log admin action
      await logAdminAction({
        actionType: hidden ? 'hide_collection' : 'unhide_collection',
        targetTable: 'product_pages',
        targetId: productPageId,
        oldValues: { is_hidden: current?.is_hidden },
        newValues: { is_hidden: hidden },
        metadata: { project_id: current?.project_id },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      queryClient.invalidateQueries({ queryKey: ['pending-collections'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-collections'] });
      toast.success('Collection visibility updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}

// Approve a scheduled collection
export function useApproveCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productPageId }: { productPageId: string }) => {
      // Get current state for audit log
      const { data: current } = await supabase
        .from('product_pages')
        .select('admin_approved, project_id')
        .eq('id', productPageId)
        .single();

      const { error } = await supabase
        .from('product_pages')
        .update({ 
          admin_approved: true,
          rejection_reason: null,
        })
        .eq('id', productPageId);

      if (error) throw error;

      // Log admin action
      await logAdminAction({
        actionType: 'approve_collection',
        targetTable: 'product_pages',
        targetId: productPageId,
        oldValues: { admin_approved: current?.admin_approved },
        newValues: { admin_approved: true },
        metadata: { project_id: current?.project_id },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      queryClient.invalidateQueries({ queryKey: ['pending-collections'] });
      toast.success('Collection approved!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });
}

// Reject a scheduled collection
export function useRejectCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productPageId, reason }: { productPageId: string; reason: string }) => {
      // Get current state for audit log
      const { data: current } = await supabase
        .from('product_pages')
        .select('is_live, admin_approved, scheduled_launch_at, project_id')
        .eq('id', productPageId)
        .single();

      const { error } = await supabase
        .from('product_pages')
        .update({ 
          is_live: false,
          admin_approved: false,
          scheduled_launch_at: null,
          rejection_reason: reason,
        })
        .eq('id', productPageId);

      if (error) throw error;

      // Log admin action
      await logAdminAction({
        actionType: 'reject_collection',
        targetTable: 'product_pages',
        targetId: productPageId,
        oldValues: { 
          is_live: current?.is_live, 
          admin_approved: current?.admin_approved,
          scheduled_launch_at: current?.scheduled_launch_at 
        },
        newValues: { 
          is_live: false, 
          admin_approved: false, 
          scheduled_launch_at: null,
          rejection_reason: reason 
        },
        metadata: { project_id: current?.project_id },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      queryClient.invalidateQueries({ queryKey: ['pending-collections'] });
      toast.success('Collection rejected');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject: ${error.message}`);
    },
  });
}

// Approve a creator verification request
export function useApproveVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, userId }: { requestId: string; userId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update the request status
      const { error: requestError } = await supabase
        .from('creator_verification_requests')
        .update({ 
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Update the profile to mark as verified creator
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_verified_creator: true })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Log admin action
      await logAdminAction({
        actionType: 'approve_verification',
        targetTable: 'creator_verification_requests',
        targetId: requestId,
        targetUserId: userId,
        newValues: { status: 'approved', is_verified_creator: true },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['is-verified-creator'] });
      toast.success('Creator verified!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to verify: ${error.message}`);
    },
  });
}

// Reject a creator verification request
export function useRejectVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user_id for audit log
      const { data: request } = await supabase
        .from('creator_verification_requests')
        .select('user_id')
        .eq('id', requestId)
        .single();

      const { error } = await supabase
        .from('creator_verification_requests')
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
        actionType: 'reject_verification',
        targetTable: 'creator_verification_requests',
        targetId: requestId,
        targetUserId: request?.user_id,
        newValues: { status: 'rejected', rejection_reason: reason },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-verification-request'] });
      toast.success('Verification request rejected');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject: ${error.message}`);
    },
  });
}

// Check if twitter handle is available
export async function checkTwitterHandleAvailable(handle: string, currentUserId: string): Promise<{ available: boolean; claimedBy?: string }> {
  const normalizedHandle = handle.replace('@', '').toLowerCase();
  
  const { data, error } = await supabase
    .from('verified_twitter_handles')
    .select('user_id')
    .eq('twitter_handle', normalizedHandle)
    .maybeSingle();

  if (error) {
    console.error('Error checking twitter handle:', error);
    return { available: true };
  }

  if (!data) {
    return { available: true };
  }

  // Handle is claimed - check if it's by the current user
  return { 
    available: data.user_id === currentUserId,
    claimedBy: data.user_id 
  };
}

// Get all user credits for admin dashboard (two-step fetch)
export function useAllUserCredits() {
  return useQuery({
    queryKey: ['admin-user-credits'],
    queryFn: async () => {
      // Step 1: Fetch all user credits
      const { data: credits, error } = await supabase
        .from('user_credits')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      if (!credits || credits.length === 0) return [];

      // Step 2: Fetch profiles for user_ids
      const userIds = credits.map(c => c.user_id);
      const profileMap = await fetchProfilesForUserIds(userIds);

      // Merge profiles into credits
      return credits.map(credit => ({
        ...credit,
        profile: profileMap.get(credit.user_id) || undefined,
      })) as AdminUserCredit[];
    },
  });
}

// Get credit transactions for a specific user
export function useUserCreditTransactions(userId: string | null) {
  return useQuery({
    queryKey: ['admin-user-transactions', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

// Admin adjust credits (add or remove)
export function useAdminAdjustCredits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      amount, 
      type, 
      reason 
    }: { 
      userId: string; 
      amount: number; 
      type: 'add' | 'remove'; 
      reason: string;
    }) => {
      const actualAmount = type === 'add' ? amount : -amount;
      
      // First get current credits
      const { data: currentCredits, error: fetchError } = await supabase
        .from('user_credits')
        .select('free_credits, purchased_credits')
        .eq('user_id', userId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Calculate new values - admin adjustments go to purchased_credits
      const newPurchasedCredits = currentCredits.purchased_credits + actualAmount;
      
      // Don't allow negative credits
      if (newPurchasedCredits < 0) {
        throw new Error('Cannot remove more credits than available');
      }
      
      // Update the credits
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({ 
          purchased_credits: newPurchasedCredits,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
      
      // Log the transaction
      const { error: txError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: actualAmount,
          transaction_type: type === 'add' ? 'admin_add' : 'admin_remove',
          description: reason,
        });
      
      if (txError) throw txError;

      // Log admin action
      await logAdminAction({
        actionType: type === 'add' ? 'add_credits' : 'remove_credits',
        targetTable: 'user_credits',
        targetUserId: userId,
        oldValues: { 
          free_credits: currentCredits.free_credits,
          purchased_credits: currentCredits.purchased_credits 
        },
        newValues: { 
          free_credits: currentCredits.free_credits,
          purchased_credits: newPurchasedCredits 
        },
        metadata: { amount: actualAmount, reason },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-credits'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-transactions'] });
      toast.success('Credits adjusted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to adjust credits: ${error.message}`);
    },
  });
}
