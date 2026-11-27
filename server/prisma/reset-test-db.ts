// Empties the TEST database and creates the users for the e2e tests.
// Run by e2e/playwright.config.ts after `prisma migrate deploy`.
import { prisma } from "../src/db";
import { Role } from "../generated/client";
import { createUser } from "./create-user";

function required(key: string) {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not set. Run the tests from e2e/.`);
  return value;
}

// Safety: ask the server which database we are connected to before deleting.
const [row] = await prisma.$queryRaw<{ name: string }[]>`
  SELECT current_database()::text AS name`;
if (!row?.name.endsWith("_test")) {
  throw new Error(`Refusing to reset "${row?.name}": name must end in _test.`);
}

const tables = await prisma.$queryRaw<{ tablename: string }[]>`
  SELECT tablename::text AS tablename FROM pg_tables
  WHERE schemaname = current_schema() AND tablename <> '_prisma_migrations'`;
const list = tables.map((t) => `"${t.tablename}"`).join(", ");
if (list) {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

for (const role of [Role.admin, Role.agent]) {
  const prefix = `E2E_${role.toUpperCase()}`;
  await createUser({
    email: required(`${prefix}_EMAIL`),
    password: required(`${prefix}_PASSWORD`),
    name: `E2E ${role}`,
    role,
  });
}

console.log(`Test database "${row.name}" reset.`);
await prisma.$disconnect();
