#!/usr/bin/env bash
URL=http://localhost:3000
PW=$(grep '^ADMIN_PASSWORD=' .env | tail -n1 | cut -d= -f2)
ADMIN=/tmp/dyd-admin.txt
TEC=/tmp/dyd-tecnico.txt
CORREO="tecnico$RANDOM@dyd.com"
JSON="Content-Type: application/json"
CERO="00000000-0000-4000-8000-000000000000"

idx() { sed -E "s/.*\"$1\":\"([^\"]+)\".*/\1/"; }

curl -s -o /dev/null -c $ADMIN -X POST $URL/api/auth/login -H "$JSON" \
  -d "{\"email\":\"admin@dyd.com\",\"password\":\"$PW\"}"

R=$(curl -s -b $ADMIN -X POST $URL/api/usuarios -H "$JSON" \
  -d "{\"nombres\":\"Luis\",\"apellidos\":\"Mamani\",\"email\":\"$CORREO\",\"password\":\"Tecnico2026\",\"rol\":\"TECNICO\"}")
ID_TEC=$(echo "$R" | idx id_usuario)
curl -s -o /dev/null -c $TEC -X POST $URL/api/auth/login -H "$JSON" \
  -d "{\"email\":\"$CORREO\",\"password\":\"Tecnico2026\"}"

R=$(curl -s -b $ADMIN -X POST $URL/api/clientes -H "$JSON" -d "{\"razon_social\":\"Cliente cotizaciones $RANDOM\"}")
ID_CLI=$(echo "$R" | idx id_cliente)
R=$(curl -s -b $ADMIN -X POST $URL/api/maquinas -H "$JSON" -d "{\"id_cliente\":\"$ID_CLI\",\"nombre\":\"Torno $RANDOM\"}")
ID_MAQ=$(echo "$R" | idx id_maquina)

R=$(curl -s -b $ADMIN -X POST $URL/api/materiales -H "$JSON" \
  -d "{\"nombre\":\"Electrodo $RANDOM\",\"unidad\":\"kg\",\"precio_unitario\":12.5}")
M_PRECIO=$(echo "$R" | idx id_material)
R=$(curl -s -b $ADMIN -X POST $URL/api/materiales -H "$JSON" -d "{\"nombre\":\"Sin precio $RANDOM\",\"unidad\":\"u\"}")
M_SINPRECIO=$(echo "$R" | idx id_material)
R=$(curl -s -b $ADMIN -X POST $URL/api/materiales -H "$JSON" -d "{\"nombre\":\"Descontinuado $RANDOM\",\"unidad\":\"u\",\"precio_unitario\":5}")
M_INACTIVO=$(echo "$R" | idx id_material)
curl -s -o /dev/null -b $ADMIN -X PATCH $URL/api/materiales/$M_INACTIVO -H "$JSON" -d '{"activo":false}'

nueva_solicitud() {
  curl -s -b $ADMIN -X POST $URL/api/solicitudes -H "$JSON" \
    -d "{\"id_maquina\":\"$ID_MAQ\",\"tipo_servicio\":\"CORRECTIVO\",\"descripcion\":\"$1\"}" | idx id_solicitud
}
diagnosticar() {
  curl -s -o /dev/null -b $ADMIN -X POST $URL/api/diagnosticos -H "$JSON" \
    -d "{\"id_solicitud\":\"$1\",\"estado_general\":\"REGULAR\",\"fallas_detectadas\":\"Falla de prueba\"}"
}

S1=$(nueva_solicitud "Solicitud principal de cotización"); diagnosticar $S1
S2=$(nueva_solicitud "Solicitud sin diagnóstico")
S3=$(nueva_solicitud "Solicitud para concurrencia"); diagnosticar $S3
S4=$(nueva_solicitud "Solicitud que se cancelará"); diagnosticar $S4
curl -s -o /dev/null -b $ADMIN -X POST $URL/api/solicitudes/$S4/cancelar

post_cot() { curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/cotizaciones -H "$JSON" -d "$1"; }

echo "--- 1. Cotizar S1: servicio 2 x 150 + material 3 con precio del inventario (esperado: 201, COT-, total 337.5, COTIZADA)"
R=$(curl -s -w "\n%{http_code}" -b $ADMIN -X POST $URL/api/cotizaciones -H "$JSON" \
  -d "{\"id_solicitud\":\"$S1\",\"observaciones\":\"Válida por 15 días\",\"detalles\":[{\"tipo\":\"SERVICIO\",\"descripcion\":\"Mano de obra\",\"cantidad\":2,\"precio_unitario\":150},{\"tipo\":\"MATERIAL\",\"id_material\":\"$M_PRECIO\",\"cantidad\":3}]}")
echo "$R" | tail -n1
CUERPO=$(echo "$R" | head -n1)
echo "$CUERPO" | grep -oE '"codigo":"COT-[0-9-]*"|"total":"[^"]*"'
echo -n "estado de la solicitud: "
curl -s -b $ADMIN $URL/api/solicitudes/$S1 | grep -o '"estado":"[A-Z_]*"' | head -n1
ID_COT=$(echo "$CUERPO" | idx id_cotizacion)

echo "--- 2. Segunda cotización (revisión) de S1 (esperado: 201, otro código, total 400)"
curl -s -b $ADMIN -X POST $URL/api/cotizaciones -H "$JSON" \
  -d "{\"id_solicitud\":\"$S1\",\"detalles\":[{\"tipo\":\"SERVICIO\",\"descripcion\":\"Reparación completa\",\"cantidad\":1,\"precio_unitario\":400}]}" \
  | grep -oE '"codigo":"COT-[0-9-]*"|"total":"[^"]*"'

echo "--- 3. Cotizar S2 sin diagnóstico (esperado: 409) y S4 cancelada (esperado: 409)"
post_cot "{\"id_solicitud\":\"$S2\",\"detalles\":[{\"tipo\":\"SERVICIO\",\"descripcion\":\"X\",\"cantidad\":1,\"precio_unitario\":10}]}"
post_cot "{\"id_solicitud\":\"$S4\",\"detalles\":[{\"tipo\":\"SERVICIO\",\"descripcion\":\"X\",\"cantidad\":1,\"precio_unitario\":10}]}"

echo "--- 4. Validaciones (esperado: 400 en las 9)"
post_cot "{\"id_solicitud\":\"$S1\",\"detalles\":[]}"
post_cot "{\"id_solicitud\":\"$CERO\",\"detalles\":[{\"tipo\":\"SERVICIO\",\"descripcion\":\"X\",\"cantidad\":1,\"precio_unitario\":10}]}"
post_cot "{\"id_solicitud\":\"$S1\",\"detalles\":[{\"tipo\":\"SERVICIO\",\"descripcion\":\"X\",\"cantidad\":1}]}"
post_cot "{\"id_solicitud\":\"$S1\",\"detalles\":[{\"tipo\":\"SERVICIO\",\"cantidad\":1,\"precio_unitario\":10}]}"
post_cot "{\"id_solicitud\":\"$S1\",\"detalles\":[{\"tipo\":\"SERVICIO\",\"descripcion\":\"X\",\"id_material\":\"$M_PRECIO\",\"cantidad\":1,\"precio_unitario\":10}]}"
post_cot "{\"id_solicitud\":\"$S1\",\"detalles\":[{\"tipo\":\"MATERIAL\",\"cantidad\":1,\"precio_unitario\":10}]}"
post_cot "{\"id_solicitud\":\"$S1\",\"detalles\":[{\"tipo\":\"MATERIAL\",\"id_material\":\"$CERO\",\"cantidad\":1}]}"
post_cot "{\"id_solicitud\":\"$S1\",\"detalles\":[{\"tipo\":\"MATERIAL\",\"id_material\":\"$M_INACTIVO\",\"cantidad\":1}]}"
post_cot "{\"id_solicitud\":\"$S1\",\"detalles\":[{\"tipo\":\"SERVICIO\",\"descripcion\":\"X\",\"cantidad\":0,\"precio_unitario\":10}]}"

echo "--- 5. Material sin precio en el inventario y sin precio en la línea (esperado: 400)"
post_cot "{\"id_solicitud\":\"$S1\",\"detalles\":[{\"tipo\":\"MATERIAL\",\"id_material\":\"$M_SINPRECIO\",\"cantidad\":1}]}"

echo "--- 6. Técnico: crear (esperado: 403) y listar (esperado: 403)"
curl -s -o /dev/null -w "%{http_code}\n" -b $TEC -X POST $URL/api/cotizaciones -H "$JSON" \
  -d "{\"id_solicitud\":\"$S1\",\"detalles\":[{\"tipo\":\"SERVICIO\",\"descripcion\":\"X\",\"cantidad\":1,\"precio_unitario\":10}]}"
curl -s -o /dev/null -w "%{http_code}\n" -b $TEC $URL/api/cotizaciones

echo "--- 7. Listar las de S1 (esperado: total 2) y detalle con subtotales (esperado: 300.00 y 37.50)"
curl -s -b $ADMIN "$URL/api/cotizaciones?id_solicitud=$S1" | grep -o '"total":[0-9]*'
curl -s -b $ADMIN $URL/api/cotizaciones/$ID_COT | grep -oE '"subtotal":"[^"]*"'

echo "--- 8. Concurrencia: 5 cotizaciones a la vez sobre S3 (esperado: cinco 201 y 5 códigos distintos)"
TMP=$(mktemp -d)
for i in 1 2 3 4 5; do
  curl -s -w "\n%{http_code}" -b $ADMIN -X POST $URL/api/cotizaciones -H "$JSON" \
    -d "{\"id_solicitud\":\"$S3\",\"detalles\":[{\"tipo\":\"SERVICIO\",\"descripcion\":\"Trabajo $i\",\"cantidad\":1,\"precio_unitario\":100}]}" > $TMP/$i.txt &
done
wait
for f in $TMP/*.txt; do tail -n1 "$f"; echo; done | grep -v '^$' | sort | uniq -c
cat $TMP/*.txt | grep -o '"codigo":"COT-[0-9-]*"' | sort | uniq | wc -l
rm -rf $TMP

echo "--- 9. Id inválido (esperado: 400), inexistente (esperado: 404), sin sesión (esperado: 401)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN $URL/api/cotizaciones/no-es-uuid
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN $URL/api/cotizaciones/$CERO
curl -s -o /dev/null -w "%{http_code}\n" $URL/api/cotizaciones

curl -s -o /dev/null -b $ADMIN -X PATCH $URL/api/usuarios/$ID_TEC -H "$JSON" -d '{"activo":false}'
