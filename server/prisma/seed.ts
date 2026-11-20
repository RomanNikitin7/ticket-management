// Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD (idempotent).
// Public sign-up is disabled, so accounts are created through Better Auth's
// internal adapter, the same way its sign-up route does it.
import { auth } from "../src/auth";
import { prisma } from "../src/db";
import { Role } from "../generated/client";

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
    role: Role.admin,
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
