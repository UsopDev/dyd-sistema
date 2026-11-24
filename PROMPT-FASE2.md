# Prompt Fase 2 — DYD Sistema

Copiá y pegalo cuando quieras arrancar la Fase 2.

---

## Contexto actual (resumen ejecutivo)

**Stack**
- Backend: Node 22 + Express 5 + Prisma + PostgreSQL + Redis, dockerizado (`docker compose up -d --build` en `backend/`). Puerto 3000.
- Frontend: React 19 + Vite + TS strict + Tailwind 4 + shadcn/ui + Recharts + React Router 7 + TanStack Query v5 + axios (cookies HttpOnly). Corre en host: `cd frontend && npm run dev` → `http://localhost:5173`. Proxy Vite `/api` → `http://localhost:3000`.

**Autenticación**
- Dos realms: **staff** (`/api/auth/*`) y **cliente** (`/api/cliente/auth/*`).
- Cookies: `access_token` (15 min) + `refresh_token` (7 días staff / 30 días cliente). HttpOnly, `sameSite=lax`, `secure=false` en dev.
- Frontend: `StaffAuthProvider` + `ClientAuthProvider` → `GET /me` al iniciar; interceptors axios con **single-flight refresh** → 401 refresca y reintenta.
- Guards: `RequireStaff({ roles })`, `RequireClient`, `RootRedirect`.
- Logins: `/login` (staff) y `/cliente/login` (cliente).

**Rutas actuales**
```
/admin        → AdminDashboardPage (MOCK: mock-data.ts)
/tecnico      → TechnicianDashboardPage (placeholder "pronto")
/cliente      → ClientDashboardPage (placeholder "pronto")
```

**Usuarios demo** (creados con `npm run db:seed:docker` o `docker compose exec backend npx tsx prisma/seed.ts`)

| Rol           | Email             | Contraseña    |
| ------------- | ----------------- | ------------- |
| Administrador | `admin@dyd.com`   | `Admin1234`   |
| Técnico       | `tecnico@dyd.com` | `Tecnico1234` |
| Cliente       | `cliente@dyd.com` | `Cliente1234` |

---

## Qué es la Fase 2

**Objetivo:** Conectar el **dashboard de administrador real** (reemplazar `mock-data.ts` por llamadas a `/api/reportes/*` y `/api/materiales/stock-bajo`) + **CRUDs completos** de las entidades admin.

**Fase 1** (técnico/cliente solo lectura) se hace aparte; esta es **solo admin**.

---

## Endpoints disponibles (backend ya implementados)

| Endpoint | Response clave | Uso en dashboard |
|----------|----------------|------------------|
| `GET /api/reportes/resumen` | `{ ingresosTotales, clientesActivos, solicitudesTotales, maquinasOperativas, ... }` | 3-4 KPIs principales |
| `GET /api/reportes/ingresos-por-mes?fecha_desde=...&fecha_hasta=...` | `[{ mes: "2026-06", ingresos: 14800, ordenes: 18 }, ...]` | Área Ingresos + Solicitudes/Órdenes |
| `GET /api/reportes/solicitudes-por-estado` | `{ data: [{ estado, cantidad }], total }` | Barras horizontales por estado |
| `GET /api/materiales/stock-bajo` | `{ materiales: [{ nombre, stockActual, stockMinimo, ... }], total }` | Donut: En stock / Bajo / Agotado |

> Para el donut: contás `stockActual >= stockMinimo` = "En stock", `stockActual > 0 && < stockMinimo` = "Bajo stock", `0` = "Agotado".

---

## Qué hay que hacer (checklist Fase 2)

### 1. Capa de tipos + API admin
- `src/types/admin-dashboard.ts` espejo de las 4 respuestas de arriba.
- `src/lib/admin-api.ts` (usa `staffApi` del http.ts) con helpers:
  ```ts
  getResumen(), getIngresosPorMes(desde, hasta), getSolicitudesPorEstado(), getStockBajo()
  ```

### 2. Hooks de datos (TanStack Query)
- `src/features/dashboard/hooks/useAdminDashboard.ts`
  - `useResumen()`, `useIngresosPorMes()`, `useSolicitudesPorEstado()`, `useStockBajo()`
  - `staleTime: 30_000`, `refetchOnWindowFocus: false`
  - Manejo de loading/error consistente con `FullPageLoader` / toast.

### 3. Dashboard admin real
- Nuevo archivo `src/features/dashboard/admin-dashboard-real-page.tsx` (o renombrar el actual y mover mock a `admin-dashboard-mock-page.tsx`).
- Estructura visual **idéntica** al mock actual (mismos componentes: `KpiCard`, `PerformanceTrend`, `InventoryStatus`, `SalesByCategory`, `HighlightCards`).
- Datos vienen de los hooks; transformar a las interfaces que esperan los componentes (`KpiMock`, `PuntoRendimiento`, `SegmentoInventario`, `CategoriaBarra`, etc.).
- Selector de rango de fechas (últimos 6 meses por default) que dispara `useIngresosPorMes`.

### 4. CRUDs admin (shadcn/ui + react-hook-form + zod)
Rutas nuevas bajo `/admin/*` (ya declaradas en `StaffLayout` con `soon: true`):

| Entidad | Rutas | Endpoints backend |
|---------|-------|-------------------|
| Solicitudes | `/admin/solicitudes` (listar, crear, ver, editar estado) | `/api/solicitudes` |
| Diagnósticos | `/admin/diagnosticos` | `/api/diagnosticos` |
| Cotizaciones | `/admin/cotizaciones` | `/api/cotizaciones` |
| Órdenes | `/admin/ordenes` | `/api/ordenes` |
| Clientes | `/admin/clientes` | `/api/clientes` |
| Máquinas | `/admin/maquinas` | `/api/maquinas` |
| Materiales | `/admin/materiales` | `/api/materiales` |
| Preventivos | `/admin/preventivos` | `/api/preventivos` |
| Usuarios | `/admin/usuarios` | `/api/usuarios` |
| Reportes | `/admin/reportes` (ya tiene dashboard) | `/api/reportes/*` |

Patrón: `ListPage` (tabla + paginación + filtros) → `DetailPage` / `CreateDialog` / `EditDialog` → `useMutation` + `queryClient.invalidateQueries`.

### 5. Limpieza
- Eliminar `mock-data.ts` y `admin-dashboard-page.tsx` (o mover a `__mocks__`).
- Quitar `soon: true` de los `NavItem` de `StaffLayout`.
- Agregar breadcrumbs y `PageHeader` coherentes.

---

## Comandos de verificación

```bash
# Backend (desde backend/)
docker compose up -d --build
npm run db:seed:docker
curl -s http://localhost:3000/api/health
curl -s -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" -d '{"email":"admin@dyd.com","password":"Admin1234"}'
curl -s -b cookies.txt http://localhost:3000/api/reportes/resumen | jq .

# Frontend (desde frontend/)
npm install
npm run typecheck
npm run build
npm run dev
# Abrir http://localhost:5173 → login admin → /admin con datos reales
```

---

## Notas de diseño (no negociables)

- **Tema**: idéntico al actual (glassmorphism azul, Plus Jakarta Sans, `bg-white/70 backdrop-blur-xl rounded-2xl`).
- **Componentes**: reutilizar `GlassCard`, `Button`, `Input`, `Badge`, `ChartTooltip`, `ChartLegend`, `PageHeader`, `AppShell`.
- **Gráficos**: Recharts con mismo estilo (gradientes, dots visibles, tooltip glass, leyenda top-right).
- **Responsive**: mobile-first, sidebar colapsable, tablas con scroll horizontal.
- **Estados**: loading skeletons en cards/gráficos, toasts de error con `mensajeDeError`.

---

## Archivos clave a tocar/crear

```
frontend/src/
├── types/
│   └── admin-dashboard.ts          # nuevo
├── lib/
│   └── admin-api.ts                # nuevo
├── features/dashboard/
│   ├── hooks/
│   │   └── useAdminDashboard.ts    # nuevo
│   ├── admin-dashboard-real-page.tsx   # nuevo (reemplaza al mock)
│   ├── components/                 # reutilizar los existentes
│   └── mock-data.ts                # borrar o mover
├── components/layout/
│   └── staff-layout.tsx            # quitar soon: true
└── app/app.tsx                     # rutas nuevas
```

---

## Credenciales de prueba

```
Admin:   admin@dyd.com   / Admin1234
Técnico: tecnico@dyd.com / Tecnico1234
Cliente: cliente@dyd.com / Cliente1234
```

---

## Si algo falla

- Backend logs: `docker compose logs -f backend`
- Swagger: `http://localhost:3000/api/docs`
- Prisma Studio: `cd backend && npx prisma studio`
- Frontend typecheck: `npm run typecheck` (debe pasar sin errores)

---

**Listo.** Cuando arranques Fase 2, pegá este prompt y empezamos por `types/admin-dashboard.ts` + `lib/admin-api.ts` + hooks.