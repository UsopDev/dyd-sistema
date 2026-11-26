import { test, expect } from '@playwright/test'

const CREDENTIALS = {
  admin: { email: 'admin@dyd.com', password: 'Admin1234' },
  tecnico: { email: 'tecnico@dyd.com', password: 'Tecnico1234' },
}

async function login(page, role: 'admin' | 'tecnico') {
  const creds = CREDENTIALS[role]
  await page.goto('/login')
  await expect(page).toHaveURL(/\/login/)
  await page.fill('input[id="email"]', creds.email)
  await page.fill('input[id="password"]', creds.password)
  await page.click('button[type="submit"]')
}

test.describe('Registro de Solicitud y Diagnóstico Técnico (E2E)', () => {
  test('Admin puede navegar a módulo de solicitudes', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/solicitudes')
    await expect(page).toHaveURL(/\/admin\/solicitudes/)
    await expect(page.locator('text=Solicitudes').first()).toBeVisible({ timeout: 10000 })
  })

  test('Admin puede navegar a módulo de diagnósticos', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/diagnosticos')
    await expect(page).toHaveURL(/\/admin\/diagnosticos/)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  })

  test('Técnico puede acceder a su panel y ver solicitudes', async ({ page }) => {
    await login(page, 'tecnico')
    await expect(page).toHaveURL(/\/tecnico/)
    await expect(page.locator('text=Panel técnico')).toBeVisible({ timeout: 10000 })
    
    await page.goto('/tecnico/solicitudes')
    await expect(page).toHaveURL(/\/tecnico\/solicitudes/)
    await expect(page.locator('h1:has-text("Mis solicitudes")')).toBeVisible({ timeout: 10000 })
  })

  test('Técnico puede acceder a módulo de diagnósticos', async ({ page }) => {
    await login(page, 'tecnico')
    await page.goto('/tecnico/diagnosticos')
    await expect(page).toHaveURL(/\/tecnico\/diagnosticos/)
    // Verificar que la página carga (título puede ser "Diagnósticos" o "Mis solicitudes")
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  })
})
