// Public sign-up is disabled, so scripts create accounts through Better Auth's
// internal adapter, the same way its sign-up route does it.
import { auth } from "../src/auth";
import type { Role } from "../generated/client";

type NewUser = { email: string; name: string; password: string; role: Role };

// Returns false if a user with this email already exists.
export async function createUser({ email, name, password, role }: NewUser) {
  const ctx = await auth.$context;
  if (await ctx.internalAdapter.findUserByEmail(email)) return false;

  const hash = await ctx.password.hash(password);
  const user = await ctx.internalAdapter.createUser(
    {
      email: email.toLowerCase(),
      name,
      emailVerified: true,
      role,
      active: true,
    },
    { method: "email-password" },
  );
  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: hash,
  });
  return true;
}
