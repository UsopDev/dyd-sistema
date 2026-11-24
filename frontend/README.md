# DYD Sistema — Frontend

SPA en React + Vite + TypeScript para los portales de administración, técnico y clientes.

## Requisitos

- Node.js 20+
- Backend de DYD corriendo en `http://localhost:3000` (Docker: postgres, redis, backend)

## Puesta en marcha

```bash
# 1) Backend (desde backend/)
docker compose up -d --build

# 2) Sembrar usuarios demo (una sola vez, dentro del contenedor)
docker compose exec backend npx tsx prisma/seed.ts
#    Equivalente desde backend/: npm run db:seed:docker

# 3) Frontend (desde frontend/)
npm install
npm run dev
```

La app queda en `http://localhost:5173`. Vite hace proxy de `/api` hacia `http://localhost:3000`, por lo que no hace falta CORS ni variables de entorno en el frontend.

## Usuarios demo

| Portal  | Email              | Contraseña    |
| ------- | ------------------ | ------------- |
| Staff   | `admin@dyd.com`    | `Admin1234`   |
| Staff   | `tecnico@dyd.com`  | `Tecnico1234` |
| Cliente | `cliente@dyd.com`  | `Cliente1234` |

Los usuarios demo se crean con `backend/prisma/seed.ts`. Re-ejecutar el seed **restablece** las contraseñas de los tres usuarios, así que sirve para recuperar el acceso demo. Las credenciales se configuran con `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DEMO_TECNICO_EMAIL`, `DEMO_TECNICO_PASSWORD`, `DEMO_CLIENTE_EMAIL` y `DEMO_CLIENTE_PASSWORD` (mínimo 8 caracteres). Tomá como base `backend/.env.example`.

## Rutas

- `/login` — acceso del equipo DYD (admin y técnicos)
- `/admin` — panel de administración (Fase 0: dashboard con datos demo)
- `/tecnico` — portal técnico (Fase 1)
- `/cliente/login` — acceso de clientes
- `/cliente` — portal de clientes, solo lectura (Fase 1)

## Estructura

```
src/
  app/                  Router, 403 y 404
  components/
    charts/             Tooltip y leyenda compartidos de Recharts
    layout/             AppShell, layouts de staff/cliente, PageHeader
    ui/                 Componentes base (glass card, botones, inputs, logo)
  features/
    auth/               Proveedores de sesión, guardas y pantallas de login
    dashboard/          Dashboard admin (mock) y placeholders de Fase 1
  lib/                  HTTP con refresh single-flight, formato y utilidades
  styles/               Tailwind 4 + tema visual (glassmorphism azul)
  types/                Tipos espejo de las respuestas del backend
```

## Sesión

- Cookies `HttpOnly` emitidas por el backend (`access_token` + `refresh_token` para staff, `cliente_*` para clientes). El frontend nunca lee tokens.
- Al inicializar, cada proveedor consulta `/me`. Ante un `401`, el interceptor de axios refresca la sesión una sola vez y reintenta la petición original.
- Si el refresco falla, se limpia la sesión y las guardas redirigen al login correspondiente.

## Scripts

```bash
npm run dev        # servidor de desarrollo
npm run build      # typecheck + build de producción
npm run preview    # previsualizar el build
npm run typecheck  # solo TypeScript
```

## Estado

**Fase 0 completada:** base del proyecto, sistema de diseño, AppShell, logins con guardas por rol, refresh automático y dashboard de administración con datos mock (KPIs, tendencia, inventario, solicitudes por estado y tarjetas de destacados).

**Siguiente:** Fase 1 — dashboards reales de técnico y cliente (solo lectura) conectados a `/api/mi/*` y `/api/cliente/*`.
