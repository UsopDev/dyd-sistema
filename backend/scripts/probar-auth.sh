#!/usr/bin/env bash
URL=http://localhost:3000
PW=$(grep '^ADMIN_PASSWORD=' .env | tail -n1 | cut -d= -f2)
COOKIES=/tmp/dyd-cookies.txt

echo "--- 1. Login correcto (esperado: 200 + Set-Cookie HttpOnly + rol ADMINISTRADOR)"
curl -si -c $COOKIES -X POST $URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@dyd.com\",\"password\":\"$PW\"}" | grep -iE "^HTTP|set-cookie|usuario"

echo; echo "--- 2. /me con sesión (esperado: datos del usuario)"
curl -s -b $COOKIES $URL/api/auth/me

echo; echo "--- 3. /me sin sesión (esperado: No autenticado)"
curl -s $URL/api/auth/me

echo; echo "--- 4. Clave incorrecta (esperado: Credenciales inválidas)"
curl -s -X POST $URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dyd.com","password":"incorrecta"}'

echo; echo "--- 5. JSON mal formado (esperado: 400)"
curl -si -X POST $URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":' | grep -iE "^HTTP|error"

echo; echo "--- 6. Logout (esperado: 204 + cookie borrada)"
curl -si -b $COOKIES -X POST $URL/api/auth/logout | grep -iE "^HTTP|set-cookie"
