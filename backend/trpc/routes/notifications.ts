import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import type { Notification } from "../../types/notification";

export const mockNotifications: Notification[] = [];

export const notificationsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        unreadOnly: z.boolean().optional(),
      })
    )
    .query(({ input }) => {
      let filtered = mockNotifications.filter((n) => n.userId === input.userId);

      if (input.unreadOnly) {
        filtered = filtered.filter((n) => !n.read);
      }

      return filtered.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }),

  markAsRead: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const notification = mockNotifications.find((n) => n.id === input.id);
      if (!notification) {
        throw new Error("Notification not found");
      }
      notification.read = true;
      return notification;
    }),

  markAllAsRead: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(({ input }) => {
      mockNotifications
        .filter((n) => n.userId === input.userId && !n.read)
        .forEach((n) => {
          n.read = true;
        });
      return { success: true };
    }),

  getUnreadCount: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      return mockNotifications.filter(
        (n) => n.userId === input.userId && !n.read
      ).length;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const index = mockNotifications.findIndex((n) => n.id === input.id);
      if (index !== -1) {
        mockNotifications.splice(index, 1);
      }
      return { success: true };
    }),
});

export function createNotification(notification: Omit<Notification, "id" | "createdAt">) {
  const newNotification: Notification = {
    ...notification,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  mockNotifications.push(newNotification);
  return newNotification;
}
