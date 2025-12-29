export type TicketStatus = "new" | "open" | "pending" | "solved" | "closed";
export type TicketPriority = "low" | "normal" | "high";
export type TicketChannel = "email" | "web";

export interface Message {
  id: string;
  ticketId: string;
  type: "inbound" | "outbound" | "note";
  from: string;
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  timestamp: Date;
  messageId?: string;
  inReplyTo?: string;
  attachments: Attachment[];
  isInternal: boolean;
}

export interface Attachment {
  id: string;
  messageId: string;
  filename: string;
  contentType: string;
  size: number;
  url: string;
}

export interface Ticket {
  id: string;
  ticketNumber: number;
  subject: string;
  requesterEmail: string;
  requesterName: string;
  status: TicketStatus;
  priority: TicketPriority;
  channel: TicketChannel;
  assignedToId?: string;
  assignedToName?: string;
  departmentId?: string;
  departmentName?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "technician" | "admin";
  departmentId?: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface MailboxConfig {
  id: string;
  supportEmail: string;
  imapHost: string;
  imapPort: number;
  imapUsername: string;
  imapPassword: string;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  emailSignature: string;
  isActive: boolean;
}
