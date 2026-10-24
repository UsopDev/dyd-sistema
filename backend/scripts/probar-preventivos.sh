#!/usr/bin/env bash
URL=http://localhost:3000
PW=$(grep '^ADMIN_PASSWORD=' .env | tail -n1 | cut -d= -f2)
ADMIN=/tmp/dyd-admin.txt
TA=/tmp/dyd-tecnico-a.txt
CA="tecnico$RANDOM@dyd.com"
JSON="Content-Type: application/json"
CERO="00000000-0000-4000-8000-000000000000"
HOY=$(date +%F)
MANANA=$(date -d tomorrow +%F)
HACE25=$(date -d "25 days ago" +%F)
HACE40=$(date -d "40 days ago" +%F)

idx() { sed -E "s/.*\"$1\":\"([^\"]+)\".*/\1/"; }

curl -s -o /dev/null -c $ADMIN -X POST $URL/api/auth/login -H "$JSON" \
  -d "{\"email\":\"admin@dyd.com\",\"password\":\"$PW\"}"

R=$(curl -s -b $ADMIN -X POST $URL/api/usuarios -H "$JSON" \
  -d "{\"nombres\":\"Tecnico\",\"apellidos\":\"Prueba\",\"email\":\"$CA\",\"password\":\"Tecnico2026\",\"rol\":\"TECNICO\"}")
ID_TEC=$(echo "$R" | idx id_usuario)
curl -s -o /dev/null -c $TA -X POST $URL/api/auth/login -H "$JSON" \
  -d "{\"email\":\"$CA\",\"password\":\"Tecnico2026\"}"

R=$(curl -s -b $ADMIN -X POST $URL/api/clientes -H "$JSON" -d "{\"razon_social\":\"Cliente preventivo $RANDOM\"}")
ID_CLI=$(echo "$R" | idx id_cliente)
R=$(curl -s -b $ADMIN -X POST $URL/api/maquinas -H "$JSON" \
  -d "{\"id_cliente\":\"$ID_CLI\",\"nombre\":\"Compresor $RANDOM\",\"horas_uso\":100}")
ID_MAQ=$(echo "$R" | idx id_maquina)

usar() { curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X POST $URL/api/uso -H "$JSON" \
  -d "{\"id_maquina\":\"$ID_MAQ\",\"horas\":$1}"; }
estado_prog() { curl -s -b $ADMIN $URL/api/preventivos/$1 | grep -o '"estado_mantenimiento":{[^}]*}'; }
horas_maq() { curl -s -b $ADMIN $URL/api/maquinas/$ID_MAQ | grep -o '"horas_uso":"[^"]*"'; }

echo "--- 1. Técnico registra 8 horas de uso (esperado: 201 y horas_uso 108)"
usar 8
horas_maq

echo "--- 2. Uso inválido: 0 h, 25 h, 2.55 h, fecha futura, máquina inexistente (esperado: 400 x5)"
usar 0
usar 25
usar 2.55
curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X POST $URL/api/uso -H "$JSON" \
  -d "{\"id_maquina\":\"$ID_MAQ\",\"horas\":2,\"fecha\":\"$MANANA\"}"
curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X POST $URL/api/uso -H "$JSON" \
  -d "{\"id_maquina\":\"$CERO\",\"horas\":2}"

echo "--- 3. Historial de uso (esperado: total 1); desde mañana (esperado: total 0); técnico lista (esperado: 200)"
curl -s -b $TA "$URL/api/uso?id_maquina=$ID_MAQ" | grep -o '"total":[0-9]*'
curl -s -b $TA "$URL/api/uso?id_maquina=$ID_MAQ&desde=$MANANA" | grep -o '"total":[0-9]*'
curl -s -o /dev/null -w "%{http_code}\n" -b $TA "$URL/api/uso"

echo "--- 4. Crear programaciones"
echo "por horas, cada 50 con aviso de 10 (esperado: 201, AL_DIA, horas_restantes 50):"
R=$(curl -s -w "\n%{http_code}" -b $ADMIN -X POST $URL/api/preventivos -H "$JSON" \
  -d "{\"id_maquina\":\"$ID_MAQ\",\"descripcion\":\"Cambio de aceite\",\"frecuencia_horas\":50,\"horas_aviso\":10}")
echo "$R" | tail -n1
echo "$R" | head -n1 | grep -o '"estado_mantenimiento":{[^}]*}'
PH=$(echo "$R" | head -n1 | idx id_programacion)

echo "por días, cada 30, último hace 25 días (esperado: PROXIMO, dias_restantes 5):"
R=$(curl -s -b $ADMIN -X POST $URL/api/preventivos -H "$JSON" \
  -d "{\"id_maquina\":\"$ID_MAQ\",\"descripcion\":\"Revisión de correas\",\"frecuencia_dias\":30,\"fecha_ultimo_mant\":\"$HACE25\"}")
echo "$R" | grep -o '"estado_mantenimiento":{[^}]*}'
PD1=$(echo "$R" | idx id_programacion)

echo "por días, cada 30, último hace 40 días (esperado: VENCIDO, dias_restantes -10):"
R=$(curl -s -b $ADMIN -X POST $URL/api/preventivos -H "$JSON" \
  -d "{\"id_maquina\":\"$ID_MAQ\",\"descripcion\":\"Limpieza de filtros\",\"frecuencia_dias\":30,\"fecha_ultimo_mant\":\"$HACE40\"}")
echo "$R" | grep -o '"estado_mantenimiento":{[^}]*}'
PD2=$(echo "$R" | idx id_programacion)

echo "--- 5. Programaciones inválidas: sin frecuencia, frecuencia 0, máquina inexistente, fecha futura (esperado: 400 x4)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/preventivos -H "$JSON" \
  -d "{\"id_maquina\":\"$ID_MAQ\",\"descripcion\":\"Sin frecuencia\"}"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/preventivos -H "$JSON" \
  -d "{\"id_maquina\":\"$ID_MAQ\",\"descripcion\":\"Frecuencia cero\",\"frecuencia_dias\":0}"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/preventivos -H "$JSON" \
  -d "{\"id_maquina\":\"$CERO\",\"descripcion\":\"Sin máquina\",\"frecuencia_dias\":30}"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/preventivos -H "$JSON" \
  -d "{\"id_maquina\":\"$ID_MAQ\",\"descripcion\":\"Fecha futura\",\"frecuencia_dias\":30,\"fecha_ultimo_mant\":\"$MANANA\"}"

echo "--- 6. El uso acumulado cambia el estado de la programación por horas"
echo "+24 h (esperado: AL_DIA, horas_restantes 26):"
usar 24 > /dev/null; estado_prog $PH
echo "+16 h (esperado: PROXIMO, horas_restantes 10):"
usar 16 > /dev/null; estado_prog $PH
echo "+10 h (esperado: VENCIDO, horas_restantes 0):"
usar 10 > /dev/null; estado_prog $PH

echo "--- 7. Alertas de la máquina (esperado: total 3) y vencidas (esperado: total 2)"
curl -s -b $ADMIN "$URL/api/preventivos/alertas?id_maquina=$ID_MAQ" | grep -o '"total":[0-9]*'
curl -s -b $ADMIN "$URL/api/preventivos?id_maquina=$ID_MAQ&estado=VENCIDO" | grep -o '"total":[0-9]*'

echo "--- 8. Técnico: consulta (esperado: 200), crea (esperado: 403), edita (esperado: 403)"
curl -s -o /dev/null -w "%{http_code}\n" -b $TA "$URL/api/preventivos"
curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X POST $URL/api/preventivos -H "$JSON" \
  -d "{\"id_maquina\":\"$ID_MAQ\",\"descripcion\":\"No debería\",\"frecuencia_dias\":30}"
curl -s -o /dev/null -w "%{http_code}\n" -b $TA -X PATCH $URL/api/preventivos/$PH -H "$JSON" -d '{"activo":false}'

echo "--- 9. Ciclo completo: la programación por horas vuelve a AL_DIA con 50 horas y fecha base de hoy"
S=$(curl -s -b $ADMIN -X POST $URL/api/solicitudes -H "$JSON" \
  -d "{\"id_maquina\":\"$ID_MAQ\",\"tipo_servicio\":\"PREVENTIVO\",\"descripcion\":\"Cambio de aceite programado\",\"id_programacion\":\"$PH\"}" | idx id_solicitud)
curl -s -o /dev/null -b $ADMIN -X POST $URL/api/diagnosticos -H "$JSON" \
  -d "{\"id_solicitud\":\"$S\",\"estado_general\":\"REGULAR\",\"fallas_detectadas\":\"Aceite vencido\"}"
OT=$(curl -s -b $ADMIN -X POST $URL/api/ordenes -H "$JSON" \
  -d "{\"id_solicitud\":\"$S\",\"id_tecnico\":\"$ID_TEC\"}" | idx id_orden_trabajo)
curl -s -o /dev/null -b $ADMIN -X POST $URL/api/ordenes/$OT/iniciar
curl -s -o /dev/null -w "finalizar: %{http_code}\n" -b $ADMIN -X POST $URL/api/ordenes/$OT/finalizar -H "$JSON" \
  -d '{"trabajo_realizado":"Se cambió el aceite y el filtro"}'
estado_prog $PH
echo "hoy es $HOY y la fecha base quedó:"
curl -s -b $ADMIN $URL/api/preventivos/$PH | grep -o '"fecha_ultimo_mant":"[0-9-]*'
echo "alertas de la máquina ahora (esperado: total 2)"
curl -s -b $ADMIN "$URL/api/preventivos/alertas?id_maquina=$ID_MAQ" | grep -o '"total":[0-9]*'

echo "--- 10. Cambiar la frecuencia en días de la de 25 días a 90 (esperado: 200, AL_DIA, dias_restantes 65)"
curl -s -w "\n%{http_code}\n" -b $ADMIN -X PATCH $URL/api/preventivos/$PD1 -H "$JSON" -d '{"frecuencia_dias":90}' \
  | grep -oE '"estado_mantenimiento":\{[^}]*\}|^[0-9]{3}$'

echo "--- 11. Desactivar la vencida de 40 días (esperado: 200) y alertas de la máquina (esperado: total 0)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X PATCH $URL/api/preventivos/$PD2 -H "$JSON" -d '{"activo":false}'
curl -s -b $ADMIN "$URL/api/preventivos/alertas?id_maquina=$ID_MAQ" | grep -o '"total":[0-9]*'

echo "--- 12. Quitar la única frecuencia de la programación por horas (esperado: 400)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X PATCH $URL/api/preventivos/$PH -H "$JSON" -d '{"frecuencia_horas":null}'

echo "--- 13. Id inválido (esperado: 400), inexistente (esperado: 404), sin sesión (esperado: 401)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN $URL/api/preventivos/no-es-uuid
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN $URL/api/preventivos/$CERO
curl -s -o /dev/null -w "%{http_code}\n" $URL/api/preventivos

curl -s -o /dev/null -b $ADMIN -X PATCH $URL/api/usuarios/$ID_TEC -H "$JSON" -d '{"activo":false}'
