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

  // Production only (`bun run start` sets NODE_ENV). Better Auth's built-in
  // rule allows 3 requests per 10s on sign-in and change-password.
  rateLimit: { enabled: process.env.NODE_ENV === "production" },

  advanced: {
    // Set by index.ts from the socket address. Never trust X-Forwarded-For here:
    // clients can fake it. Behind a reverse proxy this must be reconfigured.
    ipAddress: { ipAddressHeaders: ["x-client-ip"] },
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
