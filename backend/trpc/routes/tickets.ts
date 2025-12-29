import * as z from "zod";

import { createTRPCRouter, publicProcedure } from "../create-context";
import type { Ticket, User } from "@/backend/types/ticket";
import { createNotification } from "./notifications";
import { mockTechnicians } from "./settings";

function generateEmailSignature(user: User): string {
  const department = user.departmentId ? mockDepartments.find(d => d.id === user.departmentId)?.name || '' : '';
  
  return `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-family: Arial, sans-serif;">
      <table cellpadding="0" cellspacing="0" border="0" style="font-size: 14px; color: #374151;">
        <tr>
          <td style="padding-right: 20px; vertical-align: top;">
            ${user.avatarUrl 
              ? `<img src="${user.avatarUrl}" alt="${user.name}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover;" />` 
              : `<div style="width: 80px; height: 80px; border-radius: 8px; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; color: white;">${user.name.charAt(0)}</div>`
            }
          </td>
          <td style="vertical-align: top;">
            <div style="font-weight: 700; font-size: 16px; color: #1f2937; margin-bottom: 4px;">${user.name}</div>
            ${user.role === 'admin' ? '<div style="font-size: 12px; color: #3B82F6; font-weight: 600; margin-bottom: 8px;">Administrator</div>' : '<div style="font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 8px;">Support Technician</div>'}
            ${department ? `<div style="color: #6b7280; margin-bottom: 4px;"><strong>Department:</strong> ${department}</div>` : ''}
            <div style="color: #3B82F6; margin-bottom: 4px;">
              <a href="mailto:${user.email}" style="color: #3B82F6; text-decoration: none;">${user.email}</a>
            </div>
            <div style="margin-top: 12px; color: #9ca3af; font-size: 12px;">
              <strong>KDesk Support</strong> | We're here to help
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

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

const mockTickets: Ticket[] = [
  {
    id: "1",
    ticketNumber: 10421,
    subject: "Unable to login to my account",
    requesterEmail: "john@example.com",
    requesterName: "John Doe",
    status: "open",
    priority: "high",
    channel: "email",
    assignedToId: "agent1",
    assignedToName: "Sarah Agent",
    tags: ["login", "account"],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    messages: [
      {
        id: "m1",
        ticketId: "1",
        type: "inbound",
        from: "john@example.com",
        to: "support@company.com",
        subject: "Unable to login to my account",
        bodyText: "I've been trying to login for the past hour but keep getting an error message.",
        bodyHtml: "<p>I've been trying to login for the past hour but keep getting an error message.</p>",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        messageId: "msg1@example.com",
        attachments: [],
        isInternal: false,
      },
      {
        id: "m2",
        ticketId: "1",
        type: "outbound",
        from: "support@company.com",
        to: "john@example.com",
        subject: "Re: Unable to login to my account [KDESK-10421]",
        bodyText: "Hi John, I'm sorry to hear you're having trouble. Can you tell me what error message you're seeing?",
        bodyHtml: "<p>Hi John,</p><p>I'm sorry to hear you're having trouble. Can you tell me what error message you're seeing?</p>",
        timestamp: new Date(Date.now() - 90 * 60 * 1000),
        messageId: "msg2@example.com",
        inReplyTo: "msg1@example.com",
        attachments: [],
        isInternal: false,
      },
      {
        id: "m3",
        ticketId: "1",
        type: "note",
        from: "support@company.com",
        to: "support@company.com",
        subject: "",
        bodyText: "User seems to be entering wrong password. Sent password reset link.",
        bodyHtml: "<p>User seems to be entering wrong password. Sent password reset link.</p>",
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        attachments: [],
        isInternal: true,
      },
    ],
  },
  {
    id: "2",
    ticketNumber: 10422,
    subject: "Billing question about my subscription",
    requesterEmail: "sarah@example.com",
    requesterName: "Sarah Smith",
    status: "new",
    priority: "normal",
    channel: "web",
    tags: ["billing"],
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000),
    messages: [
      {
        id: "m4",
        ticketId: "2",
        type: "inbound",
        from: "sarah@example.com",
        to: "support@company.com",
        subject: "Billing question about my subscription",
        bodyText: "I was charged twice this month. Can you please look into this?",
        bodyHtml: "<p>I was charged twice this month. Can you please look into this?</p>",
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        attachments: [],
        isInternal: false,
      },
    ],
  },
  {
    id: "3",
    ticketNumber: 10423,
    subject: "Feature request: Dark mode",
    requesterEmail: "mike@example.com",
    requesterName: "Mike Johnson",
    status: "pending",
    priority: "low",
    channel: "email",
    assignedToId: "agent2",
    assignedToName: "Tom Support",
    tags: ["feature-request"],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    messages: [
      {
        id: "m5",
        ticketId: "3",
        type: "inbound",
        from: "mike@example.com",
        to: "support@company.com",
        subject: "Feature request: Dark mode",
        bodyText: "Would love to see a dark mode option in the app!",
        bodyHtml: "<p>Would love to see a dark mode option in the app!</p>",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        attachments: [],
        isInternal: false,
      },
    ],
  },
];

export const ticketsRouter = createTRPCRouter({
  getStats: publicProcedure.query(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dailyStats: {
      date: string;
      opened: number;
      closed: number;
    }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const opened = mockTickets.filter(t => {
        const createdDate = new Date(t.createdAt);
        return createdDate >= date && createdDate < nextDate;
      }).length;
      
      const closed = mockTickets.filter(t => {
        const updatedDate = new Date(t.updatedAt);
        return t.status === 'closed' && updatedDate >= date && updatedDate < nextDate;
      }).length;
      
      dailyStats.push({
        date: date.toISOString().split('T')[0],
        opened,
        closed,
      });
    }

    return {
      totalTickets: mockTickets.length,
      totalOpen: mockTickets.filter(t => t.status === 'open').length,
      totalClosed: mockTickets.filter(t => t.status === 'closed').length,
      totalNew: mockTickets.filter(t => t.status === 'new').length,
      totalPending: mockTickets.filter(t => t.status === 'pending').length,
      totalSolved: mockTickets.filter(t => t.status === 'solved').length,
      dailyStats,
    };
  }),

  list: publicProcedure
    .input(
      z.object({
        status: z.enum(["all", "new", "open", "pending", "solved", "closed"]).optional(),
        search: z.string().optional(),
        assignedToMe: z.boolean().optional(),
        unassigned: z.boolean().optional(),
        currentUserId: z.string().optional(),
      }),
    )
    .query(({ input }) => {
      let filtered = [...mockTickets];

      if (input.assignedToMe && input.currentUserId) {
        filtered = filtered.filter((t) => t.assignedToId === input.currentUserId);
      }

      if (input.unassigned) {
        filtered = filtered.filter((t) => !t.assignedToId);
      }

      if (input.status && input.status !== "all") {
        filtered = filtered.filter((t) => t.status === input.status);
      }

      if (input.search) {
        const search = input.search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.subject.toLowerCase().includes(search) ||
            t.requesterEmail.toLowerCase().includes(search) ||
            t.ticketNumber.toString().includes(search),
        );
      }

      return filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const ticket = mockTickets.find((t) => t.id === input.id);
      if (!ticket) {
        throw new Error("Ticket not found");
      }
      return ticket;
    }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["new", "open", "pending", "solved", "closed"]),
      }),
    )
    .mutation(({ input }) => {
      const ticket = mockTickets.find((t) => t.id === input.id);
      if (!ticket) {
        throw new Error("Ticket not found");
      }
      ticket.status = input.status;
      ticket.updatedAt = new Date();
      return ticket;
    }),

  assignToTechnician: publicProcedure
    .input(
      z.object({
        ticketId: z.string(),
        technicianId: z.string().optional(),
        technicianName: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      const ticket = mockTickets.find((t) => t.id === input.ticketId);
      if (!ticket) {
        throw new Error("Ticket not found");
      }
      const previousTechnicianId = ticket.assignedToId;
      ticket.assignedToId = input.technicianId;
      ticket.assignedToName = input.technicianName;
      ticket.updatedAt = new Date();

      if (input.technicianId && input.technicianId !== previousTechnicianId) {
        createNotification({
          userId: input.technicianId,
          type: "ticket_assigned",
          title: "Ticket Assigned",
          message: `You have been assigned to ticket #${ticket.ticketNumber}: ${ticket.subject}`,
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          read: false,
        });
      }

      return ticket;
    }),

  assignToDepartment: publicProcedure
    .input(
      z.object({
        ticketId: z.string(),
        departmentId: z.string().optional(),
        departmentName: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      const ticket = mockTickets.find((t) => t.id === input.ticketId);
      if (!ticket) {
        throw new Error("Ticket not found");
      }
      ticket.departmentId = input.departmentId;
      ticket.departmentName = input.departmentName;
      ticket.updatedAt = new Date();
      return ticket;
    }),

  addReply: publicProcedure
    .input(
      z.object({
        ticketId: z.string(),
        body: z.string(),
        isInternal: z.boolean(),
        userId: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      const ticket = mockTickets.find((t) => t.id === input.ticketId);
      if (!ticket) {
        throw new Error("Ticket not found");
      }

      let bodyHtml = `<p>${input.body.replace(/\n/g, '<br>')}</p>`;
      let bodyText = input.body;

      if (!input.isInternal && input.userId) {
        const user = mockTechnicians.find((t: User) => t.id === input.userId);
        if (user) {
          const signature = generateEmailSignature(user);
          bodyHtml += signature;
          bodyText += `\n\n---\n${user.name}\n${user.email}`;
        }
      }

      const newMessage = {
        id: `m${Date.now()}`,
        ticketId: input.ticketId,
        type: input.isInternal ? ("note" as const) : ("outbound" as const),
        from: "support@company.com",
        to: ticket.requesterEmail,
        subject: input.isInternal ? "" : `Re: ${ticket.subject} [KDESK-${ticket.ticketNumber}]`,
        bodyText,
        bodyHtml,
        timestamp: new Date(),
        attachments: [],
        isInternal: input.isInternal,
      };

      ticket.messages.push(newMessage);
      ticket.updatedAt = new Date();

      return ticket;
    }),

  create: publicProcedure
    .input(
      z.object({
        subject: z.string(),
        requesterEmail: z.string().email(),
        requesterName: z.string(),
        body: z.string(),
        channel: z.enum(["email", "web"]),
      }),
    )
    .mutation(({ input }) => {
      const existingTickets = mockTickets
        .filter((t) => t.requesterEmail === input.requesterEmail)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      const mostRecentTicket = existingTickets[0];

      if (mostRecentTicket && mostRecentTicket.status !== "closed" && mostRecentTicket.status !== "solved") {
        const newMessage = {
          id: `m${Date.now()}`,
          ticketId: mostRecentTicket.id,
          type: "inbound" as const,
          from: input.requesterEmail,
          to: "support@company.com",
          subject: input.subject,
          bodyText: input.body,
          bodyHtml: `<p>${input.body}</p>`,
          timestamp: new Date(),
          attachments: [],
          isInternal: false,
        };

        mostRecentTicket.messages.push(newMessage);
        mostRecentTicket.updatedAt = new Date();
        if (mostRecentTicket.status === "pending") {
          mostRecentTicket.status = "open";
        }

        return mostRecentTicket;
      }

      const newTicket: Ticket = {
        id: `${Date.now()}`,
        ticketNumber: 10424 + mockTickets.length,
        subject: input.subject,
        requesterEmail: input.requesterEmail,
        requesterName: input.requesterName,
        status: "new",
        priority: "normal",
        channel: input.channel,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [
          {
            id: `m${Date.now()}`,
            ticketId: `${Date.now()}`,
            type: "inbound",
            from: input.requesterEmail,
            to: "support@company.com",
            subject: input.subject,
            bodyText: input.body,
            bodyHtml: `<p>${input.body}</p>`,
            timestamp: new Date(),
            attachments: [],
            isInternal: false,
          },
        ],
      };

      mockTickets.unshift(newTicket);
      return newTicket;
    }),
});
