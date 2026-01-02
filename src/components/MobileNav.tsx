import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, LayoutDashboard, User, LogOut, Layers, Bell } from 'lucide-react';
import { useState } from 'react';
import { useUnreadCount } from '@/hooks/use-notifications';

export function MobileNav() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: unreadCount } = useUnreadCount(user?.id);

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate('/login');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>
            <Link 
              to="/" 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              onClick={() => setOpen(false)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Layers className="h-4 w-4 text-primary-foreground" />
              </div>
              AnonForge
            </Link>
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-8 flex flex-col gap-2">
          <Button
            variant="ghost"
            className="justify-start"
            asChild
            onClick={() => setOpen(false)}
          >
            <Link to="/dashboard">
              <LayoutDashboard className="mr-3 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="justify-start relative"
            asChild
            onClick={() => setOpen(false)}
          >
            <Link to="/dashboard">
              <Bell className="mr-3 h-4 w-4" />
              Notifications
              {unreadCount && unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="ml-auto h-5 min-w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            asChild
            onClick={() => setOpen(false)}
          >
            <Link to="/profile">
              <User className="mr-3 h-4 w-4" />
              Profile
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="justify-start text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </Button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
