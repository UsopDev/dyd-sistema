import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { prisma } from "./lib/prisma.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usuariosRouter } from "./modules/usuarios/usuarios.routes.js";
import { clientesRouter } from "./modules/clientes/clientes.routes.js";
import { maquinasRouter } from "./modules/maquinas/maquinas.routes.js";
import { materialesRouter } from "./modules/materiales/materiales.routes.js";
import { requireAuth, requireRol } from "./middleware/auth.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/health/db", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", database: "conectada" });
});

app.use("/api/auth", authRouter);
app.use("/api/usuarios", requireAuth, requireRol("ADMINISTRADOR"), usuariosRouter);
app.use("/api/clientes", requireAuth, clientesRouter);
app.use("/api/maquinas", requireAuth, maquinasRouter);
app.use("/api/materiales", requireAuth, materialesRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

type ErrorHttp = Error & { status?: number; statusCode?: number };

app.use(
  (err: ErrorHttp, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status ?? err.statusCode ?? 500;

    // Errores del cliente (JSON mal formado, cuerpo demasiado grande...): 4xx, sin ruido en consola
    if (status >= 400 && status < 500) {
      res.status(status).json({ error: "Solicitud inválida" });
      return;
    }

    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  },
);
