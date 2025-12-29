import { createTRPCRouter } from "./create-context";
import { ticketsRouter } from "./routes/tickets";
import { settingsRouter } from "./routes/settings";
import { chatRouter } from "./routes/chat";
import { notificationsRouter } from "./routes/notifications";

export const appRouter = createTRPCRouter({
  tickets: ticketsRouter,
  settings: settingsRouter,
  chat: chatRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
