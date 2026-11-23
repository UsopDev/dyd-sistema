#!/usr/bin/env bash
URL=http://localhost:3000
PW=$(grep '^ADMIN_PASSWORD=' .env | tail -n1 | cut -d= -f2)
J=/tmp/dyd-sesion.txt
VIEJO=/tmp/dyd-sesion-vieja.txt

echo "--- 1. Login (esperado: 200)"
curl -s -o /dev/null -w "%{http_code}\n" -c $J -X POST $URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@dyd.com\",\"password\":\"$PW\"}"

echo "--- 2. Redis guarda el hash del token, no el token (esperado: 1 clave refresh:...)"
docker exec dyd_redis redis-cli --scan --pattern 'refresh:*'

echo "--- 3. Vencimiento en segundos (esperado: cerca de 604800 = 7 días)"
docker exec dyd_redis redis-cli --scan --pattern 'refresh:*' | head -n1 | xargs -I{} docker exec dyd_redis redis-cli ttl {}

cp $J $VIEJO

echo "--- 4. Refresh con el token vigente (esperado: 200)"
curl -s -o /dev/null -w "%{http_code}\n" -b $J -c $J -X POST $URL/api/auth/refresh

echo "--- 5. Reusar el token anterior (esperado: 401, ya fue consumido)"
curl -s -w " -> %{http_code}\n" -b $VIEJO -X POST $URL/api/auth/refresh

echo "--- 6. Logout y refresh después (esperado: 204 y luego 401)"
curl -s -o /dev/null -w "%{http_code}\n" -b $J -c $J -X POST $URL/api/auth/logout
curl -s -w " -> %{http_code}\n" -b $J -X POST $URL/api/auth/refresh

echo "--- 7. Claves en Redis tras el logout (esperado: ninguna)"
docker exec dyd_redis redis-cli --scan --pattern 'refresh:*'
echo "(fin)"
