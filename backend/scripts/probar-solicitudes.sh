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

R=$(curl -s -b $ADMIN -X POST $URL/api/clientes -H "$JSON" -d "{\"razon_social\":\"Cliente solicitudes $RANDOM\"}")
ID_CLI=$(echo "$R" | idx id_cliente)
R=$(curl -s -b $ADMIN -X POST $URL/api/maquinas -H "$JSON" \
  -d "{\"id_cliente\":\"$ID_CLI\",\"nombre\":\"Fresadora $RANDOM\"}")
ID_MAQ=$(echo "$R" | idx id_maquina)
R=$(curl -s -b $ADMIN -X POST $URL/api/maquinas -H "$JSON" \
  -d "{\"es_propia\":true,\"nombre\":\"Compresor propio $RANDOM\"}")
ID_PROPIA=$(echo "$R" | idx id_maquina)

echo "--- 1. Técnico registra solicitud correctiva (esperado: 201, código SOL-, estado RECIBIDA, cliente de la máquina)"
R=$(curl -s -w "\n%{http_code}" -b $TEC -X POST $URL/api/solicitudes -H "$JSON" \
  -d "{\"id_maquina\":\"$ID_MAQ\",\"tipo_servicio\":\"CORRECTIVO\",\"descripcion\":\"Vibración fuerte en el husillo\"}")
echo "$R" | tail -n1
CUERPO=$(echo "$R" | head -n1)
echo "$CUERPO" | grep -o '"codigo":"SOL-[0-9-]*"'
echo "$CUERPO" | grep -o '"estado":"[A-Z_]*"'
echo "$CUERPO" | grep -o "\"id_cliente\":\"$ID_CLI\"" | head -n1
ID_SOL=$(echo "$CUERPO" | idx id_solicitud)
COD_SOL=$(echo "$CUERPO" | idx codigo)

echo "--- 2. Admin registra preventiva ALTA sobre máquina propia (esperado: 201, id_cliente null)"
curl -s -w "\n%{http_code}\n" -b $ADMIN -X POST $URL/api/solicitudes -H "$JSON" \
  -d "{\"id_maquina\":\"$ID_PROPIA\",\"tipo_servicio\":\"PREVENTIVO\",\"descripcion\":\"Cambio de aceite y filtros\",\"prioridad\":\"ALTA\"}" \
  | grep -oE '"id_cliente":null|^[0-9]{3}$|"prioridad":"[A-Z]*"'

echo "--- 3. Máquina inexistente (esperado: 400)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/solicitudes -H "$JSON" \
  -d "{\"id_maquina\":\"$CERO\",\"tipo_servicio\":\"CORRECTIVO\",\"descripcion\":\"Algo\"}"

echo "--- 4. Descripción corta y tipo inválido (esperado: 400, 400)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/solicitudes -H "$JSON" \
  -d "{\"id_maquina\":\"$ID_MAQ\",\"tipo_servicio\":\"CORRECTIVO\",\"descripcion\":\"no\"}"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/solicitudes -H "$JSON" \
  -d "{\"id_maquina\":\"$ID_MAQ\",\"tipo_servicio\":\"URGENTE\",\"descripcion\":\"Descripción válida\"}"

echo "--- 5. Programación en una solicitud correctiva (esperado: 400) y programación inexistente (esperado: 400)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/solicitudes -H "$JSON" \
  -d "{\"id_maquina\":\"$ID_MAQ\",\"tipo_servicio\":\"CORRECTIVO\",\"descripcion\":\"Descripción válida\",\"id_programacion\":\"$CERO\"}"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/solicitudes -H "$JSON" \
  -d "{\"id_maquina\":\"$ID_MAQ\",\"tipo_servicio\":\"PREVENTIVO\",\"descripcion\":\"Descripción válida\",\"id_programacion\":\"$CERO\"}"

echo "--- 6. Buscar por código (esperado: total 1) y filtrar por máquina y estado (esperado: total 1)"
curl -s -b $ADMIN "$URL/api/solicitudes?q=$COD_SOL" | grep -o '"total":[0-9]*'
curl -s -b $ADMIN "$URL/api/solicitudes?id_maquina=$ID_MAQ&estado=RECIBIDA" | grep -o '"total":[0-9]*'
echo "técnico lista (esperado: 200)"
curl -s -o /dev/null -w "%{http_code}\n" -b $TEC "$URL/api/solicitudes"

echo "--- 7. Detalle (esperado: quién la registró, la máquina, y conteo de cotizaciones)"
curl -s -b $ADMIN $URL/api/solicitudes/$ID_SOL | grep -oE '"nombres":"[^"]*"|"nombre":"Fresadora[^"]*"|"_count":\{[^}]*\}'

echo "--- 8. Admin edita prioridad (esperado: 200); técnico intenta editar (esperado: 403)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X PATCH $URL/api/solicitudes/$ID_SOL -H "$JSON" -d '{"prioridad":"ALTA"}'
curl -s -w " -> %{http_code}\n" -b $TEC -X PATCH $URL/api/solicitudes/$ID_SOL -H "$JSON" -d '{"prioridad":"BAJA"}'

echo "--- 9. Técnico intenta cancelar (esperado: 403); admin cancela (esperado: 200 y CANCELADA); cancelar otra vez (esperado: 409)"
curl -s -o /dev/null -w "%{http_code}\n" -b $TEC -X POST $URL/api/solicitudes/$ID_SOL/cancelar
curl -s -w "\n%{http_code}\n" -b $ADMIN -X POST $URL/api/solicitudes/$ID_SOL/cancelar | grep -oE '"estado":"[A-Z_]*"|^[0-9]{3}$'
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/solicitudes/$ID_SOL/cancelar

echo "--- 10. Editar una solicitud ya cancelada (esperado: 409)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X PATCH $URL/api/solicitudes/$ID_SOL -H "$JSON" -d '{"prioridad":"MEDIA"}'

echo "--- 11. Concurrencia: 5 solicitudes a la vez (esperado: 5 códigos distintos)"
TMP=$(mktemp -d)
for i in 1 2 3 4 5; do
  curl -s -b $ADMIN -X POST $URL/api/solicitudes -H "$JSON" \
    -d "{\"id_maquina\":\"$ID_MAQ\",\"tipo_servicio\":\"CORRECTIVO\",\"descripcion\":\"Solicitud simultánea $i\"}" > $TMP/$i.txt &
done
wait
cat $TMP/*.txt | grep -o '"codigo":"SOL-[0-9-]*"' | sort | uniq | wc -l
rm -rf $TMP

echo "--- 12. Id inválido (esperado: 400), inexistente (esperado: 404), sin sesión (esperado: 401)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN $URL/api/solicitudes/no-es-uuid
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN $URL/api/solicitudes/$CERO
curl -s -o /dev/null -w "%{http_code}\n" $URL/api/solicitudes

curl -s -o /dev/null -b $ADMIN -X PATCH $URL/api/usuarios/$ID_TEC -H "$JSON" -d '{"activo":false}'
