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

test.describe('Flujo Completo: Verificación de Navegación Módulos Clave', () => {
  test('Admin navega módulos: Solicitudes, Cotizaciones, Órdenes, Diagnósticos', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login/)
    await page.fill('input[id="email"]', 'admin@dyd.com')
    await page.fill('input[id="password"]', 'Admin1234')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/\/admin/)
    await expect(page.locator('text=Panel de control')).toBeVisible({ timeout: 10000 })
    
    // 1. Módulo Solicitudes
    await page.goto('/admin/solicitudes')
    await expect(page).toHaveURL(/\/admin\/solicitudes/)
    await expect(page.locator('text=Solicitudes').first()).toBeVisible({ timeout: 10000 })
    
    // 2. Módulo Cotizaciones
    await page.goto('/admin/cotizaciones')
    await expect(page).toHaveURL(/\/admin\/cotizaciones/)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
    
    // 3. Módulo Órdenes
    await page.goto('/admin/ordenes')
    await expect(page).toHaveURL(/\/admin\/ordenes/)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
    
    // 3. Módulo Diagnósticos
    await page.goto('/admin/diagnosticos')
    await expect(page).toHaveURL(/\/admin\/diagnosticos/)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
    
    // 4. Módulo Preventivos
    await page.goto('/admin/preventivos')
    await expect(page).toHaveURL(/\/admin\/preventivos/)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
    
    // 5. Módulo Reportes
    await page.goto('/admin/reportes')
    await expect(page).toHaveURL(/\/admin\/reportes/)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  })

  test('Técnico navega sus módulos: Panel, Solicitudes, Órdenes, Diagnósticos', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login/)
    await page.fill('input[id="email"]', 'tecnico@dyd.com')
    await page.fill('input[id="password"]', 'Tecnico1234')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/\/tecnico/)
    await expect(page.locator('text=Panel técnico')).toBeVisible({ timeout: 10000 })
    
    // 1. Panel técnico
    await expect(page.locator('text=Panel técnico')).toBeVisible({ timeout: 10000 })
    
    // 2. Mis solicitudes
    await page.goto('/tecnico/solicitudes')
    await expect(page).toHaveURL(/\/tecnico\/solicitudes/)
    await expect(page.locator('h1:has-text("Mis solicitudes")')).toBeVisible({ timeout: 10000 })
    
    // 3. Mis órdenes
    await page.goto('/tecnico/ordenes')
    await expect(page).toHaveURL(/\/tecnico\/ordenes/)
    await expect(page.locator('h1:has-text("Mis órdenes")')).toBeVisible({ timeout: 10000 })
    
    // 4. Diagnósticos
    await page.goto('/tecnico/diagnosticos')
    await expect(page).toHaveURL(/\/tecnico\/diagnosticos/)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  })
})
