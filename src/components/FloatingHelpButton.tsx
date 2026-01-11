import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, FileText, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BugReportModal } from '@/components/BugReportModal';

export function FloatingHelpButton() {
  const [bugReportOpen, setBugReportOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg border-border bg-background hover:bg-muted transition-all hover:scale-105 md:bottom-6 md:right-6"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link to="/documentation" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentation
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setBugReportOpen(true)} className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Report a Bug
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BugReportModal open={bugReportOpen} onOpenChange={setBugReportOpen} />
    </>
  );
}
