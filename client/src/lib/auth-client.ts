import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

// Same origin as the app: Vite proxies /api to the Express server.
export const authClient = createAuthClient({
  plugins: [
    // Mirrors the extra user fields declared in server/src/auth.ts.
    inferAdditionalFields({
      user: {
        role: { type: "string" },
      },
    }),
  ],
});