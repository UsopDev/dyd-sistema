#!/usr/bin/env bash
URL=http://localhost:3000
PW=$(grep '^ADMIN_PASSWORD=' .env | tail -n1 | cut -d= -f2)
ADMIN=/tmp/dyd-admin.txt
TA=/tmp/dyd-tecnico-a.txt
TB=/tmp/dyd-tecnico-b.txt
CA="tecnico$RANDOM@dyd.com"
CB="tecnico$RANDOM@dyd.com"
JSON="Content-Type: application/json"
CERO="00000000-0000-4000-8000-000000000000"

idx() { sed -E "s/.*\"$1\":\"([^\"]+)\".*/\1/"; }

curl -s -o /dev/null -c $ADMIN -X POST $URL/api/auth/login -H "$JSON" \
  -d "{\"email\":\"admin@dyd.com\",\"password\":\"$PW\"}"

crear_tecnico() {  # correo, archivo de cookies -> imprime el id
  local R
  R=$(curl -s -b $ADMIN -X POST $URL/api/usuarios -H "$JSON" \
    -d "{\"nombres\":\"Tecnico\",\"apellidos\":\"Prueba\",\"email\":\"$1\",\"password\":\"Tecnico2026\",\"rol\":\"TECNICO\"}")
  curl -s -o /dev/null -c $2 -X POST $URL/api/auth/login -H "$JSON" \
    -d "{\"email\":\"$1\",\"password\":\"Tecnico2026\"}"
  echo "$R" | idx id_usuario
}
ID_TA=$(crear_tecnico "$CA" $TA)
ID_TB=$(crear_tecnico "$CB" $TB)

R=$(curl -s -b $ADMIN -X POST $URL/api/clientes -H "$JSON" -d "{\"razon_social\":\"Cliente diagnósticos $RANDOM\"}")
ID_CLI=$(echo "$R" | idx id_cliente)
R=$(curl -s -b $ADMIN -X POST $URL/api/maquinas -H "$JSON" -d "{\"id_cliente\":\"$ID_CLI\",\"nombre\":\"Prensa $RANDOM\"}")
ID_MAQ=$(echo "$R" | idx id_maquina)

nueva_solicitud() {
  curl -s -b $ADMIN -X POST $URL/api/solicitudes -H "$JSON" \
    -d "{\"id_maquina\":\"$ID_MAQ\",\"tipo_servicio\":\"CORRECTIVO\",\"descripcion\":\"$1\"}" | idx id_solicitud
}
S1=$(nueva_solicitud "Pérdida de presión hidráulica")
S2=$(nueva_solicitud "Ruido anormal en el motor")
S3=$(nueva_solicitud "Solicitud que se cancelará")
curl -s -o /dev/null -b $ADMIN -X POST $URL/api/solicitudes/$S3/cancelar

CUERPO1="{\"id_solicitud\":\"$S1\",\"estado_general\":\"REGULAR\",\"fallas_detectadas\":\"Sello del cilindro desgastado\",\"recomendaciones\":\"Cambiar sellos y revisar aceite\"}"

echo "--- 1. Técnico A diagnostica S1 (esperado: 201, solicitud EN_DIAGNOSTICO, REGULAR)"
R=$(curl -s -w "\n%{http_code}" -b $TA -X POST $URL/api/diagnosticos -H "$JSON" -d "$CUERPO1")
echo "$R" | tail -n1
echo "$R" | head -n1 | grep -oE '"estado":"[A-Z_]*"|"estado_general":"[A-Z]*"'
ID_DIAG=$(echo "$R" | head -n1 | idx id_diagnostico)

echo "--- 2. Segundo diagnóstico de la misma solicitud (esperado: 409)"
curl -s -o /dev/null -w "%{http_code}\n" -b $TB -X POST $URL/api/diagnosticos -H "$JSON" -d "$CUERPO1"

echo "--- 3. Solicitud inexistente, id inválido, estado inválido, fallas vacías (esperado: 400 x4)"
curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X POST $URL/api/diagnosticos -H "$JSON" \
  -d "{\"id_solicitud\":\"$CERO\",\"estado_general\":\"BUENO\",\"fallas_detectadas\":\"Ninguna\"}"
curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X POST $URL/api/diagnosticos -H "$JSON" \
  -d '{"id_solicitud":"no-es-uuid","estado_general":"BUENO","fallas_detectadas":"Ninguna"}'
curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X POST $URL/api/diagnosticos -H "$JSON" \
  -d "{\"id_solicitud\":\"$S2\",\"estado_general\":\"EXCELENTE\",\"fallas_detectadas\":\"Ninguna\"}"
curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X POST $URL/api/diagnosticos -H "$JSON" \
  -d "{\"id_solicitud\":\"$S2\",\"estado_general\":\"BUENO\",\"fallas_detectadas\":\"\"}"

echo "--- 4. Diagnosticar una solicitud cancelada (esperado: 409)"
curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X POST $URL/api/diagnosticos -H "$JSON" \
  -d "{\"id_solicitud\":\"$S3\",\"estado_general\":\"BUENO\",\"fallas_detectadas\":\"Ninguna\"}"

echo "--- 5. Detalle (esperado: código SOL, técnico, orden null y adjuntos vacío)"
curl -s -b $TA $URL/api/diagnosticos/$ID_DIAG | grep -oE '"codigo":"SOL-[0-9-]*"|"orden_trabajo":null|"adjuntos":\[\]'

echo "--- 6. La solicitud quedó EN_DIAGNOSTICO (esperado)"
curl -s -b $ADMIN $URL/api/solicitudes/$S1 | grep -o '"estado":"[A-Z_]*"'

echo "--- 7. Listar por solicitud (esperado: total 1); técnico B también lista (esperado: 200)"
curl -s -b $ADMIN "$URL/api/diagnosticos?id_solicitud=$S1" | grep -o '"total":[0-9]*'
curl -s -o /dev/null -w "%{http_code}\n" -b $TB "$URL/api/diagnosticos"

echo "--- 8. Técnico B edita el de A (esperado: 403); A edita el suyo (esperado: 200); admin edita (esperado: 200)"
curl -s -w " -> %{http_code}\n" -b $TB -X PATCH $URL/api/diagnosticos/$ID_DIAG -H "$JSON" -d '{"estado_general":"MALO"}'
curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X PATCH $URL/api/diagnosticos/$ID_DIAG -H "$JSON" -d '{"estado_general":"CRITICO"}'
curl -s -b $ADMIN -X PATCH $URL/api/diagnosticos/$ID_DIAG -H "$JSON" -d '{"observaciones":"Revisado por el administrador"}' \
  | grep -oE '"estado_general":"[A-Z]*"|"observaciones":"[^"]*"'

echo "--- 9. Concurrencia: 5 técnicos diagnostican S2 a la vez (esperado: 1 vez 201 y 4 veces 409)"
TMP=$(mktemp -d)
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X POST $URL/api/diagnosticos -H "$JSON" \
    -d "{\"id_solicitud\":\"$S2\",\"estado_general\":\"MALO\",\"fallas_detectadas\":\"Intento $i\"}" > $TMP/$i.txt &
done
wait
cat $TMP/*.txt | sort | uniq -c
rm -rf $TMP

echo "--- 10. Cancelar S1 y luego editar su diagnóstico (esperado: 200 y luego 409, ya no es editable)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/solicitudes/$S1/cancelar
curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X PATCH $URL/api/diagnosticos/$ID_DIAG -H "$JSON" -d '{"estado_general":"BUENO"}'

echo "--- 11. Id inválido (esperado: 400), inexistente (esperado: 404), sin sesión (esperado: 401)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN $URL/api/diagnosticos/no-es-uuid
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN $URL/api/diagnosticos/$CERO
curl -s -o /dev/null -w "%{http_code}\n" $URL/api/diagnosticos

curl -s -o /dev/null -b $ADMIN -X PATCH $URL/api/usuarios/$ID_TA -H "$JSON" -d '{"activo":false}'
curl -s -o /dev/null -b $ADMIN -X PATCH $URL/api/usuarios/$ID_TB -H "$JSON" -d '{"activo":false}'
