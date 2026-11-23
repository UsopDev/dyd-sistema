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

crear_tecnico() {
  local R
  R=$(curl -s -b $ADMIN -X POST $URL/api/usuarios -H "$JSON" \
    -d "{\"nombres\":\"Tecnico\",\"apellidos\":\"Prueba\",\"email\":\"$1\",\"password\":\"Tecnico2026\",\"rol\":\"TECNICO\"}")
  curl -s -o /dev/null -c $2 -X POST $URL/api/auth/login -H "$JSON" \
    -d "{\"email\":\"$1\",\"password\":\"Tecnico2026\"}"
  echo "$R" | idx id_usuario
}
ID_TA=$(crear_tecnico "$CA" $TA)
ID_TB=$(crear_tecnico "$CB" $TB)

R=$(curl -s -b $ADMIN -X POST $URL/api/clientes -H "$JSON" -d "{\"razon_social\":\"Cliente órdenes $RANDOM\"}")
ID_CLI=$(echo "$R" | idx id_cliente)
R=$(curl -s -b $ADMIN -X POST $URL/api/maquinas -H "$JSON" -d "{\"id_cliente\":\"$ID_CLI\",\"nombre\":\"Rectificadora $RANDOM\"}")
ID_MAQ=$(echo "$R" | idx id_maquina)

R=$(curl -s -b $ADMIN -X POST $URL/api/materiales -H "$JSON" \
  -d "{\"nombre\":\"Rodamiento $RANDOM\",\"unidad\":\"u\",\"precio_unitario\":10}")
ID_MAT=$(echo "$R" | idx id_material)
curl -s -o /dev/null -b $ADMIN -X POST $URL/api/materiales/$ID_MAT/movimientos -H "$JSON" \
  -d '{"tipo":"ENTRADA","cantidad":10,"motivo":"Stock inicial de prueba"}'

nueva_solicitud() {
  curl -s -b $ADMIN -X POST $URL/api/solicitudes -H "$JSON" \
    -d "{\"id_maquina\":\"$ID_MAQ\",\"tipo_servicio\":\"CORRECTIVO\",\"descripcion\":\"$1\"}" | idx id_solicitud
}
diagnosticar() {
  curl -s -o /dev/null -b $ADMIN -X POST $URL/api/diagnosticos -H "$JSON" \
    -d "{\"id_solicitud\":\"$1\",\"estado_general\":\"REGULAR\",\"fallas_detectadas\":\"Falla de prueba\"}"
}

S1=$(nueva_solicitud "Solicitud principal de la orden"); diagnosticar $S1
curl -s -o /dev/null -b $ADMIN -X POST $URL/api/cotizaciones -H "$JSON" \
  -d "{\"id_solicitud\":\"$S1\",\"detalles\":[{\"tipo\":\"SERVICIO\",\"descripcion\":\"Reparación\",\"cantidad\":1,\"precio_unitario\":200}]}"
S2=$(nueva_solicitud "Solicitud cotizada para orden"); diagnosticar $S2
curl -s -o /dev/null -b $ADMIN -X POST $URL/api/cotizaciones -H "$JSON" \
  -d "{\"id_solicitud\":\"$S2\",\"detalles\":[{\"tipo\":\"SERVICIO\",\"descripcion\":\"Reparación\",\"cantidad\":1,\"precio_unitario\":100}]}"
S3=$(nueva_solicitud "Solicitud sin diagnóstico")

echo "--- 1. Admin crea orden de S1 para el técnico A (esperado: 201, OT-, PENDIENTE, monto 200, solicitud ASIGNADA)"
R=$(curl -s -w "\n%{http_code}" -b $ADMIN -X POST $URL/api/ordenes -H "$JSON" \
  -d "{\"id_solicitud\":\"$S1\",\"id_tecnico\":\"$ID_TA\"}")
echo "$R" | tail -n1
CUERPO=$(echo "$R" | head -n1)
echo "$CUERPO" | grep -oE '"codigo":"OT-[0-9-]*"|"estado":"[A-Z_]*"|"monto":"[^"]*"'
ID_OT1=$(echo "$CUERPO" | idx id_orden_trabajo)

echo "--- 2. Segunda orden para la misma solicitud (esperado: 409) y solicitud sin diagnóstico (esperado: 409)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/ordenes -H "$JSON" \
  -d "{\"id_solicitud\":\"$S1\",\"id_tecnico\":\"$ID_TA\"}"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/ordenes -H "$JSON" \
  -d "{\"id_solicitud\":\"$S3\",\"id_tecnico\":\"$ID_TA\"}"

echo "--- 3. Técnico inexistente, solicitud inexistente, monto negativo (esperado: 400 x3)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/ordenes -H "$JSON" \
  -d "{\"id_solicitud\":\"$S2\",\"id_tecnico\":\"$CERO\"}"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/ordenes -H "$JSON" \
  -d "{\"id_solicitud\":\"$CERO\",\"id_tecnico\":\"$ID_TA\"}"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/ordenes -H "$JSON" \
  -d "{\"id_solicitud\":\"$S2\",\"id_tecnico\":\"$ID_TA\",\"monto\":-5}"

echo "--- 4. Un técnico intenta crear una orden (esperado: 403)"
curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X POST $URL/api/ordenes -H "$JSON" \
  -d "{\"id_solicitud\":\"$S2\",\"id_tecnico\":\"$ID_TA\"}"

echo "--- 5. Orden de S2 (cotizada) para el técnico B con monto manual 500 (esperado: 201 y monto 500)"
R=$(curl -s -b $ADMIN -X POST $URL/api/ordenes -H "$JSON" \
  -d "{\"id_solicitud\":\"$S2\",\"id_tecnico\":\"$ID_TB\",\"monto\":500}")
echo "$R" | grep -oE '"monto":"[^"]*"'
ID_OT2=$(echo "$R" | idx id_orden_trabajo)

echo "--- 6. Visibilidad: B ve solo la suya (esperado: total 1), A solo la suya (total 1), B abre la de A (esperado: 404)"
curl -s -b $TB "$URL/api/ordenes" | grep -o '"total":[0-9]*'
curl -s -b $TA "$URL/api/ordenes" | grep -o '"total":[0-9]*'
curl -s -o /dev/null -w "%{http_code}\n" -b $TB $URL/api/ordenes/$ID_OT1

echo "--- 7. Material antes de iniciar (esperado: 409) y B intenta iniciar la orden de A (esperado: 404)"
curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X POST $URL/api/ordenes/$ID_OT1/materiales -H "$JSON" \
  -d "{\"id_material\":\"$ID_MAT\",\"cantidad\":1}"
curl -s -o /dev/null -w "%{http_code}\n" -b $TB -X POST $URL/api/ordenes/$ID_OT1/iniciar

echo "--- 8. A inicia su orden (esperado: 200, EN_PROCESO) y otra vez (esperado: 409); la solicitud queda EN_PROCESO"
curl -s -b $TA -X POST $URL/api/ordenes/$ID_OT1/iniciar | grep -oE '"estado":"[A-Z_]*"' | tail -n1
curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X POST $URL/api/ordenes/$ID_OT1/iniciar
curl -s -b $ADMIN $URL/api/solicitudes/$S1 | grep -o '"estado":"[A-Z_]*"'

echo "--- 9. Registrar 4 rodamientos (esperado: 201 y stock 6), otros 4 (esperado: 201 y stock 2)"
curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X POST $URL/api/ordenes/$ID_OT1/materiales -H "$JSON" \
  -d "{\"id_material\":\"$ID_MAT\",\"cantidad\":4}"
curl -s -b $ADMIN $URL/api/materiales/$ID_MAT | grep -o '"stock_actual":"[^"]*"'
curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X POST $URL/api/ordenes/$ID_OT1/materiales -H "$JSON" \
  -d "{\"id_material\":\"$ID_MAT\",\"cantidad\":4}"
curl -s -b $ADMIN $URL/api/materiales/$ID_MAT | grep -o '"stock_actual":"[^"]*"'

echo "--- 10. Pedir 5 con stock 2 (esperado: 409 y el stock no cambia: 2)"
curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X POST $URL/api/ordenes/$ID_OT1/materiales -H "$JSON" \
  -d "{\"id_material\":\"$ID_MAT\",\"cantidad\":5}"
curl -s -b $ADMIN $URL/api/materiales/$ID_MAT | grep -o '"stock_actual":"[^"]*"'

echo "--- 11. Concurrencia: 5 registros de 1 unidad a la vez con stock 2 (esperado: 2 veces 201 y 3 veces 409; stock final 0)"
TMP=$(mktemp -d)
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X POST $URL/api/ordenes/$ID_OT1/materiales -H "$JSON" \
    -d "{\"id_material\":\"$ID_MAT\",\"cantidad\":1}" > $TMP/$i.txt &
done
wait
cat $TMP/*.txt | sort | uniq -c
rm -rf $TMP
curl -s -b $ADMIN $URL/api/materiales/$ID_MAT | grep -o '"stock_actual":"[^"]*"'

echo "--- 12. Detalle: una sola línea acumulada de 10 unidades y movimientos del material (esperado: cantidad 10; total 5 movimientos: 1 entrada + 4 salidas)"
curl -s -b $TA $URL/api/ordenes/$ID_OT1 | grep -oE '"cantidad":"[^"]*"|"subtotal":"[^"]*"'
curl -s -b $ADMIN $URL/api/materiales/$ID_MAT/movimientos | grep -o '"total":[0-9]*'

echo "--- 13. Finalizar sin trabajo realizado (esperado: 400); B intenta (esperado: 404); A finaliza (esperado: 200, FINALIZADA)"
curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X POST $URL/api/ordenes/$ID_OT1/finalizar -H "$JSON" -d '{}'
curl -s -o /dev/null -w "%{http_code}\n" -b $TB -X POST $URL/api/ordenes/$ID_OT1/finalizar -H "$JSON" \
  -d '{"trabajo_realizado":"Intento ajeno"}'
curl -s -b $TA -X POST $URL/api/ordenes/$ID_OT1/finalizar -H "$JSON" \
  -d '{"trabajo_realizado":"Se cambiaron los rodamientos y se alineó el eje"}' | grep -oE '"estado":"[A-Z_]*"' | tail -n1
curl -s -b $ADMIN $URL/api/solicitudes/$S1 | grep -o '"estado":"[A-Z_]*"'

echo "--- 14. Después de finalizar: registrar material (esperado: 409) y finalizar otra vez (esperado: 409)"
curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X POST $URL/api/ordenes/$ID_OT1/materiales -H "$JSON" \
  -d "{\"id_material\":\"$ID_MAT\",\"cantidad\":1}"
curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X POST $URL/api/ordenes/$ID_OT1/finalizar -H "$JSON" \
  -d '{"trabajo_realizado":"Segunda vez"}'

echo "--- 15. Cancelar: técnico (esperado: 403), admin la PENDIENTE de B (esperado: 200, CANCELADA), la finalizada (esperado: 409)"
curl -s -o /dev/null -w "%{http_code}\n" -b $TB -X POST $URL/api/ordenes/$ID_OT2/cancelar
curl -s -b $ADMIN -X POST $URL/api/ordenes/$ID_OT2/cancelar | grep -oE '"estado":"[A-Z_]*"' | tail -n1
curl -s -b $ADMIN $URL/api/solicitudes/$S2 | grep -o '"estado":"[A-Z_]*"'
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/ordenes/$ID_OT1/cancelar

echo "--- 16. Id inválido (esperado: 400), inexistente (esperado: 404), sin sesión (esperado: 401)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN $URL/api/ordenes/no-es-uuid
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN $URL/api/ordenes/$CERO
curl -s -o /dev/null -w "%{http_code}\n" $URL/api/ordenes

curl -s -o /dev/null -b $ADMIN -X PATCH $URL/api/usuarios/$ID_TA -H "$JSON" -d '{"activo":false}'
curl -s -o /dev/null -b $ADMIN -X PATCH $URL/api/usuarios/$ID_TB -H "$JSON" -d '{"activo":false}'
