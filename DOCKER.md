# Docker: Postgres, Redis y backend

El compose levanta la base de datos, Redis, aplica migraciones y arranca la API.

## Archivos

- `docker-compose.yml`: servicios `postgres`, `redis`, `migrate` y `backend` (más `seed` opcional).
- `backend/Dockerfile`: build multi-stage (dependencias, compilación, migraciones y runtime).
- `backend/.dockerignore`: deja fuera `.env`, `node_modules`, `dist`, uploads y archivos locales.
- `.env` (raíz): credenciales de Postgres usadas por Compose.
- `backend/.env`: variables de la API. En Docker, Compose reemplaza `DATABASE_URL` y `REDIS_URL` para que apunten a los servicios.

Para crear los `.env` desde cero:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Completar `POSTGRES_PASSWORD`, `JWT_ACCESS_SECRET` (mínimo 32 caracteres) y `ADMIN_PASSWORD`.

Si cambiás el usuario o la contraseña de Postgres, actualizá también `DATABASE_URL` en `backend/.env` para cuando corras la API en el host (`npm run dev`). Dentro de Docker, Compose la reemplaza sola. Conviene que la contraseña sea URL-safe (sin `@`, `:` ni `/`); si no, hay que URL-encodearla.

## Levantar

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

Verificar:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health/db
```

El servicio `migrate` corre `prisma migrate deploy` una vez y termina. El backend espera a que Postgres y Redis estén sanos y a que `migrate` termine bien.

## Comandos útiles

```bash
# Aplicar migraciones manualmente (si hiciera falta)
docker compose run --rm migrate

# Crear el administrador inicial (idempotente: si ya existe, no cambia la contraseña)
docker compose --profile tools run --rm seed

# Cargar datos de demostración
docker compose --profile tools run --rm seed \
  sh -c './node_modules/.bin/tsx prisma/demo.ts'

# Detener sin borrar datos
docker compose down

# Borrar contenedores, base, Redis y uploads
docker compose down -v
```

## Puertos y datos

| Servicio | Desde el host | Dentro de Docker |
| --- | --- | --- |
| Backend | `localhost:3000` | `backend:3000` |
| Postgres | `127.0.0.1:5433` | `postgres:5432` |
| Redis | `127.0.0.1:6379` | `redis:6379` |

- Postgres y Redis sólo se publican en loopback. Si necesitás acceso desde la LAN, cambiá el mapeo en `docker-compose.yml`.
- Los datos viven en los volúmenes `postgres_data`, `redis_data` y `backend_uploads`. `docker compose down` los conserva; `down -v` los elimina.
- Los adjuntos se guardan en `/app/uploads`, montado sobre el volumen `backend_uploads`.

## Notas

- El frontend puede seguir corriendo en el host con Vite (`localhost:5173`); el backend ya permite ese origen por CORS.
- Con `NODE_ENV=development` las cookies no llevan `Secure`, ideal para probar por HTTP local. Para producción con HTTPS usar `NODE_ENV=production`.
- Después de cambiar código o dependencias: `docker compose up -d --build`.
- Si el puerto 3000 ya está ocupado por un backend local, detenelo antes de levantar el contenedor.
- El comando `seed` no actualiza la contraseña de un administrador que ya existe. Si la contraseña del `.env` no coincide con la de la base, hay que resetearla aparte.
