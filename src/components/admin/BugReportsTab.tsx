import { useState } from 'react';
import { useAllBugReports, useUpdateBugReport } from '@/hooks/use-bug-reports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bug,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertCircle,
  AlertTriangle,
  Info,
  Monitor,
  Clock,
  Terminal,
  MousePointer,
  Image,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open', color: 'bg-yellow-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-500' },
  { value: 'closed', label: 'Closed', color: 'bg-muted-foreground' },
];

function getStatusBadge(status: string) {
  const option = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  return (
    <Badge variant="outline" className="gap-1">
      <span className={`h-2 w-2 rounded-full ${option.color}`} />
      {option.label}
    </Badge>
  );
}

function LogLevelIcon({ level }: { level: string }) {
  switch (level) {
    case 'error':
      return <AlertCircle className="h-3 w-3 text-destructive" />;
    case 'warn':
      return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
    default:
      return <Info className="h-3 w-3 text-muted-foreground" />;
  }
}

function BugReportRow({ report }: { report: ReturnType<typeof useAllBugReports>['data'][number] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [adminNotes, setAdminNotes] = useState(report.admin_notes || '');
  const updateBugReport = useUpdateBugReport();

  const profile = report.profiles;
  const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'Unknown';
  const browserInfo = report.browser_info as Record<string, unknown> | null;
  const consoleLogs = report.console_logs as Array<{ level: string; message: string; timestamp: number }> | null;
  const userActions = report.user_actions as Array<{ type: string; details: string; timestamp: number }> | null;

  const handleStatusChange = (newStatus: string) => {
    updateBugReport.mutate({ id: report.id, status: newStatus });
  };

  const handleSaveNotes = () => {
    updateBugReport.mutate({ id: report.id, admin_notes: adminNotes });
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <TableRow className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{displayName}</span>
              <span className="text-xs text-muted-foreground">{profile?.email}</span>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <span className="font-medium">{report.title}</span>
        </TableCell>
        <TableCell>{getStatusBadge(report.status)}</TableCell>
        <TableCell className="text-muted-foreground">
          {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
        </TableCell>
        <TableCell>
          <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </TableCell>
      </TableRow>

      <CollapsibleContent asChild>
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={5} className="p-0">
            <div className="p-4 space-y-4">
              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.description}</p>
              </div>

              {/* Screenshot */}
              {report.screenshot_url && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Screenshot
                  </h4>
                  <a href={report.screenshot_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={report.screenshot_url}
                      alt="Bug screenshot"
                      className="max-h-60 rounded-md border hover:opacity-90 transition-opacity"
                    />
                  </a>
                </div>
              )}

              {/* Page URL */}
              {report.page_url && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Page URL</h4>
                  <a
                    href={report.page_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    {report.page_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {/* Browser Info */}
                {browserInfo && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Browser Info
                    </h4>
                    <div className="rounded-md border bg-muted/50 p-3 text-xs space-y-1">
                      <p><span className="text-muted-foreground">Platform:</span> {String(browserInfo.platform)}</p>
                      <p><span className="text-muted-foreground">Screen:</span> {String(browserInfo.screenWidth)}x{String(browserInfo.screenHeight)}</p>
                      <p><span className="text-muted-foreground">Window:</span> {String(browserInfo.windowWidth)}x{String(browserInfo.windowHeight)}</p>
                      <p><span className="text-muted-foreground">Timezone:</span> {String(browserInfo.timezone)}</p>
                      <p><span className="text-muted-foreground">Language:</span> {String(browserInfo.language)}</p>
                      <p className="truncate"><span className="text-muted-foreground">User Agent:</span> {String(browserInfo.userAgent)}</p>
                    </div>
                  </div>
                )}

                {/* User Actions */}
                {userActions && userActions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <MousePointer className="h-4 w-4" />
                      Recent Actions ({userActions.length})
                    </h4>
                    <div className="rounded-md border bg-muted/50 p-3 text-xs space-y-1 max-h-40 overflow-y-auto">
                      {userActions.slice().reverse().map((action, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">
                            {new Date(action.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="font-medium">{action.type}:</span>
                          <span className="truncate">{action.details}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Console Logs */}
              {consoleLogs && consoleLogs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    Console Logs ({consoleLogs.length})
                  </h4>
                  <div className="rounded-md border bg-zinc-950 p-3 text-xs space-y-1 max-h-60 overflow-y-auto font-mono">
                    {consoleLogs.slice().reverse().map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-zinc-300">
                        <LogLevelIcon level={log.level} />
                        <span className="text-zinc-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="break-all">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status & Admin Notes */}
              <div className="grid gap-4 md:grid-cols-2 pt-2 border-t">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Update Status</h4>
                  <div>
                    <Select value={report.status} onValueChange={handleStatusChange}>
                      <SelectTrigger className="w-40" onClick={(e) => e.stopPropagation()}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${option.color}`} />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Admin Notes</h4>
                  <div className="flex gap-2">
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this bug..."
                      rows={2}
                      className="text-xs"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveNotes();
                      }}
                      disabled={adminNotes === (report.admin_notes || '')}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function BugReportsTab() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: bugReports, isLoading } = useAllBugReports(statusFilter);

  const openCount = bugReports?.filter((r) => r.status === 'open').length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Bug Reports
              {openCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {openCount} open
                </Badge>
              )}
            </CardTitle>
            <CardDescription>User-submitted bug reports and issues</CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reports</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${option.color}`} />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !bugReports?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bug className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No bug reports found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Reporter</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[120px]">Reported</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {bugReports.map((report) => (
                  <BugReportRow key={report.id} report={report} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
