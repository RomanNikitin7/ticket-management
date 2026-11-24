import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  // Sessions live in the database (no secondaryStorage, no cookieCache).
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // extend at most once a day while active
  },

  // Public sign-up is off: accounts are created by the seed script (admin).
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },

  user: {
    additionalFields: {
      role: {
        type: ["admin", "agent"],
        required: false,
        defaultValue: "agent",
        input: false, // clients can never set their own role
      },
      active: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
    },
  },

  // The browser talks to Vite (5173), which proxies /api to this server.
  trustedOrigins: [process.env.CLIENT_URL ?? "http://localhost:5173"],
});
