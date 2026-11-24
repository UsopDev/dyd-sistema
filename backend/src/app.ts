import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { randomUUID } from "node:crypto";
import { prisma } from "./lib/prisma.js";
import { openApiSpec } from "./lib/openapi.js";
import { logger, createRequestLogger } from "./lib/logger.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usuariosRouter } from "./modules/usuarios/usuarios.routes.js";
import { clientesRouter } from "./modules/clientes/clientes.routes.js";
import { maquinasRouter } from "./modules/maquinas/maquinas.routes.js";
import { materialesRouter } from "./modules/materiales/materiales.routes.js";
import { solicitudesRouter } from "./modules/solicitudes/solicitudes.routes.js";
import { diagnosticosRouter } from "./modules/diagnosticos/diagnosticos.routes.js";
import { cotizacionesRouter } from "./modules/cotizaciones/cotizaciones.routes.js";
import { ordenesRouter } from "./modules/ordenes/ordenes.routes.js";
import { usoRouter } from "./modules/uso/uso.routes.js";
import { preventivosRouter } from "./modules/preventivos/preventivos.routes.js";
import { alertasCorreoRouter } from "./modules/preventivos/alertas-correo.js";
import { reportesRouter } from "./modules/reportes/reportes.routes.js";
import { requireAuth, requireRol } from "./middleware/auth.js";
import { env } from "./config/env.js";

export const app = express();

// Request ID middleware (para correlacionar logs)
app.use((req, _res, next) => {
  req.id = (req.headers["x-request-id"] as string) || randomUUID();
  next();
});

// Logger de requests (solo en dev para no saturar)
if (env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    const start = Date.now();
    const reqLogger = createRequestLogger(req.id);
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (res.statusCode >= 400) {
        reqLogger.warn(
          {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration,
          },
          "HTTP request",
        );
      } else {
        reqLogger.debug(
          {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration,
          },
          "HTTP request",
        );
      }
    });
    next();
  });
}

// Seguridad y parsing
app.use(helmet());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Rate limiting global (100 req/15min por IP)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
    keyGenerator: (req) => ipKeyGenerator(req.ip ?? "unknown"),
  }),
);

// Swagger UI (solo en desarrollo)
if (env.NODE_ENV !== "production") {
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "DYD Sistema API Docs",
    }),
  );
  // JSON spec endpoint
  app.get("/api/docs.json", (_req, res) => {
    res.json(openApiSpec);
  });
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/health/db", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", database: "conectada" });
});

app.use("/api/auth", authRouter);
app.use(
  "/api/usuarios",
  requireAuth,
  requireRol("ADMINISTRADOR"),
  usuariosRouter,
);
app.use("/api/clientes", requireAuth, clientesRouter);
app.use("/api/maquinas", requireAuth, maquinasRouter);
app.use("/api/materiales", requireAuth, materialesRouter);
app.use("/api/solicitudes", requireAuth, solicitudesRouter);
app.use("/api/diagnosticos", requireAuth, diagnosticosRouter);
app.use(
  "/api/cotizaciones",
  requireAuth,
  requireRol("ADMINISTRADOR"),
  cotizacionesRouter,
);
app.use("/api/ordenes", requireAuth, ordenesRouter);
app.use("/api/uso", requireAuth, usoRouter);
app.use("/api/preventivos", requireAuth, preventivosRouter);
app.use(
  "/api/alertas-correo",
  requireAuth,
  requireRol("ADMINISTRADOR"),
  alertasCorreoRouter,
);
app.use(
  "/api/reportes",
  requireAuth,
  requireRol("ADMINISTRADOR"),
  reportesRouter,
);

app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

type ErrorHttp = Error & { status?: number; statusCode?: number };

app.use(
  (
    err: ErrorHttp,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const status = err.status ?? err.statusCode ?? 500;
    const reqLogger = createRequestLogger(req.id);

    // Errores del cliente (4xx): loguear como warn, no error
    if (status >= 400 && status < 500) {
      reqLogger.warn({ err, status }, "Client error");
      res.status(status).json({ error: "Solicitud inválida" });
      return;
    }

    // Errores del servidor (5xx): loguear como error con stack
    reqLogger.error({ err, status }, "Server error");
    res.status(500).json({ error: "Error interno del servidor" });
  },
);

// Extender Express Request para incluir id
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}
