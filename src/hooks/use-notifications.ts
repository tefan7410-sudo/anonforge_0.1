import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
import { Id } from '../../convex/_generated/dataModel';

export interface Notification {
  _id: Id<"notifications">;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  metadata?: Record<string, unknown>;
  _creationTime: number;
}

export function useNotifications(limit = 20) {
  const { user } = useAuth();

  const notifications = useQuery(
    api.notifications.list,
    user?.id ? { userId: user.id, limit } : "skip"
  );

  return {
    data: notifications as Notification[] | undefined,
    isLoading: notifications === undefined,
    error: null,
    refetch: () => {},
  };
}

export function useUnreadCount() {
  const { user } = useAuth();

  const count = useQuery(
    api.notifications.unreadCount,
    user?.id ? { userId: user.id } : "skip"
  );

  return {
    data: count ?? 0,
    isLoading: count === undefined,
  };
}

export function useMarkAsRead() {
  const markAsRead = useMutation(api.notifications.markAsRead);

  return {
    mutateAsync: async (notificationId: string) => {
      await markAsRead({ id: notificationId as Id<"notifications"> });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useMarkAllAsRead() {
  const { user } = useAuth();
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  return {
    mutateAsync: async () => {
      if (!user?.id) return;
      await markAllAsRead({ userId: user.id });
    },
    mutate: () => {},
    isPending: false,
  };
}

export function useDeleteNotification() {
  const removeNotification = useMutation(api.notifications.remove);

  return {
    mutateAsync: async (notificationId: string) => {
      await removeNotification({ id: notificationId as Id<"notifications"> });
    },
    mutate: () => {},
    isPending: false,
  };
}
