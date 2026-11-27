import type { RequestHandler } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth";

declare global {
  namespace Express {
    interface Request {
      // Set by requireAuth.
      user?: typeof auth.$Infer.Session.user;
    }
  }
}

// Responds 401 without a valid session and 403 for deactivated users.
export const requireAuth: RequestHandler = async (req, res, next) => {
  const { headers, response: session } = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
    returnHeaders: true,
  });

  // getSession may extend the session; pass the renewed cookie to the browser.
  const cookies = headers.getSetCookie();
  if (cookies.length > 0) res.append("Set-Cookie", cookies);

  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!session.user.active) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  req.user = session.user;
  next();
};
