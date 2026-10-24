#!/usr/bin/env bash
URL=http://localhost:3000
PW=$(grep '^ADMIN_PASSWORD=' .env | tail -n1 | cut -d= -f2)
ADMIN=/tmp/dyd-admin.txt
TEC=/tmp/dyd-tecnico.txt
CORREO="tecnico$RANDOM@dyd.com"
JSON="Content-Type: application/json"

id_de() { sed -E 's/.*"id_usuario":"([^"]+)".*/\1/'; }

echo "--- 1. Login del administrador (esperado: 200)"
R=$(curl -s -c $ADMIN -X POST $URL/api/auth/login -H "$JSON" \
  -d "{\"email\":\"admin@dyd.com\",\"password\":\"$PW\"}")
ID_ADMIN=$(echo "$R" | id_de)
echo "$R" | grep -o '"rol":"[A-Z]*"'

echo "--- 2. Crear técnico (esperado: 201 y rol TECNICO)"
R=$(curl -s -w "\n%{http_code}" -b $ADMIN -X POST $URL/api/usuarios -H "$JSON" \
  -d "{\"nombres\":\"Luis\",\"apellidos\":\"Mamani\",\"email\":\"$CORREO\",\"password\":\"Tecnico2026\",\"rol\":\"TECNICO\"}")
echo "$R" | tail -n1
ID_TEC=$(echo "$R" | head -n1 | id_de)

echo "--- 3. Mismo correo otra vez (esperado: 409)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/usuarios -H "$JSON" \
  -d "{\"nombres\":\"Luis\",\"apellidos\":\"Mamani\",\"email\":\"$CORREO\",\"password\":\"Tecnico2026\",\"rol\":\"TECNICO\"}"

echo "--- 4. Clave corta (esperado: 400)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/usuarios -H "$JSON" \
  -d "{\"nombres\":\"A\",\"apellidos\":\"B\",\"email\":\"x$RANDOM@dyd.com\",\"password\":\"123\",\"rol\":\"TECNICO\"}"

echo "--- 5. La lista no expone password_hash (esperado: 0)"
curl -s -b $ADMIN $URL/api/usuarios | grep -c password_hash

echo "--- 6. Login del técnico (esperado: 200) y acceso a /api/usuarios (esperado: 403)"
curl -s -o /dev/null -w "%{http_code}\n" -c $TEC -X POST $URL/api/auth/login -H "$JSON" \
  -d "{\"email\":\"$CORREO\",\"password\":\"Tecnico2026\"}"
curl -s -w " -> %{http_code}\n" -b $TEC $URL/api/usuarios

echo "--- 7. El administrador intenta desactivarse (esperado: 400)"
curl -s -w " -> %{http_code}\n" -b $ADMIN -X PATCH $URL/api/usuarios/$ID_ADMIN -H "$JSON" -d '{"activo":false}'

echo "--- 8. Desactivar al técnico (esperado: 200) y luego su login (esperado: 401)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X PATCH $URL/api/usuarios/$ID_TEC -H "$JSON" -d '{"activo":false}'
curl -s -w " -> %{http_code}\n" -X POST $URL/api/auth/login -H "$JSON" \
  -d "{\"email\":\"$CORREO\",\"password\":\"Tecnico2026\"}"

echo "--- 9. Id inválido (esperado: 400) e id inexistente (esperado: 404)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN $URL/api/usuarios/no-es-uuid
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN $URL/api/usuarios/00000000-0000-4000-8000-000000000000
