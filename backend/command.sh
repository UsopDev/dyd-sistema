#!/bin/sh

colorRojo='\033[0;31m'
colorVerde='\033[0;32m'
colorAzul='\033[0;34m'
sinColor='\033[0m'

mostrar_carga() {
  local mensaje=$1
  echo -ne "${colorAzul}| Cargando $mensaje"
  for i in {1..3}; do
    echo -ne "."
    sleep 0.5
  done
  echo -e "${sinColor}"
}

echo -e "${colorAzul}| Esperando a la base de datos..."
mostrar_carga ""
sleep 2

echo -e "${colorAzul}| Sincronizando esquema de BD (baseline)..."
mostrar_carga "baseline"
npx prisma migrate resolve --applied "20261124192957_client_add_pass" 2>/dev/null || true
npx prisma migrate deploy 2>/dev/null 1>/dev/null

if [ $? -eq 0 ]; then
  echo -e "${colorVerde} ✓ Migraciones exitosas"
else
  echo -e "${colorRojo} ✗ Migraciones fallidas"
  exit 1
fi

echo -e "${colorAzul}| Generando Prisma Client..."
mostrar_carga "Prisma Client"
npx prisma generate 2>/dev/null 1>/dev/null

if [ $? -eq 0 ]; then
  echo -e "${colorVerde} ✓ Prisma Client exitoso"
else
  echo -e "${colorRojo} ✗ Prisma Client fallido"
  exit 1
fi

echo -e "${colorAzul}| Iniciando servidor..."
mostrar_carga "servidor"
exec npm start
