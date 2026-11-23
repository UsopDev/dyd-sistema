#!/usr/bin/env bash
URL=http://localhost:3000
PW=$(grep '^ADMIN_PASSWORD=' .env | tail -n1 | cut -d= -f2)
ADMIN=/tmp/dyd-admin.txt
TEC=/tmp/dyd-tecnico.txt
CORREO="tecnico$RANDOM@dyd.com"
COD="MAT-$RANDOM"
JSON="Content-Type: application/json"

idx() { sed -E "s/.*\"$1\":\"([^\"]+)\".*/\1/"; }
stock() { grep -o '"stock_actual":"[^"]*"'; }

curl -s -o /dev/null -c $ADMIN -X POST $URL/api/auth/login -H "$JSON" \
  -d "{\"email\":\"admin@dyd.com\",\"password\":\"$PW\"}"

R=$(curl -s -b $ADMIN -X POST $URL/api/usuarios -H "$JSON" \
  -d "{\"nombres\":\"Luis\",\"apellidos\":\"Mamani\",\"email\":\"$CORREO\",\"password\":\"Tecnico2026\",\"rol\":\"TECNICO\"}")
ID_TEC=$(echo "$R" | idx id_usuario)
curl -s -o /dev/null -c $TEC -X POST $URL/api/auth/login -H "$JSON" \
  -d "{\"email\":\"$CORREO\",\"password\":\"Tecnico2026\"}"

echo "--- 1. Crear material (esperado: 201)"
R=$(curl -s -w "\n%{http_code}" -b $ADMIN -X POST $URL/api/materiales -H "$JSON" \
  -d "{\"codigo\":\"$COD\",\"nombre\":\"Electrodo 6011\",\"unidad\":\"kg\",\"stock_minimo\":5,\"precio_unitario\":12.5}")
echo "$R" | tail -n1
ID_MAT=$(echo "$R" | head -n1 | idx id_material)

echo "--- 2. Mismo código (esperado: 409)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/materiales -H "$JSON" \
  -d "{\"codigo\":\"$COD\",\"nombre\":\"Otro\",\"unidad\":\"kg\"}"

echo "--- 3. Entrada de 20 (esperado: stock 20)"
curl -s -b $ADMIN -X POST $URL/api/materiales/$ID_MAT/movimientos -H "$JSON" \
  -d '{"tipo":"ENTRADA","cantidad":20,"motivo":"Compra inicial"}' | stock
echo "--- 4. Salida de 8 (esperado: stock 12)"
curl -s -b $ADMIN -X POST $URL/api/materiales/$ID_MAT/movimientos -H "$JSON" \
  -d '{"tipo":"SALIDA","cantidad":8,"motivo":"Trabajo"}' | stock

echo "--- 5. Salida de 50, más de lo que hay (esperado: 409)"
curl -s -w " -> %{http_code}\n" -b $ADMIN -X POST $URL/api/materiales/$ID_MAT/movimientos -H "$JSON" \
  -d '{"tipo":"SALIDA","cantidad":50}'

echo "--- 6. Cantidad 0, cantidad negativa y tipo inválido (esperado: 400, 400, 400)"
for CUERPO in '{"tipo":"ENTRADA","cantidad":0}' '{"tipo":"ENTRADA","cantidad":-3}' '{"tipo":"AJUSTE","cantidad":1}'; do
  curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/materiales/$ID_MAT/movimientos -H "$JSON" -d "$CUERPO"
done

echo "--- 7. Otra salida de 8 deja stock 4, bajo el mínimo 5 (esperado: aparece en stock-bajo)"
curl -s -b $ADMIN -X POST $URL/api/materiales/$ID_MAT/movimientos -H "$JSON" \
  -d '{"tipo":"SALIDA","cantidad":8}' | stock
curl -s -b $ADMIN $URL/api/materiales/stock-bajo | grep -o "\"codigo\":\"$COD\""

echo "--- 8. Historial (esperado: total 3 movimientos; el fallido de 50 no cuenta)"
curl -s -b $ADMIN $URL/api/materiales/$ID_MAT/movimientos | grep -o '"total":[0-9]*'

echo "--- 9. Técnico: consulta (esperado: 200), crea (403), mueve stock (403), stock-bajo (200)"
curl -s -o /dev/null -w "%{http_code}\n" -b $TEC "$URL/api/materiales?q=$COD"
curl -s -o /dev/null -w "%{http_code}\n" -b $TEC -X POST $URL/api/materiales -H "$JSON" \
  -d '{"nombre":"No debería","unidad":"u"}'
curl -s -o /dev/null -w "%{http_code}\n" -b $TEC -X POST $URL/api/materiales/$ID_MAT/movimientos -H "$JSON" \
  -d '{"tipo":"ENTRADA","cantidad":1}'
curl -s -o /dev/null -w "%{http_code}\n" -b $TEC $URL/api/materiales/stock-bajo

echo "--- 10. Editar precio (esperado: 200) y enviar stock_actual=999 (esperado: se ignora, sigue en 4)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X PATCH $URL/api/materiales/$ID_MAT -H "$JSON" \
  -d '{"precio_unitario":15}'
curl -s -b $ADMIN -X PATCH $URL/api/materiales/$ID_MAT -H "$JSON" \
  -d '{"stock_actual":999,"nombre":"Electrodo 6011 3/32"}' | stock

echo "--- 11. Concurrencia: 5 salidas de 4 a la vez sobre un stock de 10 (esperado: 2 veces 201 y 3 veces 409; stock final 2)"
R=$(curl -s -b $ADMIN -X POST $URL/api/materiales -H "$JSON" \
  -d "{\"nombre\":\"Disco de corte $RANDOM\",\"unidad\":\"u\"}")
ID_C=$(echo "$R" | idx id_material)
curl -s -o /dev/null -b $ADMIN -X POST $URL/api/materiales/$ID_C/movimientos -H "$JSON" \
  -d '{"tipo":"ENTRADA","cantidad":10}'
TMP=$(mktemp -d)
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/materiales/$ID_C/movimientos -H "$JSON" \
    -d '{"tipo":"SALIDA","cantidad":4}' > $TMP/$i.txt &
done
wait
cat $TMP/*.txt | sort | uniq -c
rm -rf $TMP
curl -s -b $ADMIN $URL/api/materiales/$ID_C | stock

echo "--- 12. Desactivar y mover stock (esperado: 200 y luego 400)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X PATCH $URL/api/materiales/$ID_MAT -H "$JSON" -d '{"activo":false}'
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN -X POST $URL/api/materiales/$ID_MAT/movimientos -H "$JSON" \
  -d '{"tipo":"ENTRADA","cantidad":1}'

echo "--- 13. Id inválido (esperado: 400), inexistente (esperado: 404), sin sesión (esperado: 401)"
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN $URL/api/materiales/no-es-uuid
curl -s -o /dev/null -w "%{http_code}\n" -b $ADMIN $URL/api/materiales/00000000-0000-4000-8000-000000000000
curl -s -o /dev/null -w "%{http_code}\n" $URL/api/materiales

curl -s -o /dev/null -b $ADMIN -X PATCH $URL/api/usuarios/$ID_TEC -H "$JSON" -d '{"activo":false}'
