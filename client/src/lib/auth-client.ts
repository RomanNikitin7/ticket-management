import { createAuthClient } from "better-auth/react";

// Same origin as the app: Vite proxies /api to the Express server.
export const authClient = createAuthClient();
