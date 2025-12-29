import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import type { ChatChannel, ChatMessage, TaggableUser, TaggableDepartment } from "../../types/chat";
import { createNotification } from "./notifications";
import { mockStaff } from "./settings";
import type { User } from "../../types/ticket";

const mockChannels: ChatChannel[] = [
  {
    id: "general",
    name: "General",
    department: "all",
    description: "General discussion for all staff",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "system",
    isPrivate: false,
    memberIds: [],
  },
  {
    id: "tech",
    name: "Technical Support",
    department: "technical",
    description: "Technical support team channel",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "system",
    isPrivate: false,
    memberIds: [],
  },
  {
    id: "billing",
    name: "Billing Department",
    department: "billing",
    description: "Billing and finance team",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "system",
    isPrivate: false,
    memberIds: [],
  },
];



const mockMessages: ChatMessage[] = [
  {
    id: "msg1",
    channelId: "general",
    userId: "user1",
    userName: "Sarah Agent",
    userRole: "Agent",
    content: "Good morning team! Ready for another day 💪",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "msg2",
    channelId: "general",
    userId: "user2",
    userName: "Tom Support",
    userRole: "Agent",
    content: "Morning! Let's crush those tickets today",
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: "msg3",
    channelId: "tech",
    userId: "user1",
    userName: "Sarah Agent",
    userRole: "Agent",
    content: "Hey @Mike Tech, can you help with the login issue in ticket #10421?",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    mentions: ["user4"],
  },
];

export const chatRouter = createTRPCRouter({
  getChannels: publicProcedure.query(() => {
    return [...mockChannels].sort((a, b) => a.name.localeCompare(b.name));
  }),

  getChannel: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const channel = mockChannels.find((c) => c.id === input.id);
      return channel;
    }),

  createChannel: publicProcedure
    .input(
      z.object({
        name: z.string(),
        department: z.string(),
        description: z.string().optional(),
        isPrivate: z.boolean(),
        memberIds: z.array(z.string()).optional(),
      })
    )
    .mutation(({ input }) => {
      const id = `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const channel: ChatChannel = {
        id,
        name: input.name,
        department: input.department,
        description: input.description,
        createdAt: now,
        createdBy: "current_user",
        isPrivate: input.isPrivate,
        memberIds: input.memberIds || [],
      };

      mockChannels.push(channel);
      return channel;
    }),

  updateChannel: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        memberIds: z.array(z.string()).optional(),
      })
    )
    .mutation(({ input }) => {
      const channel = mockChannels.find((c) => c.id === input.id);

      if (!channel) {
        throw new Error("Channel not found");
      }

      if (input.name) channel.name = input.name;
      if (input.description !== undefined) channel.description = input.description;
      if (input.memberIds) channel.memberIds = input.memberIds;

      return channel;
    }),

  deleteChannel: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const index = mockChannels.findIndex((c) => c.id === input.id);
      if (index !== -1) {
        mockChannels.splice(index, 1);
      }
      const messagesToRemove = mockMessages.filter((m) => m.channelId === input.id);
      messagesToRemove.forEach((msg) => {
        const msgIndex = mockMessages.indexOf(msg);
        if (msgIndex !== -1) mockMessages.splice(msgIndex, 1);
      });
      return { success: true };
    }),

  getMessages: publicProcedure
    .input(
      z.object({
        channelId: z.string(),
        limit: z.number().optional().default(100),
      })
    )
    .query(({ input }) => {
      const messages = mockMessages
        .filter((m) => m.channelId === input.channelId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(-input.limit);
      return messages;
    }),

  getUsersForTagging: publicProcedure
    .input(z.object({ query: z.string().optional() }))
    .query(({ input }) => {
      const taggableUsers: TaggableUser[] = mockStaff
        .filter((u: User) => u.isActive)
        .map((user: User) => ({
          id: user.id,
          name: user.name,
          role: user.role === "admin" ? "Administrator" : "Staff",
          email: user.email,
        }));

      if (!input.query) {
        return taggableUsers;
      }
      const lowerQuery = input.query.toLowerCase();
      return taggableUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(lowerQuery) ||
          user.email.toLowerCase().includes(lowerQuery)
      );
    }),

  getDepartmentsForTagging: publicProcedure
    .input(z.object({ query: z.string().optional() }))
    .query(({ input }) => {
      const mockDepartments = [
        {
          id: "dept1",
          name: "Technical Support",
          description: "Handles technical issues and troubleshooting",
          isActive: true,
        },
        {
          id: "dept2",
          name: "Billing",
          description: "Handles billing and payment issues",
          isActive: true,
        },
        {
          id: "dept3",
          name: "Sales",
          description: "Handles sales inquiries and demos",
          isActive: true,
        },
      ];

      const taggableDepartments: TaggableDepartment[] = mockDepartments
        .filter((d) => d.isActive)
        .map((dept) => {
          const userCount = mockStaff.filter(
            (u: User) => u.departmentId === dept.id && u.isActive
          ).length;
          return {
            id: dept.id,
            name: dept.name,
            type: "department" as const,
            userCount,
          };
        });

      if (!input.query) {
        return taggableDepartments;
      }

      const lowerQuery = input.query.toLowerCase();
      return taggableDepartments.filter((dept) =>
        dept.name.toLowerCase().includes(lowerQuery)
      );
    }),

  sendMessage: publicProcedure
    .input(
      z.object({
        channelId: z.string(),
        content: z.string(),
        attachments: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              url: z.string(),
              type: z.string(),
              size: z.number(),
            })
          )
          .optional(),
        mentions: z.array(z.string()).optional(),
        departmentMentions: z.array(z.string()).optional(),
        ticketReferences: z.array(z.string()).optional(),
        userId: z.string().optional(),
        userName: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const message: ChatMessage = {
        id,
        channelId: input.channelId,
        userId: input.userId || "current_user",
        userName: input.userName || "Current User",
        userRole: "Agent",
        content: input.content,
        createdAt: now,
        attachments: input.attachments,
        mentions: input.mentions,
        departmentMentions: input.departmentMentions,
        ticketReferences: input.ticketReferences,
      };

      mockMessages.push(message);

      const channel = mockChannels.find((c) => c.id === input.channelId);

      if (input.mentions && input.mentions.length > 0) {
        input.mentions.forEach((userId) => {
          if (userId !== (input.userId || "current_user")) {
            createNotification({
              userId,
              type: "chat_mention",
              title: "Mentioned in Chat",
              message: `${input.userName || "Someone"} mentioned you in #${channel?.name || "chat"}: ${input.content.substring(0, 100)}${input.content.length > 100 ? "..." : ""}`,
              channelId: input.channelId,
              messageId: id,
              read: false,
            });
          }
        });
      }

      if (input.departmentMentions && input.departmentMentions.length > 0) {
        const mockDepartments = [
          {
            id: "dept1",
            name: "Technical Support",
          },
          {
            id: "dept2",
            name: "Billing",
          },
          {
            id: "dept3",
            name: "Sales",
          },
        ];

        input.departmentMentions.forEach((deptId) => {
          const department = mockDepartments.find((d) => d.id === deptId);
          const usersInDepartment = mockStaff.filter(
            (u: User) => u.departmentId === deptId && u.isActive
          );

          usersInDepartment.forEach((user: User) => {
            if (user.id !== (input.userId || "current_user")) {
              createNotification({
                userId: user.id,
                type: "chat_mention",
                title: "Department Mentioned in Chat",
                message: `${input.userName || "Someone"} mentioned @${department?.name || "your department"} in #${channel?.name || "chat"}: ${input.content.substring(0, 100)}${input.content.length > 100 ? "..." : ""}`,
                channelId: input.channelId,
                messageId: id,
                read: false,
              });
            }
          });
        });
      }

      return message;
    }),

  editMessage: publicProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string(),
      })
    )
    .mutation(({ input }) => {
      const message = mockMessages.find((m) => m.id === input.id);

      if (!message) {
        throw new Error("Message not found");
      }

      message.content = input.content;
      message.editedAt = new Date().toISOString();

      return message;
    }),

  deleteMessage: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const index = mockMessages.findIndex((m) => m.id === input.id);
      if (index !== -1) {
        mockMessages.splice(index, 1);
      }
      return { success: true };
    }),
});
