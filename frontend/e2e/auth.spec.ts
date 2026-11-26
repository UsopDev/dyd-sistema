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

async function logout(page) {
  await page.locator('button[aria-label="Cerrar sesión"]').click()
  await expect(page).toHaveURL(/\/login/)
}

test.describe('Autenticación y navegación por rol', () => {
  test.describe('Administrador', () => {
    test('iniciar sesión → navegar dashboard admin → cerrar sesión', async ({ page }) => {
      await login(page, 'admin')
      
      // Debe redirigir a /admin y mostrar "Panel de control"
      await expect(page).toHaveURL(/\/admin/)
      await expect(page.locator('text=Panel de control')).toBeVisible({ timeout: 10000 })
      
      // Navegar a sección de usuarios (solo admin)
      await page.goto('/admin/usuarios')
      await expect(page).toHaveURL(/\/admin\/usuarios/)
      await expect(page.locator('h1:has-text("Usuarios")')).toBeVisible({ timeout: 10000 })
      
      // Navegar a solicitudes
      await page.goto('/admin/solicitudes')
      await expect(page).toHaveURL(/\/admin\/solicitudes/)
      await expect(page.locator('h1:has-text("Solicitudes")')).toBeVisible({ timeout: 10000 })
      
      // Logout
      await page.locator('button[aria-label="Cerrar sesión"]').click()
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe('Técnico', () => {
    test('iniciar sesión → navegar dashboard técnico → cerrar sesión', async ({ page }) => {
      await page.goto('/login')
      await expect(page).toHaveURL(/\/login/)
      await page.fill('input[id="email"]', CREDENTIALS.tecnico.email)
      await page.fill('input[id="password"]', CREDENTIALS.tecnico.password)
      await page.click('button[type="submit"]')
      
      // Debe redirigir a /tecnico y mostrar "Panel técnico"
      await expect(page).toHaveURL(/\/tecnico/)
      await expect(page.locator('text=Panel técnico')).toBeVisible({ timeout: 10000 })
      
      // Navegar a solicitudes
      await page.goto('/tecnico/solicitudes')
      await expect(page).toHaveURL(/\/tecnico\/solicitudes/)
      await expect(page.locator('h1:has-text("Mis solicitudes")')).toBeVisible({ timeout: 10000 })
      
      // Navegar a órdenes
      await page.goto('/tecnico/ordenes')
      await expect(page).toHaveURL(/\/tecnico\/ordenes/)
      await expect(page.locator('h1:has-text("Mis órdenes")')).toBeVisible({ timeout: 10000 })
      
      // Logout
      await page.locator('button[aria-label="Cerrar sesión"]').click()
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe('Acceso no autorizado', () => {
    test('técnico no puede acceder a rutas de admin', async ({ page }) => {
      await page.goto('/login')
      await expect(page).toHaveURL(/\/login/)
      await page.fill('input[id="email"]', CREDENTIALS.tecnico.email)
      await page.fill('input[id="password"]', CREDENTIALS.tecnico.password)
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL(/\/tecnico/)
      
      // Intentar acceder a ruta de admin
      await page.goto('/admin/usuarios')
      
      // Debe mostrar 403 / acceso denegado
      await expect(page.locator('text=/403|No autorizado|Acceso denegado|Prohibido/i')).toBeVisible({ timeout: 10000 })
    })
  })
})
