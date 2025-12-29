export interface ChatChannel {
  id: string;
  name: string;
  department: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  isPrivate: boolean;
  memberIds: string[];
}

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userRole: string;
  content: string;
  createdAt: string;
  editedAt?: string;
  attachments?: ChatAttachment[];
  mentions?: string[];
  ticketReferences?: string[];
}

export interface ChatAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface TaggableUser {
  id: string;
  name: string;
  role: string;
  email: string;
}

export type CreateChannelInput = {
  name: string;
  department: string;
  description?: string;
  isPrivate: boolean;
  memberIds?: string[];
};

export type SendMessageInput = {
  channelId: string;
  content: string;
  attachments?: ChatAttachment[];
  mentions?: string[];
  ticketReferences?: string[];
};

export type UpdateChannelInput = {
  id: string;
  name?: string;
  description?: string;
  memberIds?: string[];
};
