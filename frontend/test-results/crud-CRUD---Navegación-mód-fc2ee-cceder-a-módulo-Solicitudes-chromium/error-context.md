# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: crud.spec.ts >> CRUD - Navegación módulos Admin (Chromium/Firefox) >> acceder a módulo Solicitudes
- Location: e2e/crud.spec.ts:51:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/admin/
Received string:  "http://localhost:5173/login"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    24 × locator resolved to <html lang="es">…</html>
       - unexpected value "http://localhost:5173/login"

```

```yaml
- complementary:
  - text: DYD
  - paragraph: DYD Sistema
  - paragraph: Mantenimiento industrial
  - text: Equipo DYD
  - heading "Mantenimiento industrial, bajo control." [level=1]
  - paragraph: Gestioná solicitudes, diagnósticos, cotizaciones y órdenes de trabajo desde un solo lugar.
  - list:
    - listitem:
      - img
      - text: Solicitudes y órdenes en tiempo real
    - listitem:
      - img
      - text: Diagnósticos con adjuntos y trazabilidad
    - listitem:
      - img
      - text: Reportes operativos y financieros
  - text: Soldaduras Especiales y Rectificaciones DYD E.I.R.L.
- main:
  - heading "Iniciar sesión" [level=2]
  - paragraph: Acceso para administradores y técnicos.
  - text: Correo corporativo
  - img
  - textbox "Correo corporativo":
    - /placeholder: nombre@dyd.com
    - text: admin@dyd.com
  - text: Contraseña
  - img
  - textbox "Contraseña":
    - /placeholder: ••••••••
    - text: Admin1234
  - button "Mostrar contraseña":
    - img
  - text: Demasiadas solicitudes. Intenta de nuevo más tarde.
  - button "Ingresar"
  - group: Credenciales demo
  - link "Volver al sitio público":
    - /url: /
    - img
    - text: Volver al sitio público
```

```
Test timeout of 60000ms exceeded while running "afterEach" hook.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | const CREDENTIALS = {
  4  |   admin: { email: 'admin@dyd.com', password: 'Admin1234' },
  5  | }
  6  | 
  7  | async function login(page) {
  8  |   await page.goto('/login')
  9  |   await expect(page).toHaveURL(/\/login/)
  10 |   await page.fill('input[id="email"]', CREDENTIALS.admin.email)
  11 |   await page.fill('input[id="password"]', CREDENTIALS.admin.password)
  12 |   await page.click('button[type="submit"]')
  13 |   await expect(page).toHaveURL(/\/admin/)
  14 |   await expect(page.locator('text=Panel de control')).toBeVisible({ timeout: 10000 })
  15 | }
  16 | 
  17 | async function logout(page) {
  18 |   await page.locator('button[aria-label="Cerrar sesión"]').click()
  19 |   await expect(page).toHaveURL(/\/login/)
  20 | }
  21 | 
  22 | test.describe('CRUD - Navegación módulos Admin (Chromium/Firefox)', () => {
  23 |   test.beforeEach(async ({ page }) => {
  24 |     await login(page)
  25 |   })
  26 | 
> 27 |   test.afterEach(async ({ page }) => {
     |        ^ Test timeout of 60000ms exceeded while running "afterEach" hook.
  28 |     await logout(page)
  29 |   })
  30 | 
  31 |   test('acceder a módulo Clientes', async ({ page }) => {
  32 |     await page.goto('/admin/clientes')
  33 |     await expect(page).toHaveURL(/\/admin\/clientes/)
  34 |     await expect(page.locator('button:has-text("Nuevo usuario")')).toBeVisible()
  35 |   })
  36 | 
  37 |   test('acceder a módulo Máquinas', async ({ page }) => {
  38 |     await page.goto('/admin/maquinas')
  39 |     await expect(page).toHaveURL(/\/admin\/maquinas/)
  40 |     await expect(page.locator('h1:has-text("Máquinas")')).toBeVisible({ timeout: 10000 })
  41 |     await expect(page.locator('button:has-text("Nueva máquina")')).toBeVisible()
  42 |   })
  43 | 
  44 |   test('acceder a módulo Materiales', async ({ page }) => {
  45 |     await page.goto('/admin/materiales')
  46 |     await expect(page).toHaveURL(/\/admin\/materiales/)
  47 |     await expect(page.locator('h1:has-text("Materiales")')).toBeVisible({ timeout: 10000 })
  48 |     await expect(page.locator('button:has-text("Nuevo material")')).toBeVisible()
  49 |   })
  50 | 
  51 |   test('acceder a módulo Solicitudes', async ({ page }) => {
  52 |     await page.goto('/admin/solicitudes')
  53 |     await expect(page).toHaveURL(/\/admin\/solicitudes/)
  54 |     await expect(page.locator('h1:has-text("Solicitudes")')).toBeVisible({ timeout: 10000 })
  55 |   })
  56 | 
  57 |   test('acceder a módulo Preventivos', async ({ page }) => {
  58 |     await page.goto('/admin/preventivos')
  59 |     await expect(page).toHaveURL(/\/admin\/preventivos/)
  60 |     await expect(page.locator('h1:has-text("Preventivos")')).toBeVisible({ timeout: 10000 })
  61 |   })
  62 | 
  63 |   test('acceder a módulo Reportes', async ({ page }) => {
  64 |     await page.goto('/admin/reportes')
  65 |     await expect(page).toHaveURL(/\/admin\/reportes/)
  66 |     await expect(page.locator('h1:has-text("Reportes")')).toBeVisible({ timeout: 10000 })
  67 |   })
  68 | 
  69 |   test('acceder a módulo Cotizaciones', async ({ page }) => {
  70 |     await page.goto('/admin/cotizaciones')
  71 |     await expect(page).toHaveURL(/\/admin\/cotizaciones/)
  72 |     await expect(page.locator('h1:has-text("Cotizaciones")')).toBeVisible({ timeout: 10000 })
  73 |   })
  74 | 
  75 |   test('acceder a módulo Órdenes', async ({ page }) => {
  76 |     await page.goto('/admin/ordenes')
  77 |     await expect(page).toHaveURL(/\/admin\/ordenes/)
  78 |     await expect(page.locator('h1:has-text("Órdenes")')).toBeVisible({ timeout: 10000 })
  79 |   })
  80 | 
  81 |   test('acceder a módulo Diagnósticos', async ({ page }) => {
  82 |     await page.goto('/admin/diagnosticos')
  83 |     await expect(page).toHaveURL(/\/admin\/diagnosticos/)
  84 |     await expect(page.locator('h1:has-text("Diagnósticos")')).toBeVisible({ timeout: 10000 })
  85 |   })
  86 | })
  87 | 
```