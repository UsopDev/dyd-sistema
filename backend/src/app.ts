import express from "express";
import helmet from "helmet";
import cors from "cors";
import { prisma } from "./lib/prisma.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/health/db", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", database: "conectada" });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  },
);
