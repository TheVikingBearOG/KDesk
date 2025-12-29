import * as z from "zod";

import { createTRPCRouter, publicProcedure } from "../create-context";
import type { MailboxConfig, User, Department } from "@/backend/types/ticket";

const mockConfig: MailboxConfig = {
  id: "1",
  supportEmail: "support@company.com",
  imapHost: "imap.gmail.com",
  imapPort: 993,
  imapUsername: "support@company.com",
  imapPassword: "",
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpUsername: "support@company.com",
  smtpPassword: "",
  emailSignature: "\n\n---\nBest regards,\nSupport Team",
  isActive: false,
};

type ThemeType = "light" | "dark" | "plex";

interface BrandingConfig {
  companyName: string;
  theme: ThemeType;
}

const mockBranding: BrandingConfig = {
  companyName: "KDesk",
  theme: "light",
};

const mockDepartments: Department[] = [
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

export const mockStaff: User[] = [
  {
    id: "tech1",
    email: "sarah@company.com",
    name: "Sarah Agent",
    role: "staff",
    departmentId: "dept1",
    isActive: true,
    password: "password123",
    mustChangePassword: false,
  },
  {
    id: "tech2",
    email: "tom@company.com",
    name: "Tom Support",
    role: "staff",
    departmentId: "dept1",
    isActive: true,
    password: "password123",
    mustChangePassword: false,
  },
  {
    id: "tech3",
    email: "emma@company.com",
    name: "Emma Billing",
    role: "staff",
    departmentId: "dept2",
    isActive: true,
    password: "password123",
    mustChangePassword: false,
  },
];

export const settingsRouter = createTRPCRouter({
  getMailboxConfig: publicProcedure.query(() => {
    return mockConfig;
  }),

  updateMailboxConfig: publicProcedure
    .input(
      z.object({
        supportEmail: z.string().email(),
        imapHost: z.string(),
        imapPort: z.number(),
        imapUsername: z.string(),
        imapPassword: z.string(),
        smtpHost: z.string(),
        smtpPort: z.number(),
        smtpUsername: z.string(),
        smtpPassword: z.string(),
        emailSignature: z.string(),
      }),
    )
    .mutation(({ input }) => {
      Object.assign(mockConfig, input);
      mockConfig.isActive = true;
      return mockConfig;
    }),

  listDepartments: publicProcedure.query(() => {
    return mockDepartments.filter((d) => d.isActive);
  }),

  createDepartment: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
      }),
    )
    .mutation(({ input }) => {
      const newDepartment: Department = {
        id: `dept${Date.now()}`,
        name: input.name,
        description: input.description,
        isActive: true,
      };
      mockDepartments.push(newDepartment);
      return newDepartment;
    }),

  listStaff: publicProcedure.query(() => {
    return mockStaff.filter((t) => t.isActive);
  }),

  createStaff: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string(),
        role: z.enum(["staff", "admin"]),
        departmentId: z.string().optional(),
        password: z.string().min(6),
      }),
    )
    .mutation(({ input }) => {
      const newStaff: User = {
        id: `staff${Date.now()}`,
        email: input.email,
        name: input.name,
        role: input.role,
        departmentId: input.departmentId,
        isActive: true,
        password: input.password,
        mustChangePassword: true,
      };
      mockStaff.push(newStaff);
      return newStaff;
    }),

  updateStaff: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
        role: z.enum(["staff", "admin"]),
        departmentId: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      const staff = mockStaff.find((t) => t.id === input.id);
      if (!staff) {
        throw new Error("Staff not found");
      }
      staff.name = input.name;
      staff.email = input.email;
      staff.role = input.role;
      staff.departmentId = input.departmentId;
      return staff;
    }),

  deleteStaff: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const staff = mockStaff.find((t) => t.id === input.id);
      if (!staff) {
        throw new Error("Staff not found");
      }
      staff.isActive = false;
      return { success: true };
    }),

  getBranding: publicProcedure.query(() => {
    return mockBranding;
  }),

  updateBranding: publicProcedure
    .input(
      z.object({
        companyName: z.string(),
        theme: z.enum(["light", "dark", "plex"]),
      }),
    )
    .mutation(({ input }) => {
      Object.assign(mockBranding, input);
      return mockBranding;
    }),

  changePassword: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        currentPassword: z.string(),
        newPassword: z.string(),
      }),
    )
    .mutation(({ input }) => {
      const staff = mockStaff.find((s) => s.id === input.userId);
      if (!staff) {
        throw new Error("User not found");
      }
      if (staff.password !== input.currentPassword) {
        throw new Error("Current password is incorrect");
      }
      staff.password = input.newPassword;
      staff.mustChangePassword = false;
      return { success: true };
    }),

  login: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        password: z.string(),
      }),
    )
    .mutation(({ input }) => {
      const staff = mockStaff.find((s) => s.id === input.userId);
      if (!staff) {
        throw new Error("Invalid user ID or password");
      }
      if (staff.password !== input.password) {
        throw new Error("Invalid user ID or password");
      }
      return {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role === "admin" ? "Administrator" : "Staff",
        mustChangePassword: staff.mustChangePassword,
      };
    }),

  getUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      const staff = mockStaff.find((s) => s.id === input.userId);
      if (!staff) {
        return null;
      }
      return {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role === "admin" ? "Administrator" : "Staff",
        mustChangePassword: staff.mustChangePassword,
      };
    }),
});
