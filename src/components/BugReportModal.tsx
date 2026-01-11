import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { sessionLogger } from '@/lib/session-logger';
import { useSubmitBugReport, useUploadBugScreenshot } from '@/hooks/use-bug-reports';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImagePlus, X, Loader2 } from 'lucide-react';

interface BugReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BugReportModal({ open, onOpenChange }: BugReportModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const submitBugReport = useSubmitBugReport();
  const uploadScreenshot = useUploadBugScreenshot();

  const isSubmitting = submitBugReport.isPending || uploadScreenshot.isPending;

  const handleScreenshotChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeScreenshot = useCallback(() => {
    setScreenshot(null);
    setScreenshotPreview(null);
  }, []);

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setScreenshot(null);
    setScreenshotPreview(null);
  }, []);

  const handleSubmit = async () => {
    if (!user || !title || !description) return;

    try {
      let screenshotUrl: string | null = null;

      // Upload screenshot if provided
      if (screenshot) {
        screenshotUrl = await uploadScreenshot.mutateAsync({
          userId: user.id,
          file: screenshot,
        });
      }

      // Get session data for debugging
      const sessionData = sessionLogger.getSessionData();

      // Submit bug report
      await submitBugReport.mutateAsync({
        user_id: user.id,
        title,
        description,
        screenshot_url: screenshotUrl,
        page_url: window.location.href,
        browser_info: JSON.parse(JSON.stringify(sessionData.browser_info)),
        console_logs: JSON.parse(JSON.stringify(sessionData.console_logs)),
        user_actions: JSON.parse(JSON.stringify(sessionData.user_actions)),
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit bug report:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report a Bug</DialogTitle>
          <DialogDescription>
            Help us improve by reporting issues you encounter. We'll automatically capture some debug information to help us investigate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bug-title">Title *</Label>
            <Input
              id="bug-title"
              placeholder="Brief summary of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bug-description">Description *</Label>
            <Textarea
              id="bug-description"
              placeholder="Please describe what happened, what you expected to happen, and steps to reproduce the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Screenshot (optional)</Label>
            {screenshotPreview ? (
              <div className="relative inline-block">
                <img
                  src={screenshotPreview}
                  alt="Screenshot preview"
                  className="max-h-40 rounded-md border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -right-2 -top-2 h-6 w-6"
                  onClick={removeScreenshot}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="hidden"
                  id="screenshot-upload"
                />
                <Label
                  htmlFor="screenshot-upload"
                  className="flex h-24 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/25 bg-muted/50 text-sm text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted"
                >
                  <ImagePlus className="h-5 w-5" />
                  Click to upload a screenshot
                </Label>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            We'll automatically capture your current page URL, browser info, and recent console logs to help us debug the issue.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !description.trim()}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
