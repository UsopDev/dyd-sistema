import { app } from "./app.js";
import { env } from "./config/env.js";
import { iniciarRevisionAutomatica } from "./modules/preventivos/alertas-correo.js";

app.listen(env.PORT, () => {
  console.table({
    Servicio: "DYD Sistema",
    Entorno: env.NODE_ENV,
    Puerto: env.PORT,
    URL: `http://localhost:${env.PORT}`,
    "API Docs": `http://localhost:${env.PORT}/api/docs`,
    "Health Check": `http://localhost:${env.PORT}/api/health`,
    "DB Health": `http://localhost:${env.PORT}/api/health/db`,
    "Redis": env.REDIS_URL,
    "Base de datos": env.DATABASE_URL.split("@")[1]?.split("/")[0] ?? "configurada",
    "JWT Access": `${env.JWT_ACCESS_MINUTES} min`,
    "Refresh tokens": "7 días (Redis)",
  });
  iniciarRevisionAutomatica();
});