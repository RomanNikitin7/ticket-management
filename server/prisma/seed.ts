// Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD (idempotent).
import { prisma } from "../src/db";
import { Role } from "../generated/client";
import { createUser } from "./create-user";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME ?? "Admin";

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env");
  process.exit(1);
}

const created = await createUser({ email, name, password, role: Role.admin });
console.log(created ? `Admin created: ${email}` : `Admin already exists: ${email}`);

await prisma.$disconnect();
