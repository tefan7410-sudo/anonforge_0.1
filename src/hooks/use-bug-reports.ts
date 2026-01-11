import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface BugReportInsert {
  user_id: string;
  title: string;
  description: string;
  screenshot_url?: string | null;
  page_url?: string | null;
  browser_info?: Json;
  console_logs?: Json;
  user_actions?: Json;
  error_stack?: string | null;
}

export interface BugReport {
  id: string;
  user_id: string;
  title: string;
  description: string;
  screenshot_url: string | null;
  status: string;
  admin_notes: string | null;
  page_url: string | null;
  browser_info: Json;
  console_logs: Json;
  user_actions: Json;
  error_stack: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export function useSubmitBugReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (report: BugReportInsert) => {
      const { data, error } = await supabase
        .from('bug_reports')
        .insert({
          user_id: report.user_id,
          title: report.title,
          description: report.description,
          screenshot_url: report.screenshot_url,
          page_url: report.page_url,
          browser_info: report.browser_info as never,
          console_logs: report.console_logs as never,
          user_actions: report.user_actions as never,
          error_stack: report.error_stack,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug-reports'] });
      toast.success('Bug report submitted successfully');
    },
    onError: (error) => {
      console.error('Failed to submit bug report:', error);
      toast.error('Failed to submit bug report');
    },
  });
}

export function useUploadBugScreenshot() {
  return useMutation({
    mutationFn: async ({ userId, file }: { userId: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('bug-screenshots')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('bug-screenshots')
        .getPublicUrl(fileName);

      return publicUrl;
    },
    onError: (error) => {
      console.error('Failed to upload screenshot:', error);
      toast.error('Failed to upload screenshot');
    },
  });
}

export function useAllBugReports(status?: string) {
  return useQuery({
    queryKey: ['bug-reports', 'all', status],
    queryFn: async () => {
      let query = supabase
        .from('bug_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(data?.map((r) => r.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, email, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return (data || []).map((report) => ({
        ...report,
        profiles: profileMap.get(report.user_id) || null,
      })) as BugReport[];
    },
  });
}

export function useUpdateBugReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      admin_notes,
    }: {
      id: string;
      status?: string;
      admin_notes?: string;
    }) => {
      const updates: Record<string, unknown> = {};
      if (status) updates.status = status;
      if (admin_notes !== undefined) updates.admin_notes = admin_notes;

      const { error } = await supabase
        .from('bug_reports')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug-reports'] });
      toast.success('Bug report updated');
    },
    onError: (error) => {
      console.error('Failed to update bug report:', error);
      toast.error('Failed to update bug report');
    },
  });
}

export function useMyBugReports() {
  return useQuery({
    queryKey: ['bug-reports', 'mine'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bug_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useBugReportCount() {
  return useQuery({
    queryKey: ['bug-reports', 'count', 'open'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('bug_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      if (error) throw error;
      return count || 0;
    },
  });
}
