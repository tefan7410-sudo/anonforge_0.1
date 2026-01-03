import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function FloatingHelpButton() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          asChild
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg border-border bg-background hover:bg-muted transition-all hover:scale-105 md:bottom-6 md:right-6"
        >
          <Link to="/documentation">
            <HelpCircle className="h-5 w-5" />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>Help & Documentation</p>
      </TooltipContent>
    </Tooltip>
  );
}
