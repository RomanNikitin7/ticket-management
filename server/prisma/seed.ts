// Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD (idempotent).
// The admin is created through Better Auth's internal adapter (sign-up would
// give the "agent" role, since clients can't set their own role).
import { auth } from "../src/auth";
import { prisma } from "../src/db";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME ?? "Admin";

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env");
  process.exit(1);
}

const ctx = await auth.$context;
const existing = await ctx.internalAdapter.findUserByEmail(email);

if (existing) {
  console.log(`Admin already exists: ${email}`);
} else {
  const hash = await ctx.password.hash(password);
  const user = await ctx.internalAdapter.createUser({
    email: email.toLowerCase(),
    name,
    emailVerified: true,
    role: "admin",
    active: true,
  }, { method: "email-password" });
  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: hash,
  });
  console.log(`Admin created: ${email}`);
}

await prisma.$disconnect();
