# Prompt Fase 2 — DYD Sistema (COMPLETADO + EXTRAS)

> **Estado**: Fase 2 completada + funcionalidades extra del PDF implementadas.

---

## Contexto actual (resumen ejecutivo)

**Stack**
- Backend: Node 22 + Express 5 + Prisma + PostgreSQL 17 + Redis, dockerizado (`docker compose up -d --build` en `backend/`). Puerto 3000.
- Frontend: React 19 + Vite 6 + TS strict + Tailwind 4 + shadcn/ui + Recharts + React Router 7 + TanStack Query v5 + axios (cookies HttpOnly). Corre en host: `cd frontend && npm run dev` → `http://localhost:5173`. Proxy Vite `/api` → `http://localhost:3000`.

**Autenticación**
- **Un solo realm: staff** (`/api/auth/*`). El cliente de la empresa **no accede al sistema**: sus datos se registran en el módulo de clientes y recibe la cotización y el informe de servicio como documentos.
- Cookies: `access_token` (15 min) + `refresh_token` (7 días). HttpOnly, `sameSite=lax`, `secure=false` en dev.
- Frontend: `StaffAuthProvider` → `GET /api/auth/me` al iniciar; interceptor axios con **single-flight refresh** → 401 refresca y reintenta.
- Guards: `RequireStaff({ roles })`, `RootRedirect`.
- Login: `/login` (admin y técnico).

**Rutas actuales**
```
/admin        → AdminDashboardPage (datos reales del backend)
/tecnico      → TechnicianDashboardPage (datos reales del backend)
```

**Usuarios demo** (creados con `npm run db:seed:docker` o `docker compose exec backend npx tsx prisma/seed.ts`)

| Rol           | Email             | Contraseña    |
| ------------- | ----------------- | ------------- |
| Administrador | `admin@dyd.com`   | `Admin1234`   |
| Técnico       | `tecnico@dyd.com` | `Tecnico1234` |

El seed también crea un cliente demo como registro de empresa cliente (sin credenciales).

---

## Qué se completó en Fase 2 (original)

✅ Dashboard admin real conectado a `/api/reportes/*` y `/api/materiales/stock-bajo`
✅ 10 CRUDs admin: solicitudes, diagnósticos, cotizaciones, órdenes, clientes, máquinas, materiales, preventivos, usuarios, reportes
✅ Dashboard técnico real conectado a `/api/mi/*`
✅ Limpieza: `mock-data.ts` eliminado, `soon: true` quitado de navegación

---

## Funcionalidades extra implementadas (según PDF)

### 1. Prioridad calculada en el servidor (CU-05, RF4)
- Nuevo módulo `backend/src/lib/prioridad.ts` con reglas de negocio:
  - Máquina propia de DYD → sube prioridad
  - Máquina `FUERA_DE_SERVICIO` → ALTA
  - Máquina `EN_MANTENIMIENTO` → sube un nivel
  - Servicio `CORRECTIVO` → sube un nivel
  - Preventivo vencido → sube un nivel
- La prioridad que envía el usuario es solo sugerencia; el servidor decide
- Endpoint `POST /api/solicitudes` y `PATCH /api/solicitudes/:id` recalculan prioridad
- Respuesta incluye `prioridad_asignada: { prioridad, motivos[] }`

### 2. Permisos alineados al PDF (Tabla 39)
| Módulo | PDF: Técnico | Implementado |
|--------|--------------|--------------|
| Solicitudes | Solo consulta | `POST /api/solicitudes` → solo ADMIN |
| Diagnóstico técnico | Registro y consulta | `POST/PATCH /api/diagnosticos` → solo TECNICO (Admin solo consulta) |
| Registros de uso | (no listado, CU-08: Admin) | `POST/PATCH/DELETE /api/uso` → solo ADMIN |
| Órdenes | Consulta y actualiza solo las suyas | Ya filtra por técnico ✅ |

### 3. Documentos imprimibles (RF7, RF12)
- Nuevo módulo `backend/src/lib/documentos.ts` (HTML autocontenido, imprimible con Ctrl+P)
- `GET /api/cotizaciones/:id/documento` → Cotización para cliente
- `GET /api/ordenes/:id/informe` → Informe de servicio (solo órdenes FINALIZADA)

### 4. Registro de horas de uso (CU-08)
- Backend: `POST/PATCH/DELETE /api/uso` (solo ADMIN)
- Frontend: Botón "Registrar uso" en modal de detalle de máquina → formulario con fecha y horas
- Al guardar, incrementa `maquina.horas_uso` y crea `registro_uso`

### 5. Panel de alertas preventivas (CU-09)
- Backend: `GET /api/preventivos/alertas` + `POST /api/alertas-correo/enviar`
- Frontend: Panel en `/admin/preventivos` muestra alertas (VENCIDO/PRÓXIMO/AL_DÍA) con badge de estado, horas de uso, próxima fecha
- Botón "Forzar envío de alertas" llama a `POST /api/alertas-correo/enviar`

---

## Endpoints nuevos agregados

| Endpoint | Método | Rol | Descripción |
|----------|--------|-----|-------------|
| `/api/solicitudes` | POST | ADMIN | Crear solicitud (recalcula prioridad) |
| `/api/solicitudes/:id` | PATCH | ADMIN | Editar solicitud (recalcula prioridad) |
| `/api/cotizaciones/:id/documento` | GET | ADMIN | HTML imprimible cotización |
| `/api/ordenes/:id/informe` | GET | ADMIN | HTML imprimible informe servicio |
| `/api/uso` | POST | ADMIN | Registrar horas de uso |
| `/api/uso/:id` | PATCH/DELETE | ADMIN | Editar/eliminar registro uso |
| `/api/preventivos/alertas` | GET | ADMIN | Listar alertas preventivas |
| `/api/alertas-correo/enviar` | POST | ADMIN | Forzar envío alertas por correo |

---

## Estado actual

**Fases 0, 1, 2 completadas** + extras del PDF implementados.

**Pendiente (Fase 3 / ajustes finales):**
- Agregar módulo **Proveedores** (está en el PDF como tabla, no implementado)
- Agregar tabla **Mantenimientos** (el PDF la lista; hoy el historial se deriva de órdenes finalizadas)
- Actualizar tabla de versiones en documentación (PDF dice PostgreSQL 18, Vite 8, Router 8, TS 7; código usa PostgreSQL 17, Vite 6, Router 7, TS 5.7)
- Pruebas caja blanca/caja negra, validación ISO 25010, despliegue preproducción

---

## Comandos de verificación

```bash
# Backend (desde backend/)
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx tsx prisma/seed.ts
curl -s http://localhost:3000/api/health

# Frontend (desde frontend/)
npm install
npm run typecheck
npm run build
npm run dev
# Abrir http://localhost:5173 → login admin → /admin con datos reales
```

---

## Archivos clave creados/modificados

**Backend:**
- `src/lib/prioridad.ts` — nuevo, reglas de prioridad
- `src/lib/documentos.ts` — nuevo, generador HTML imprimible
- `src/modules/solicitudes/solicitudes.routes.ts` — prioridad en POST/PATCH
- `src/modules/diagnosticos/diagnosticos.routes.ts` — solo TECNICO en POST
- `src/modules/uso/uso.routes.ts` — solo ADMIN en POST/PATCH/DELETE
- `src/modules/cotizaciones/cotizaciones.routes.ts` — GET /:id/documento
- `src/modules/ordenes/ordenes.routes.ts` — GET /:id/informe
- `src/modules/preventivos/preventivos.routes.ts` — ya tenía /alertas
- `prisma/schema.prisma` — quitó `password_hash` y `ClienteRefreshToken`
- `prisma/seed.ts` — cliente sin credenciales

**Frontend:**
- `src/lib/admin-api.ts` — `usoApi`, `preventivosApi.alertas/forzarEnvioAlertas`
- `src/features/admin/hooks/use-admin-queries.ts` — hooks uso, alertas
- `src/features/admin/maquinas-page.tsx` — modal "Registrar uso"
- `src/features/admin/preventivos-page.tsx` — panel alertas + forzar envío
- `src/features/auth/guards.tsx` — quitó `RequireClient`
- `src/app/app.tsx` — quitó rutas `/cliente/*`
- `src/lib/api.ts` — realm solo `staff`

---

## Notas de diseño (mantenidas)

- Tema: glassmorphism azul, Plus Jakarta Sans, `bg-white/70 backdrop-blur-xl rounded-2xl`
- Componentes: `GlassCard`, `Button`, `Input`, `Badge`, `ChartTooltip`, `ChartLegend`, `PageHeader`, `AppShell`
- Gráficos: Recharts con gradientes, dots visibles, tooltip glass, leyenda top-right
- Responsive: mobile-first, sidebar colapsable, tablas con scroll horizontal
- Estados: loading skeletons, toasts de error con `mensajeDeError`

---

**Listo para Fase 3** (pruebas, ISO 25010, preproducción) o para agregar Proveedores/Mantenimientos si se requiere.