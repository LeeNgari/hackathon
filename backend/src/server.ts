import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load environment variables from the backend-local .env (if present)
dotenv.config();

// Also load the repo root .env so shared vars like SUPABASE_URL are always available
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { ticketsRouter } from "./routes/tickets.js";

const app = express();

app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/api/tickets", ticketsRouter);

app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Route not found. Ensure the backend is running and the URL is correct.",
    },
  });
});

// Ensure uncaught errors in async route handlers still return JSON (not HTML)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled error:", err?.message ?? err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: (err as Error)?.message ?? "Unexpected server error.",
    },
  });
});

const port = Number(process.env.BACKEND_PORT ?? 4000);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Fieldwork backend listening on port ${port}`);
});

