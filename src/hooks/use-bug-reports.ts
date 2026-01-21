import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
import { Id } from '../../convex/_generated/dataModel';
import { toast } from 'sonner';

export interface BugReport {
  _id: Id<"bug_reports">;
  id?: string;
  user_id?: string;
  title: string;
  description: string;
  screenshot_url?: string;
  status: string;
  admin_notes?: string;
  page_url?: string;
  browser_info?: Record<string, unknown>;
  console_logs?: Record<string, unknown>;
  user_actions?: Record<string, unknown>;
  error_stack?: string;
  severity?: string;
  updated_at?: string;
  _creationTime: number;
  profiles?: {
    display_name?: string;
    email?: string;
    avatar_url?: string;
  } | null;
}

export function useSubmitBugReport() {
  const submit = useMutation(api.bugReports.submit);
  const { user } = useAuth();

  return {
    mutateAsync: async (report: {
      title: string;
      description: string;
      screenshotUrl?: string;
      pageUrl?: string;
      browserInfo?: Record<string, unknown>;
      consoleLogs?: Record<string, unknown>;
      userActions?: Record<string, unknown>;
      errorStack?: string;
      severity?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      await submit({
        title: report.title,
        description: report.description,
        screenshotUrl: report.screenshotUrl,
        pageUrl: report.pageUrl,
        browserInfo: report.browserInfo,
        consoleLogs: report.consoleLogs,
        userActions: report.userActions,
        errorStack: report.errorStack,
        severity: report.severity,
      });

      toast.success('Bug report submitted successfully');
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useMyBugReports() {
  const { user } = useAuth();
  const reports = useQuery(
    api.bugReports.getMyReports,
    user?.id ? {} : "skip"
  );

  return {
    data: reports as BugReport[] | undefined,
    isLoading: reports === undefined,
    error: null,
    refetch: () => {},
  };
}

// Admin hooks (already exist in use-admin.ts)
export function useBugReports(status?: string) {
  const reports = useQuery(api.admin.getBugReports, status ? { status } : {});

  return {
    data: reports as BugReport[] | undefined,
    isLoading: reports === undefined,
    error: null,
    refetch: () => {},
  };
}

export function useAllBugReports() {
  return useBugReports();
}

export function useBugReportCount(status?: string) {
  const reports = useQuery(api.admin.getBugReports, status ? { status } : {});

  return {
    data: reports?.length || 0,
    isLoading: reports === undefined,
  };
}

export function useUpdateBugStatus() {
  const updateStatus = useMutation(api.admin.updateBugStatus);

  return {
    mutateAsync: async (id: string, status: string, adminNotes?: string) => {
      await updateStatus({ 
        id: id as Id<"bug_reports">, 
        status, 
        adminNotes 
      });
      toast.success('Bug report updated');
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useUploadBugScreenshot() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  return {
    mutateAsync: async (file: File): Promise<string> => {
      const uploadUrl = await generateUploadUrl();
      
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      const { storageId } = await response.json();
      
      // Return URL - would need to get from Convex file storage
      return `/files/${storageId}`;
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useUpdateBugReport() {
  const updateStatus = useMutation(api.admin.updateBugStatus);

  return {
    mutateAsync: async (id: string, updates: {
      status?: string;
      adminNotes?: string;
    }) => {
      if (updates.status) {
        await updateStatus({ 
          id: id as Id<"bug_reports">, 
          status: updates.status,
          adminNotes: updates.adminNotes,
        });
      }
      toast.success('Bug report updated');
    },
    mutate: () => {},
    isPending: false,
  };
}
