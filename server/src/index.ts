import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth";
import { prisma } from "./db";

const app = express();
const port = process.env.PORT || 3000;
// Local only by default; set HOST to accept connections from other machines.
const host = process.env.HOST || "127.0.0.1";

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:5173",
    credentials: true,
  }),
);

// Better Auth must be mounted BEFORE express.json() (Express 5 wildcard syntax).
const authHandler = toNodeHandler(auth);

app.all("/api/auth/*splat", (req, res) => {
  // Overwrites any value sent by the client; used for rate limiting.
  req.headers["x-client-ip"] = req.socket.remoteAddress ?? "";
  return authHandler(req, res);
});

app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    console.error(err);
    res.status(503).json({ status: "error", db: "unreachable" });
  }
});

// Returns the logged-in user and session, or 401.
app.get("/api/me", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json(session);
});

// Must stay last. Logs the details and returns no internals to the client.
const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  console.error(err);
  if (res.headersSent) {
    next(err);
    return;
  }
  const status = err.status >= 400 && err.status < 500 ? err.status : 500;
  res
    .status(status)
    .json({ error: status === 500 ? "Internal server error" : "Invalid request" });
};
app.use(errorHandler);

app.listen(Number(port), host, () => {
  console.log(`Server running on http://${host}:${port}`);
});
