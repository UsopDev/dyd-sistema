import { test, expect } from '@playwright/test'

const CREDENTIALS = {
  admin: { email: 'admin@dyd.com', password: 'Admin1234' },
}

async function login(page) {
  await page.goto('/login')
  await expect(page).toHaveURL(/\/login/)
  await page.fill('input[id="email"]', CREDENTIALS.admin.email)
  await page.fill('input[id="password"]', CREDENTIALS.admin.password)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/admin/)
  await expect(page.locator('text=Panel de control')).toBeVisible({ timeout: 10000 })
}

async function logout(page) {
  await page.locator('button[aria-label="Cerrar sesión"]').click()
  await expect(page).toHaveURL(/\/login/)
}

test.describe('CRUD - Navegación módulos Admin (Chromium/Firefox)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test('acceder a módulo Clientes', async ({ page }) => {
    await page.goto('/admin/clientes')
    await expect(page).toHaveURL(/\/admin\/clientes/)
    await expect(page.locator('button:has-text("Nuevo usuario")')).toBeVisible()
  })

  test('acceder a módulo Máquinas', async ({ page }) => {
    await page.goto('/admin/maquinas')
    await expect(page).toHaveURL(/\/admin\/maquinas/)
    await expect(page.locator('h1:has-text("Máquinas")')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('button:has-text("Nueva máquina")')).toBeVisible()
  })

  test('acceder a módulo Materiales', async ({ page }) => {
    await page.goto('/admin/materiales')
    await expect(page).toHaveURL(/\/admin\/materiales/)
    await expect(page.locator('h1:has-text("Materiales")')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('button:has-text("Nuevo material")')).toBeVisible()
  })

  test('acceder a módulo Solicitudes', async ({ page }) => {
    await page.goto('/admin/solicitudes')
    await expect(page).toHaveURL(/\/admin\/solicitudes/)
    await expect(page.locator('h1:has-text("Solicitudes")')).toBeVisible({ timeout: 10000 })
  })

  test('acceder a módulo Preventivos', async ({ page }) => {
    await page.goto('/admin/preventivos')
    await expect(page).toHaveURL(/\/admin\/preventivos/)
    await expect(page.locator('h1:has-text("Preventivos")')).toBeVisible({ timeout: 10000 })
  })

  test('acceder a módulo Reportes', async ({ page }) => {
    await page.goto('/admin/reportes')
    await expect(page).toHaveURL(/\/admin\/reportes/)
    await expect(page.locator('h1:has-text("Reportes")')).toBeVisible({ timeout: 10000 })
  })

  test('acceder a módulo Cotizaciones', async ({ page }) => {
    await page.goto('/admin/cotizaciones')
    await expect(page).toHaveURL(/\/admin\/cotizaciones/)
    await expect(page.locator('h1:has-text("Cotizaciones")')).toBeVisible({ timeout: 10000 })
  })

  test('acceder a módulo Órdenes', async ({ page }) => {
    await page.goto('/admin/ordenes')
    await expect(page).toHaveURL(/\/admin\/ordenes/)
    await expect(page.locator('h1:has-text("Órdenes")')).toBeVisible({ timeout: 10000 })
  })

  test('acceder a módulo Diagnósticos', async ({ page }) => {
    await page.goto('/admin/diagnosticos')
    await expect(page).toHaveURL(/\/admin\/diagnosticos/)
    await expect(page.locator('h1:has-text("Diagnósticos")')).toBeVisible({ timeout: 10000 })
  })
})
