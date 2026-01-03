import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  type Notification,
} from '@/hooks/use-notifications';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Check, CheckCheck, Users, MessageSquare, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function NotificationDropdown() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: notifications, isLoading } = useNotifications(user?.id);
  const { data: unreadCount } = useUnreadCount(user?.id);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const handleNotificationClick = async (notification: Notification) => {
    if (!user) return;

    // Mark as read
    if (!notification.is_read) {
      await markAsRead.mutateAsync({
        notificationId: notification.id,
        userId: user.id,
      });
    }

    // Navigate if link exists
    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await markAllAsRead.mutateAsync(user.id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'project_invite':
        return <Users className="h-4 w-4 text-primary" />;
      case 'comment_mention':
      case 'comment_reply':
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case 'project_inactivity_warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'project_deleted':
        return <Trash2 className="h-4 w-4 text-destructive" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              {markAllAsRead.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <CheckCheck className="h-3 w-3 mr-1" />
              )}
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-80">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications && notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex items-start gap-3 p-3 cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        notification.is_read ? 'text-muted-foreground' : ''
                      }`}
                    >
                      {notification.title}
                    </span>
                    {!notification.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p 
                    className="text-xs text-muted-foreground line-clamp-3"
                    title={notification.message}
                  >
                    {notification.message}
                  </p>
                  <span className="text-xs text-muted-foreground/70">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                {notification.is_read && (
                  <Check className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
