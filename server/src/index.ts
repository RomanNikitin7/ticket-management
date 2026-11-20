import express from "express";
import cors from "cors";
import { prisma } from "./db";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
