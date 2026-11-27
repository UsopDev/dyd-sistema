import { test, expect } from '@playwright/test'

const CREDENTIALS = {
  admin: { email: 'admin@dyd.com', password: 'Admin1234' },
  tecnico: { email: 'tecnico@dyd.com', password: 'Tecnico1234' },
}

async function login(page, role: 'admin' | 'tecnico') {
  const creds = CREDENTIALS[role]
  await page.goto('/login')
  await expect(page).toHaveURL(/\/login/)
  await page.waitForSelector('input[id="email"]', { state: 'visible', timeout: 10000 })
  await page.fill('input[id="email"]', creds.email)
  await page.fill('input[id="password"]', creds.password)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/(admin|tecnico)/)
}

test.describe('Flujo Completo E2E: Solicitud → Diagnóstico → Cotización → Orden → Finalización', () => {
  test('Flujo completo E2E: Solicitud → Diagnóstico → Cotización → Orden → Finalización', async ({ page }) => {
    test.setTimeout(300000) // 5 minutos para el flujo completo

    // ============================================
    // PASO 1: ADMIN CREA SOLICITUD DE MANTENIMIENTO CORRECTIVO
    // ============================================
    await login(page, 'admin')
    await expect(page.locator('text=Panel de control')).toBeVisible({ timeout: 10000 })

    // Crear solicitud de mantenimiento correctivo
    await page.goto('/admin/solicitudes')
    await expect(page).toHaveURL(/\/admin\/solicitudes/)
    await expect(page.locator('text=Solicitudes').first()).toBeVisible({ timeout: 10000 })
    
    // Click en botón "Nueva solicitud" - usar getByRole para evitar strict mode violation
    await page.getByRole('button', { name: 'Nueva solicitud' }).click()
    await expect(page.getByRole('heading', { name: 'Nueva solicitud' })).toBeVisible({ timeout: 5000 })
    
    // Llenar formulario de solicitud
    await page.selectOption('select[id="id_maquina"]', { index: 1 })
    await page.selectOption('select[id="tipo_servicio"]', 'CORRECTIVO')
    await page.fill('textarea[id="descripcion"]', 'Máquina CNC hace ruido extraño en el eje principal, vibración excesiva')
    await page.click('button[type="submit"]')
    
    // Verificar solicitud creada en estado RECIBIDA
    await expect(page.locator('span:has-text("RECIBIDA")').first()).toBeVisible({ timeout: 10000 })
    const solicitudCode = await page.locator('text=SOL-').first().textContent()
    console.log('Solicitud creada:', solicitudCode)

    // ============================================
    // PASO 2: TÉCNICO REGISTRA DIAGNÓSTICO
    // ============================================
    await page.goto('/login')
    await login(page, 'tecnico')
    await expect(page.locator('text=Panel técnico')).toBeVisible({ timeout: 10000 })

    // Ir a diagnósticos
    await page.goto('/tecnico/diagnosticos')
    await expect(page).toHaveURL(/\/tecnico\/diagnosticos/)
    await expect(page.locator('text=Mis solicitudes')).toBeVisible({ timeout: 10000 })

    // Click en "Diagnosticar" en la primera solicitud RECIBIDA
    await page.getByRole('button', { name: 'Diagnosticar' }).first().click()
    await expect(page.locator('text=Registrar Diagnóstico')).toBeVisible({ timeout: 5000 })

    // Llenar formulario de diagnóstico
    await page.selectOption('select[id="estado_general"]', 'MALO')
    await page.fill('textarea[id="fallas_detectadas"]', 'Rodamiento del eje principal desgastado, vibración excesiva y ruido metálico')
    await page.fill('textarea[id="observaciones"]', 'Se detectó holgura excesiva en rodamiento principal')
    await page.fill('textarea[id="recomendaciones"]', 'Cambiar rodamiento SKF 6205, revisar alineación y balanceo')
    
    // Enviar diagnóstico
    await page.click('button[type="submit"]')
    
    // Verificar diagnóstico creado y solicitud en EN_DIAGNOSTICO
    await expect(page.locator('text=Diagnóstico registrado')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('span:has-text("EN_DIAGNOSTICO")').first()).toBeVisible({ timeout: 5000 })

    // ============================================
    // PASO 3: ADMIN CREA COTIZACIÓN
    // ============================================
    await page.goto('/login')
    await login(page, 'admin')
    await expect(page.locator('text=Panel de control')).toBeVisible({ timeout: 10000 })

    await page.goto('/admin/cotizaciones')
    await expect(page).toHaveURL(/\/admin\/cotizaciones/)
    await expect(page.locator('text=Cotizaciones').first()).toBeVisible({ timeout: 10000 })

    // Crear nueva cotización
    await page.getByRole('button', { name: 'Nueva cotización' }).click()
    await expect(page.getByRole('heading', { name: 'Nueva cotización' })).toBeVisible({ timeout: 5000 })

    // Seleccionar solicitud con diagnóstico
    await page.selectOption('select[id="id_solicitud"]', { label: /SOL-/ })
    await expect(page.locator('span:has-text("EN_DIAGNOSTICO")').first()).toBeVisible({ timeout: 5000 })

    // Agregar línea de servicio
    await page.getByRole('button', { name: 'Servicio' }).click()
    await expect(page.getByRole('heading', { name: 'Nueva línea' })).toBeVisible({ timeout: 3000 })
    await page.fill('textarea[id^="descripcion"]', 'Reparación completa del eje principal y cambio de rodamiento')
    await page.fill('input[id^="cantidad"]', '1')
    await page.fill('input[id^="precio_unitario"]', '800')

    // Agregar línea de material
    await page.getByRole('button', { name: 'Material' }).click()
    await page.selectOption('select[id^="id_material"]', { index: 1 })
    await page.fill('input[id^="cantidad"]', '2')

    // Observaciones
    await page.fill('textarea[id="observaciones"]', 'Cotización para reparación completa del eje principal y cambio de rodamiento')

    // Enviar cotización
    await page.click('button[type="submit"]')
    
    // Verificar cotización creada
    await expect(page.locator('text=Cotización creada')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('span:has-text("COTIZADA")').first()).toBeVisible({ timeout: 5000 })

    // ============================================
    // PASO 4: ADMIN APRUEBA COTIZACIÓN Y CREA ORDEN
    // ============================================
    await page.goto('/admin/cotizaciones')
    await expect(page.locator('text=Cotizaciones').first()).toBeVisible({ timeout: 10000 })

    // Aprobar cotización
    await page.locator('button[aria-label="Aprobar cotización"]').first().click()
    await expect(page.locator('text=Cotización aprobada')).toBeVisible({ timeout: 5000 })

    // Crear orden de trabajo
    await page.goto('/admin/ordenes')
    await expect(page.locator('text=Órdenes').first()).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: 'Nueva orden' }).click()
    await expect(page.getByRole('heading', { name: 'Nueva orden de trabajo' })).toBeVisible({ timeout: 5000 })

    // Seleccionar solicitud cotizada
    await page.selectOption('select[id="id_solicitud"]', { label: /COTIZADA/ })
    await page.selectOption('select[id="id_tecnico"]', { index: 1 })

    // Crear orden
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Orden asignada')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('span:has-text("PENDIENTE")').first()).toBeVisible({ timeout: 5000 })

    // ============================================
    // PASO 5: TÉCNICO INICIA Y FINALIZA ORDEN
    // ============================================
    await page.goto('/login')
    await login(page, 'tecnico')
    await expect(page.locator('text=Panel técnico')).toBeVisible({ timeout: 10000 })

    // Ir a órdenes del técnico
    await page.goto('/tecnico/ordenes')
    await expect(page.locator('text=Panel técnico')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Mis órdenes')).toBeVisible({ timeout: 10000 })

    // Iniciar orden
    await page.getByRole('button', { name: 'Iniciar' }).first().click()
    await expect(page.locator('span:has-text("EN_PROCESO")').first()).toBeVisible({ timeout: 5000 })

    // Agregar material (opcional)
    await page.getByRole('button', { name: 'Agregar material' }).first().click()
    await page.selectOption('select[id="id_material_orden"]', { index: 1 })
    await page.fill('input[id="cantidad_material"]', '2')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Material registrado')).toBeVisible({ timeout: 5000 })

    // Finalizar orden
    await page.getByRole('button', { name: 'Finalizar' }).first().click()
    await expect(page.locator('text=Finalizar orden')).toBeVisible({ timeout: 5000 })

    await page.fill('textarea[id="trabajo_realizado"]', 'Se realizó el cambio del rodamiento principal, se verificó la alineación del eje y se realizaron pruebas de vibración. La máquina opera dentro de parámetros normales.')
    await page.fill('input[id="monto_final"]', '850.00')
    await page.click('button[type="submit"]')

    // Verificar orden finalizada
    await expect(page.locator('text=Orden finalizada')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('span:has-text("FINALIZADA")').first()).toBeVisible({ timeout: 5000 })

    // ============================================
    // PASO 6: VERIFICAR CIERRE COMPLETO
    // ============================================
    // Verificar que solicitud también está FINALIZADA
    await page.goto('/tecnico/solicitudes')
    await expect(page.locator('span:has-text("FINALIZADA")').first()).toBeVisible({ timeout: 5000 })

    // Admin verifica cierre completo
    await page.goto('/login')
    await login(page, 'admin')

    await page.goto('/admin/ordenes')
    await expect(page.locator('span:has-text("FINALIZADA")').first()).toBeVisible({ timeout: 10000 })

    // Ver informe de servicio
    await page.getByRole('button', { name: 'Ver orden' }).first().click()
    await expect(page.locator('text=Informe de servicio')).toBeVisible({ timeout: 5000 })
    
    // Verificar que todo el ciclo está completo
    await expect(page.locator('span:has-text("FINALIZADA")').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Trabajo realizado')).toBeVisible({ timeout: 5000 })
  })
})
