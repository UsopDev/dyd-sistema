#!/usr/bin/env bash
URL=http://localhost:3000
PW=$(grep '^ADMIN_PASSWORD=' .env | tail -n1 | cut -d= -f2)
ADMIN=/tmp/dyd-admin.txt
TEC=/tmp/dyd-tecnico.txt
CORREO="tecnico$RANDOM@dyd.com"
RUC="20$RANDOM$RANDOM"
JSON="Content-Type: application/json"

id_de() { sed -E 's/.*"id_(usuario|cliente)":"([^"]+)".*/\2/'; }

curl -s -o /dev/null -c $ADMIN -X POST $URL/api/auth/login -H "$JSON" \
  -d "{\"email\":\"admin@dyd.com\",\"password\":\"$PW\"}"

R=$(curl -s -b $ADMIN -X POST $URL/api/usuarios -H "$JSON" \
  -d "{\"nombres\":\"Luis\",\"apellidos\":\"Mamani\",\"email\":\"$CORREO\",\"password\":\"Tecnico2026\",\"rol\":\"TECNICO\"}")
ID_TEC=$(echo "$R" | id_de)
curl -s -o /dev/null -c $TEC -X POST $URL/api/auth/login -H "$JSON" \
  -d "{\"email\":\"$CORREO\",\"password\":\"Tecnico2026\"}"

echo "--- 1. Admin crea cliente (esperado: 201)"
R=$(curl -s -w "\n%{http_code}" -b $ADMIN -X POST $URL/api/clientes -H "$JSON" \
  -d "{\"razon_social\":\"Minera Andes $RANDOM S.A.\",\"ruc_dni\":\"$RUC\",\"contacto\":\"Rosa Quispe\",\"telefono\":\"987654321\",\"email\":\"compras@minera.com\"}")
echo "$R" | tail -n1
ID_CLI=$(echo "$R" | head -n1 | id_de)

echo "--- 2. Mismo RUC/DNI (esperado: 409)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/clientes -H "$JSON" \
  -d "{\"razon_social\":\"Otra empresa\",\"ruc_dni\":\"$RUC\"}"

echo "--- 3. Razón social vacía (esperado: 400)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/clientes -H "$JSON" \
  -d '{"razon_social":""}'

echo "--- 4. Buscar por RUC (esperado: \"total\":1)"
curl -s -b $ADMIN "$URL/api/clientes?q=$RUC" | grep -o '"total":[0-9]*'

echo "--- 5. Técnico consulta (esperado: 200) y técnico crea (esperado: 403)"
curl -s -o /dev/null -w "%{http_code}\n" -b $TEC "$URL/api/clientes?q=$RUC"
curl -s -w " -> %{http_code}\n" -b $TEC -X POST $URL/api/clientes -H "$JSON" -d '{"razon_social":"No debería"}'

echo "--- 6. Detalle con conteos (esperado: maquinas y solicitudes en 0)"
curl -s -b $ADMIN $URL/api/clientes/$ID_CLI | grep -o '"_count":{[^}]*}'

echo "--- 7. Editar teléfono (esperado: 200) y desactivar (esperado: 200)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X PATCH $URL/api/clientes/$ID_CLI -H "$JSON" -d '{"telefono":"911222333"}'
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X PATCH $URL/api/clientes/$ID_CLI -H "$JSON" -d '{"activo":false}'

echo "--- 8. activo=true no lo muestra (esperado: total 0); activo=false sí (esperado: total 1)"
curl -s -b $ADMIN "$URL/api/clientes?q=$RUC&activo=true" | grep -o '"total":[0-9]*'
curl -s -b $ADMIN "$URL/api/clientes?q=$RUC&activo=false" | grep -o '"total":[0-9]*'

echo "--- 9. Id inválido (esperado: 400), inexistente (esperado: 404), sin sesión (esperado: 401)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN $URL/api/clientes/no-es-uuid
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN $URL/api/clientes/00000000-0000-4000-8000-000000000000
curl -s -o /dev/null -w "%{http_code}\n" $URL/api/clientes

curl -s -o /dev/null -b $ADMIN -X PATCH $URL/api/usuarios/$ID_TEC -H "$JSON" -d '{"activo":false}'
