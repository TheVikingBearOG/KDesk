export type NotificationType = "ticket_assigned" | "chat_mention" | "ticket_reference";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  ticketId?: string;
  ticketNumber?: number;
  channelId?: string;
  messageId?: string;
  read: boolean;
  createdAt: string;
}
