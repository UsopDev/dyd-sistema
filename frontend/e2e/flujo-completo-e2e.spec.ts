import { test, expect, type Page } from "@playwright/test";

/**
 * E2E del flujo completo de trabajo:
 * Solicitud -> Diagnóstico -> Cotización -> Aprobación -> Orden -> Finalización
 *
 * Selectores alineados con la UI real:
 * - Los estados se muestran capitalizados ("Recibida", "Cotizada", "Finalizada"),
 *   nunca en MAYÚSCULAS.
 * - Los botones de submit de los modales viven fuera del <form> y se
 *   localizan por el atributo `form="<id>"`.
 * - El técnico diagnostica; el administrador cotiza, asigna, inicia,
 *   registra materiales y finaliza la orden.
 */

const CREDENTIALS = {
  admin: { email: "admin@dyd.com", password: "Admin1234" },
  tecnico: { email: "tecnico@dyd.com", password: "Tecnico1234" },
} as const;

/**
 * Inicia sesión con el rol indicado.
 *
 * La sesión se mantiene en una cookie httpOnly, por lo que primero se
 * limpian las cookies del contexto: de otro modo `StaffLoginPage`
 * detecta que ya hay un usuario y redirige al panel, dejando el
 * formulario de login desmontado a mitad del test.
 */
async function login(page: Page, rol: keyof typeof CREDENTIALS) {
  const credenciales = CREDENTIALS[rol];

  await page.context().clearCookies();
  await page.goto("/login");
  await expect(page).toHaveURL(/\/login/);

  const email = page.locator('input[id="email"]');
  const password = page.locator('input[id="password"]');

  // Los campos se esperan visibles antes de escribir: evita el timeout
  // cuando el router todavía no montó el formulario de login.
  await expect(email).toBeVisible({ timeout: 20_000 });
  await expect(password).toBeVisible({ timeout: 20_000 });

  await email.fill(credenciales.email);
  await password.fill(credenciales.password);
  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(new RegExp(`/${rol}`), { timeout: 20_000 });
}

/** Espera un toast (notificación) por su título. */
async function esperarToast(page: Page, texto: string) {
  await expect(page.getByText(texto, { exact: false }).first()).toBeVisible({
    timeout: 20_000,
  });
}

/** Devuelve la fila (tr) que contiene el código dado. */
function filaConCodigo(page: Page, codigo: string) {
  return page.locator("tr").filter({ hasText: codigo });
}

/**
 * Selecciona en un <select> la opción cuyo texto contiene el código.
 * `selectOption({ label })` exige un string exacto, por lo que se localiza
 * primero el valor de la opción coincidente.
 */
async function seleccionarPorCodigo(
  select: ReturnType<Page["locator"]>,
  codigo: string,
) {
  const valor = await select
    .locator("option")
    .filter({ hasText: codigo })
    .first()
    .getAttribute("value");

  expect(valor, `No se encontró la opción ${codigo}`).toBeTruthy();
  await select.selectOption(valor!);
}

test.describe("Flujo completo de trabajo (E2E)", () => {
  test("Solicitud → Diagnóstico → Cotización → Orden → Finalización", async ({
    page,
  }) => {
    test.setTimeout(300_000);

    let codigoSolicitud = "";

    // Marca única por ejecución: permite localizar la solicitud propia
    // sin depender del orden de la tabla (el backend ordena por
    // prioridad y fecha ascendente, es decir, la más antigua primero).
    const marca = `E2E-${Date.now()}`;

    // ================================================================
    // PASO 1 — El administrador registra la solicitud
    // ================================================================
    await login(page, "admin");
    await page.goto("/admin/solicitudes");
    await expect(page).toHaveURL(/\/admin\/solicitudes/);

    await page.getByRole("button", { name: "Nueva solicitud" }).click();

    const modalSolicitud = page.getByRole("heading", { name: "Nueva solicitud" });
    await expect(modalSolicitud).toBeVisible({ timeout: 10_000 });

    await page.locator('select[id="id_maquina"]').selectOption({ index: 1 });
    await page.locator('select[id="tipo_servicio"]').selectOption("CORRECTIVO");
    await page
      .locator('textarea[id="descripcion"]')
      .fill(
        `${marca}: máquina CNC con ruido metálico en el eje principal y vibración excesiva durante el fresado.`,
      );

    await page.locator('button[form="solicitud-form"]').click();
    await esperarToast(page, "Solicitud registrada");

    // Se localiza la fila propia por la marca única de la descripción.
    const filaSolicitud = page.locator("tr").filter({ hasText: marca }).first();
    await expect(filaSolicitud).toBeVisible({ timeout: 15_000 });
    codigoSolicitud =
      (await filaSolicitud.textContent())?.match(/SOL-\d{4}-\d+/)?.[0] ?? "";
    expect(codigoSolicitud).not.toBe("");

    // ================================================================
    // PASO 2 — El técnico registra el diagnóstico
    // ================================================================
    await login(page, "tecnico");
    await page.goto("/tecnico/solicitudes");
    await expect(page).toHaveURL(/\/tecnico\/solicitudes/);

    // El botón "Diagnosticar" vive en la celda de acciones de la fila
    // de la solicitud; se acota a esa fila para no confundirse con las
    // solicitudes en estado RECIBIDA de otras ejecuciones.
    //
    // La tabla se ordena por antigüedad (ascendente), por lo que la
    // solicitud recién creada puede quedar fuera de la primera página.
    // Se filtra por la marca única para dejarla visible.
    await page
      .getByPlaceholder("Buscar por código o descripción")
      .fill(marca);

    const filaTecnico = filaConCodigo(page, codigoSolicitud).first();
    await expect(filaTecnico).toBeVisible({ timeout: 15_000 });
    await filaTecnico.getByRole("button", { name: "Diagnosticar" }).click();

    const modalDiagnostico = page.getByRole("heading", { name: /Diagnóstico/i });
    await expect(modalDiagnostico).toBeVisible({ timeout: 10_000 });

    await page.locator('select[id="estado_general"]').selectOption("MALO");
    await page
      .locator('textarea[id="fallas_detectadas"]')
      .fill(
        "Rodamiento del eje principal desgastado, holgura excesiva, ruido metálico y vibración por encima del normal.",
      );
    await page
      .locator('textarea[id="observaciones"]')
      .fill("Se observa holgura en el rodamiento principal y desalineación en el acople.");
    await page
      .locator('textarea[id="recomendaciones"]')
      .fill("Cambiar rodamiento SKF 6205, revisar alineación, balanceo y lubricación.");

    await page.locator('button[form="diagnostico-form"]').click();
    await esperarToast(page, "Diagnóstico registrado");

    // ================================================================
    // PASO 3 — El administrador crea la cotización
    // ================================================================
    await login(page, "admin");
    await page.goto("/admin/cotizaciones");
    await expect(page).toHaveURL(/\/admin\/cotizaciones/);

    await page.getByRole("button", { name: "Nueva cotización" }).click();

    const modalCotizacion = page.getByRole("heading", { name: "Nueva cotización" });
    await expect(modalCotizacion).toBeVisible({ timeout: 10_000 });

    // La opción de la solicitud se localiza por su código.
    await seleccionarPorCodigo(
      page.locator('select[id="id_solicitud"]'),
      codigoSolicitud,
    );

    // Línea 1 — servicio.
    await page.getByRole("button", { name: "Servicio" }).click();
    const linea1 = page.locator("div.rounded-xl.border").filter({ hasText: "Descripción" }).first();
    await linea1.getByPlaceholder("Mano de obra, reparación...").fill("Reparación del eje principal y cambio de rodamiento");
    await linea1.getByPlaceholder("0.00").fill("800");

    // Línea 2 — material del inventario.
    await page.getByRole("button", { name: "Material" }).click();
    const linea2 = page.locator("div.rounded-xl.border").filter({ hasText: "Material" }).last();
    await linea2.getByLabel("Material de la línea 2").selectOption({ index: 1 });

    await page
      .locator('textarea[id="observaciones"]')
      .fill("Cotización por reparación completa del eje principal con cambio de rodamiento.");

    await page.locator('button[form="cotizacion-form"]').click();
    await esperarToast(page, "Cotización creada");

    // ================================================================
    // PASO 4 — El administrador aprueba la cotización
    // ================================================================
    await page.goto("/admin/cotizaciones");
    await expect(page.getByText("Cotizaciones").first()).toBeVisible({ timeout: 10_000 });

    const filaCotizacion = filaConCodigo(page, codigoSolicitud).first();
    await expect(filaCotizacion).toBeVisible({ timeout: 10_000 });
    await filaCotizacion.locator('button[aria-label="Aprobar cotización"]').click();
    await esperarToast(page, "Cotización aprobada");

    // ================================================================
    // PASO 5 — El administrador asigna la orden de trabajo
    // ================================================================
    await page.goto("/admin/ordenes");
    await expect(page).toHaveURL(/\/admin\/ordenes/);

    await page.getByRole("button", { name: "Nueva orden" }).click();

    const modalOrden = page.getByRole("heading", { name: "Nueva orden de trabajo" });
    await expect(modalOrden).toBeVisible({ timeout: 10_000 });

    await seleccionarPorCodigo(
      page.locator('select[id="id_solicitud"]'),
      codigoSolicitud,
    );
    await page.locator('select[id="id_tecnico"]').selectOption({ index: 1 });

    await page.locator('button[form="orden-form"]').click();
    await esperarToast(page, "Orden asignada");

    // ================================================================
    // PASO 6 — El administrador inicia la orden
    // ================================================================
    await page.goto("/admin/ordenes");

    const filaOrden = filaConCodigo(page, codigoSolicitud).first();
    await expect(filaOrden).toBeVisible({ timeout: 10_000 });
    await filaOrden.locator('button[aria-label="Iniciar orden"]').click();
    await esperarToast(page, "Orden iniciada");

    // ================================================================
    // PASO 7 — El administrador registra el material utilizado
    // ================================================================
    await page.goto("/admin/ordenes");

    const filaOrdenDetalle = filaConCodigo(page, codigoSolicitud).first();
    await filaOrdenDetalle.locator('button[aria-label="Ver orden"]').click();

    await page.getByRole("button", { name: /Registrar consumo de material/i }).click();
    await page.locator('select[id="id_material_orden"]').selectOption({ index: 1 });
    await page.locator('input[id="cantidad_material"]').fill("2");
    await page.locator('button[type="submit"]').last().click();
    await esperarToast(page, "Material registrado");

    // ================================================================
    // PASO 8 — El administrador finaliza la orden
    // ================================================================
    await page.goto("/admin/ordenes");

    const filaOrdenFinal = filaConCodigo(page, codigoSolicitud).first();
    await filaOrdenFinal.locator('button[aria-label="Finalizar orden"]').click();

    const modalFinalizar = page.getByRole("heading", { name: "Finalizar orden" });
    await expect(modalFinalizar).toBeVisible({ timeout: 10_000 });

    await page
      .locator('textarea[id="trabajo_realizado"]')
      .fill(
        "Se cambió el rodamiento principal del eje, se corrigió la alineación del acople y se verificó el balanceo. La máquina opera dentro de los parámetros normales de vibración.",
      );
    await page.locator('input[id="monto_final"]').fill("850.00");

    await page.locator('button[form="finalizar-orden-form"]').click();
    await esperarToast(page, "Orden finalizada");

    // ================================================================
    // PASO 9 — Verificación del cierre completo
    // ================================================================
    await page.goto("/admin/solicitudes");

    const filaSolicitudFinal = filaConCodigo(page, codigoSolicitud).first();
    await expect(filaSolicitudFinal).toBeVisible({ timeout: 10_000 });
    await expect(filaSolicitudFinal.getByText("Finalizada")).toBeVisible({
      timeout: 10_000,
    });

    await page.goto("/admin/ordenes");
    const filaOrdenCerrada = filaConCodigo(page, codigoSolicitud).first();
    await expect(filaOrdenCerrada.getByText("Finalizada")).toBeVisible({
      timeout: 10_000,
    });
  });
});
