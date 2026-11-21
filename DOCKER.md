# Docker: Postgres, Redis y backend

Todo el stack vive en `backend/`. No hay `docker-compose.yml` en la raíz del proyecto.

## Archivos

- `backend/docker-compose.yml`: servicios `postgres`, `redis`, `migrate`, `backend` y `seed` opcional.
- `backend/Dockerfile`: build multi-stage (dependencias, compilación, migraciones y runtime).
- `backend/.dockerignore`: deja fuera `.env`, `node_modules`, `dist`, uploads y archivos locales.
- `backend/.env`: credenciales de Postgres y variables de la API. No se versiona.
- `backend/.env.example`: plantilla para crear el `.env`.

## Preparar el `.env`

```bash
cd backend
cp .env.example .env
```

Completar `POSTGRES_PASSWORD`, `JWT_ACCESS_SECRET` (mínimo 32 caracteres) y `ADMIN_PASSWORD`.

La contraseña de Postgres debe ser URL-safe (sin `@`, `:` ni `/`), porque se usa dentro de `DATABASE_URL`.

## Levantar

```bash
cd backend
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

- Postgres y Redis sólo se publican en loopback. Si necesitás acceso desde la LAN, cambiá el mapeo en `backend/docker-compose.yml`.
- Los datos viven en los volúmenes `postgres_data`, `redis_data` y `backend_uploads`. `docker compose down` los conserva; `down -v` los elimina.
- Los adjuntos se guardan en `/app/uploads`, montado sobre el volumen `backend_uploads`.

## Notas

- El frontend puede seguir corriendo en el host con Vite (`localhost:5173`); el backend ya permite ese origen por CORS.
- Con `NODE_ENV=development` las cookies no llevan `Secure`, ideal para probar por HTTP local. Para producción con HTTPS usar `NODE_ENV=production`.
- Después de cambiar código o dependencias: `docker compose up -d --build`.
- Si el puerto 3000 ya está ocupado por un backend local, detenelo antes de levantar el contenedor.
- El comando `seed` no actualiza la contraseña de un administrador que ya existe. Si la contraseña del `.env` no coincide con la de la base, hay que resetearla aparte.
- El proyecto de Compose se llama `dyd-sistema`, así que los volúmenes conservan ese prefijo aunque el comando se ejecute desde `backend/`.
