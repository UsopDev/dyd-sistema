# DYD Sistema — Frontend

SPA en React + Vite + TypeScript para el personal de DYD (administradores y técnicos).

El cliente de la empresa **no accede al sistema**: sus datos se registran en el módulo de clientes y recibe la cotización y el informe de servicio como documentos.

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

| Portal  | Email             | Contraseña    |
| ------- | ----------------- | ------------- |
| Staff   | `admin@dyd.com`   | `Admin1234`   |
| Staff   | `tecnico@dyd.com` | `Tecnico1234` |

Los usuarios demo se crean con `backend/prisma/seed.ts`. Re-ejecutar el seed **restablece** las contraseñas de los dos usuarios, así que sirve para recuperar el acceso demo. Las credenciales se configuran con `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DEMO_TECNICO_EMAIL` y `DEMO_TECNICO_PASSWORD` (mínimo 8 caracteres). Tomá como base `backend/.env.example`.

El seed también crea un **cliente demo** (empresa cliente de ejemplo) para que el administrador tenga registros de prueba. No tiene credenciales: el cliente no inicia sesión.

## Rutas

- `/login` — acceso del equipo DYD (admin y técnicos)
- `/admin` — panel de administración, con datos reales del backend
- `/admin/solicitudes` — solicitudes de mantenimiento
- `/admin/diagnosticos` — diagnósticos técnicos
- `/admin/cotizaciones` — cotizaciones
- `/admin/ordenes` — órdenes de trabajo
- `/admin/clientes` — clientes (registros de empresa cliente)
- `/admin/maquinas` — maquinaria
- `/admin/materiales` — inventario de materiales
- `/admin/preventivos` — mantenimiento preventivo
- `/admin/usuarios` — administración de usuarios
- `/admin/reportes` — reportes e historiales
- `/tecnico` — portal del técnico
- `/tecnico/solicitudes` — solicitudes asignadas y diagnóstico
- `/tecnico/ordenes` — órdenes asignadas al técnico

## Estructura

```
src/
  app/                  Router, 403 y 404
  components/
    charts/             Tooltip y leyenda compartidos de Recharts
    layout/             AppShell, layout de staff, PageHeader
    ui/                 Componentes base (glass card, botones, inputs, logo)
  features/
    admin/              CRUD de los 10 módulos del panel de administración
    auth/               Proveedor de sesión, guardas y pantalla de login
    dashboard/          Dashboards de administración y técnico
    technician/         Páginas del portal del técnico
  lib/                  HTTP con refresh single-flight, formato y utilidades
  styles/               Tailwind 4 + tema visual (glassmorphism azul)
  types/                Tipos espejo de las respuestas del backend
```

## Sesión

- Cookies `HttpOnly` emitidas por el backend (`access_token` + `refresh_token`). El frontend nunca lee tokens.
- Al inicializar, el proveedor consulta `/api/auth/me`. Ante un `401`, el interceptor de axios refresca la sesión una sola vez y reintenta la petición original.
- Si el refresco falla, se limpia la sesión y las guardas redirigen al login.

## Scripts

```bash
npm run dev        # servidor de desarrollo
npm run build      # typecheck + build de producción
npm run preview    # previsualizar el build
npm run typecheck  # solo TypeScript
```

## Estado

**Fases 0, 1 y 2 completadas:** base del proyecto, sistema de diseño, AppShell, login con guardas por rol, refresh automático, dashboards reales de administración y técnico, y los 10 módulos CRUD del panel de administración conectados a la API.

**Siguiente:** Fase 3 — construcción final, pruebas (caja blanca y caja negra), validación de calidad según ISO 25010 y despliegue en preproducción.
