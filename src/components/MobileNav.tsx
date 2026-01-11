import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, LayoutDashboard, User, LogOut, Bell, Store, Settings, Home, HelpCircle, Coins, Heart, Zap } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useState } from 'react';
import { useUnreadCount } from '@/hooks/use-notifications';
import { useProfile } from '@/hooks/use-profile';
import { useCreditBalance } from '@/hooks/use-credits';
import { formatCredits } from '@/lib/credit-constants';

export function MobileNav() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { data: unreadCount } = useUnreadCount(user?.id);
  const { data: profile } = useProfile(user?.id);
  const { totalCredits, isLowCredits } = useCreditBalance();

  // Check if we're on a project page to show settings link
  const projectMatch = location.pathname.match(/^\/project\/([^/]+)$/);
  const projectId = projectMatch?.[1];

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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary p-1.5">
                <Logo className="h-full w-full" />
              </div>
              AnonForge
            </Link>
          </SheetTitle>
        </SheetHeader>

        {/* User Info */}
        {user && (
          <div className="mt-6 flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>
                {(profile?.display_name || user.email || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {profile?.display_name || 'User'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        )}

        <nav className="mt-6 flex flex-col gap-1">
          <Button
            variant="ghost"
            className="justify-start"
            asChild
            onClick={() => setOpen(false)}
          >
            <Link to="/">
              <Home className="mr-3 h-4 w-4" />
              Home
            </Link>
          </Button>
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
            className="justify-start"
            asChild
            onClick={() => setOpen(false)}
          >
            <Link to="/marketplace">
              <Store className="mr-3 h-4 w-4" />
              Marketplace
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
            <Link to="/credits">
              <Coins className={`mr-3 h-4 w-4 ${isLowCredits ? 'text-warning' : ''}`} />
              Credits
              <Badge 
                variant="outline" 
                className={`ml-auto ${isLowCredits ? 'border-warning text-warning' : ''}`}
              >
                {formatCredits(totalCredits)}
              </Badge>
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            asChild
            onClick={() => setOpen(false)}
          >
            <Link to="/documentation">
              <HelpCircle className="mr-3 h-4 w-4" />
              Help & Docs
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            asChild
            onClick={() => setOpen(false)}
          >
            <Link to="/artfund">
              <Heart className="mr-3 h-4 w-4" />
              Art Fund
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            asChild
            onClick={() => setOpen(false)}
          >
            <Link to="/status">
              <Zap className="mr-3 h-4 w-4" />
              Status
            </Link>
          </Button>

          {projectId && (
            <>
              <div className="my-2 border-t border-border" />
              <Button
                variant="ghost"
                className="justify-start"
                asChild
                onClick={() => setOpen(false)}
              >
                <Link to={`/project/${projectId}/settings`}>
                  <Settings className="mr-3 h-4 w-4" />
                  Project Settings
                </Link>
              </Button>
            </>
          )}

          <div className="my-2 border-t border-border" />
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
            className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
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
