#!/usr/bin/env bash
URL=http://localhost:3000
PW=$(grep '^ADMIN_PASSWORD=' .env | tail -n1 | cut -d= -f2)
ADMIN=/tmp/dyd-admin.txt
TEC=/tmp/dyd-tecnico.txt
CORREO="tecnico$RANDOM@dyd.com"
COD="MAQ-$RANDOM"
JSON="Content-Type: application/json"

idx() { sed -E "s/.*\"$1\":\"([^\"]+)\".*/\1/"; }

curl -s -o /dev/null -c $ADMIN -X POST $URL/api/auth/login -H "$JSON" \
  -d "{\"email\":\"admin@dyd.com\",\"password\":\"$PW\"}"

R=$(curl -s -b $ADMIN -X POST $URL/api/usuarios -H "$JSON" \
  -d "{\"nombres\":\"Luis\",\"apellidos\":\"Mamani\",\"email\":\"$CORREO\",\"password\":\"Tecnico2026\",\"rol\":\"TECNICO\"}")
ID_TEC=$(echo "$R" | idx id_usuario)
curl -s -o /dev/null -c $TEC -X POST $URL/api/auth/login -H "$JSON" \
  -d "{\"email\":\"$CORREO\",\"password\":\"Tecnico2026\"}"

R=$(curl -s -b $ADMIN -X POST $URL/api/clientes -H "$JSON" \
  -d "{\"razon_social\":\"Cliente de prueba $RANDOM\"}")
ID_CLI=$(echo "$R" | idx id_cliente)

echo "--- 1. Crear máquina de un cliente (esperado: 201)"
R=$(curl -s -w "\n%{http_code}" -b $ADMIN -X POST $URL/api/maquinas -H "$JSON" \
  -d "{\"id_cliente\":\"$ID_CLI\",\"codigo\":\"$COD\",\"nombre\":\"Torno CNC\",\"marca\":\"Haas\",\"modelo\":\"ST-20\",\"horas_uso\":120.5}")
echo "$R" | tail -n1
ID_MAQ=$(echo "$R" | head -n1 | idx id_maquina)

echo "--- 2. Mismo código (esperado: 409)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/maquinas -H "$JSON" \
  -d "{\"id_cliente\":\"$ID_CLI\",\"codigo\":\"$COD\",\"nombre\":\"Otra\"}"

echo "--- 3. Propia con cliente (esperado: 400)"
curl -s -w " -> %{http_code}\n" -b $ADMIN -X POST $URL/api/maquinas -H "$JSON" \
  -d "{\"id_cliente\":\"$ID_CLI\",\"es_propia\":true,\"nombre\":\"Soldadora\"}"

echo "--- 4. No propia y sin cliente (esperado: 400)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/maquinas -H "$JSON" \
  -d '{"nombre":"Huérfana"}'

echo "--- 5. Cliente inexistente (esperado: 400)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/maquinas -H "$JSON" \
  -d '{"id_cliente":"00000000-0000-4000-8000-000000000000","nombre":"Fantasma"}'

echo "--- 6. Máquina propia de DYD sin cliente (esperado: 201)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/maquinas -H "$JSON" \
  -d "{\"es_propia\":true,\"nombre\":\"Soldadora MIG $RANDOM\"}"

echo "--- 7. Horas negativas (esperado: 400) y estado inválido (esperado: 400)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/maquinas -H "$JSON" \
  -d "{\"id_cliente\":\"$ID_CLI\",\"nombre\":\"X\",\"horas_uso\":-5}"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X PATCH $URL/api/maquinas/$ID_MAQ -H "$JSON" \
  -d '{"estado":"ROTA"}'

echo "--- 8. Técnico consulta (esperado: 200) y técnico crea (esperado: 403)"
curl -s -o /dev/null -w "%{http_code}\n" -b $TEC "$URL/api/maquinas?q=$COD"
curl -s -w " -> %{http_code}\n" -b $TEC -X POST $URL/api/maquinas -H "$JSON" \
  -d "{\"id_cliente\":\"$ID_CLI\",\"nombre\":\"No debería\"}"

echo "--- 9. Buscar por código (esperado: total 1) y filtrar por cliente (esperado: total 1)"
curl -s -b $ADMIN "$URL/api/maquinas?q=$COD" | grep -o '"total":[0-9]*'
curl -s -b $ADMIN "$URL/api/maquinas?id_cliente=$ID_CLI" | grep -o '"total":[0-9]*'

echo "--- 10. Detalle con cliente y conteos"
curl -s -b $ADMIN $URL/api/maquinas/$ID_MAQ | grep -oE '"razon_social":"[^"]*"|"_count":\{[^}]*\}'

echo "--- 11. Cambiar estado a EN_MANTENIMIENTO (esperado: 200) y filtrarlo (esperado: total 1)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X PATCH $URL/api/maquinas/$ID_MAQ -H "$JSON" \
  -d '{"estado":"EN_MANTENIMIENTO"}'
curl -s -b $ADMIN "$URL/api/maquinas?q=$COD&estado=EN_MANTENIMIENTO" | grep -o '"total":[0-9]*'

echo "--- 12. Marcar propia sin quitar cliente (esperado: 400)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X PATCH $URL/api/maquinas/$ID_MAQ -H "$JSON" \
  -d '{"es_propia":true}'

echo "--- 13. Id inválido (esperado: 400), inexistente (esperado: 404), sin sesión (esperado: 401)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN $URL/api/maquinas/no-es-uuid
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN $URL/api/maquinas/00000000-0000-4000-8000-000000000000
curl -s -o /dev/null -w "%{http_code}\n" $URL/api/maquinas

curl -s -o /dev/null -b $ADMIN -X PATCH $URL/api/usuarios/$ID_TEC -H "$JSON" -d '{"activo":false}'
