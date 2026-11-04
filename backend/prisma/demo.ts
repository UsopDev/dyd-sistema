/**
 * Seed de demostración — DyD Sistema (capturas de las secciones 3.4 y 3.5)
 *
 * Qué hace:
 *   1. Inicia sesión como administrador y comprueba que la API responde.
 *   2. BORRA los datos de prueba (clientes, máquinas, solicitudes, órdenes, materiales,
 *      etc.). Los usuarios NO se borran.
 *   3. Carga datos de demostración a través de la API, siguiendo el flujo real:
 *      solicitud → diagnóstico → cotización → orden → inicio → materiales → finalización.
 *   4. Ajusta las fechas para que las listas no muestren todo con la fecha de hoy.
 *
 * Variables de entorno necesarias:
 *   DEMO_ADMIN_EMAIL       correo de un usuario administrador
 *   DEMO_ADMIN_PASSWORD    contraseña de ese administrador
 *   DEMO_TECNICO_PASSWORD  contraseña (mínimo 8 caracteres) para los 2 técnicos de demostración
 *   API_URL                opcional; por defecto http://localhost:$PORT (o 3000)
 *
 * Uso (desde la carpeta backend, con el backend, Postgres y Redis encendidos):
 *   npx tsx prisma/demo.ts
 */
import { createInterface } from "node:readline/promises";
import { prisma } from "../src/lib/prisma.js";

const API = process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
const DIA = 24 * 60 * 60 * 1000;

// ───────────────────────────── Cliente HTTP con cookies ─────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

class Sesion {
  private cookies = new Map<string, string>();

  constructor(readonly nombre: string) {}

  async login(email: string, password: string): Promise<Json> {
    const r = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!r.ok) {
      throw new Error(`No se pudo iniciar sesión con ${email}: ${r.status} ${await r.text()}`);
    }

    for (const cookie of r.headers.getSetCookie()) {
      const par = cookie.split(";")[0] ?? "";
      const i = par.indexOf("=");
      if (i > 0) this.cookies.set(par.slice(0, i), par.slice(i + 1));
    }

    const datos: Json = await r.json();
    return datos.usuario;
  }

  async pedir(
    metodo: "GET" | "POST",
    ruta: string,
    cuerpo?: unknown,
    toleradas: number[] = [],
  ): Promise<Json> {
    const cookie = [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");

    const r = await fetch(`${API}/api${ruta}`, {
      method: metodo,
      headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });

    if (r.ok) return r.status === 204 ? null : r.json();
    if (toleradas.includes(r.status)) return null;

    throw new Error(`[${this.nombre}] ${metodo} ${ruta} → ${r.status} ${await r.text()}`);
  }
}

// ───────────────────────────── Utilidades ─────────────────────────────

function exigirEnv(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    console.error(`✖ Falta la variable de entorno ${nombre}. Revisa las instrucciones al inicio del archivo.`);
    process.exit(1);
  }
  return valor;
}

function ident(mapa: Map<string, string>, clave: string): string {
  const valor = mapa.get(clave);
  if (!valor) throw new Error(`No se encontró "${clave}" en los datos de demostración`);
  return valor;
}

function fechaISO(diasAtras: number): string {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// ───────────────────────────── Datos de demostración ─────────────────────────────

const TECNICOS = [
  { nombres: "Jorge", apellidos: "Huamán Quispe", email: "jhuaman@dyd.pe" },
  { nombres: "Luis", apellidos: "Ccori Rojas", email: "lccori@dyd.pe" },
];

const CLIENTES = [
  {
    clave: "santarosa",
    razon_social: "Metalmecánica Santa Rosa S.A.C.",
    ruc_dni: "20601234561",
    contacto: "Ing. Rafael Torres",
    telefono: "987 654 321",
    email: "compras@metalsantarosa.pe",
    direccion: "Av. Argentina 2450, Callao",
  },
  {
    clave: "costaazul",
    razon_social: "Pesquera Costa Azul S.A.C.",
    ruc_dni: "20512876543",
    contacto: "Marisol Paredes",
    telefono: "956 321 874",
    email: "mantenimiento@costaazul.pe",
    direccion: "Av. Contralmirante Mora 1180, Callao",
  },
  {
    clave: "ventanilla",
    razon_social: "Transportes Ventanilla E.I.R.L.",
    ruc_dni: "20498765432",
    contacto: "Hugo Salazar",
    telefono: "945 118 702",
    email: "operaciones@transventanilla.pe",
    direccion: "Av. Pedro Beltrán 640, Ventanilla",
  },
  {
    clave: "molinos",
    razon_social: "Molinos del Pacífico S.A.",
    ruc_dni: "20100234567",
    contacto: "Ing. Patricia Vega",
    telefono: "914 556 230",
    email: "planta@molinospacifico.pe",
    direccion: "Av. Néstor Gambetta 3100, Callao",
  },
  {
    clave: "fundicion",
    razon_social: "Fundición Andina S.R.L.",
    ruc_dni: "20556789123",
    contacto: "Ing. Walter Ccama",
    telefono: "962 774 015",
    email: "gerencia@fundicionandina.pe",
    direccion: "Jr. Los Metales 215, Bellavista, Callao",
  },
];

interface DatosMaquina {
  clave: string;
  cliente?: string; // sin cliente = máquina propia de DyD
  codigo: string;
  nombre: string;
  tipo: string;
  marca: string;
  modelo: string;
  nro_serie: string;
  horas_uso: number;
  estado: "OPERATIVA" | "EN_MANTENIMIENTO" | "FUERA_DE_SERVICIO";
}

const MAQUINAS: DatosMaquina[] = [
  { clave: "torno1", cliente: "santarosa", codigo: "MAQ-001", nombre: "Torno paralelo", tipo: "Torno", marca: "Pinacho", modelo: "S 90/200", nro_serie: "PN-48213", horas_uso: 3420.5, estado: "OPERATIVA" },
  { clave: "fresa", cliente: "santarosa", codigo: "MAQ-002", nombre: "Fresadora universal", tipo: "Fresadora", marca: "Lagun", modelo: "FTV-2", nro_serie: "LG-77120", horas_uso: 2105, estado: "OPERATIVA" },
  { clave: "compr1", cliente: "costaazul", codigo: "MAQ-003", nombre: "Compresor de tornillo", tipo: "Compresor", marca: "Atlas Copco", modelo: "GA 30", nro_serie: "AC-309118", horas_uso: 8120, estado: "OPERATIVA" },
  { clave: "bomba", cliente: "costaazul", codigo: "MAQ-004", nombre: "Bomba hidráulica", tipo: "Bomba", marca: "Parker", modelo: "PV080", nro_serie: "PK-55012", horas_uso: 1890, estado: "EN_MANTENIMIENTO" },
  { clave: "compr2", cliente: "ventanilla", codigo: "MAQ-005", nombre: "Compresor de pistón", tipo: "Compresor", marca: "Ingersoll Rand", modelo: "2475N7.5", nro_serie: "IR-120045", horas_uso: 4310, estado: "OPERATIVA" },
  { clave: "rectif", cliente: "ventanilla", codigo: "MAQ-006", nombre: "Rectificadora cilíndrica", tipo: "Rectificadora", marca: "Jones & Shipman", modelo: "1311", nro_serie: "JS-30211", horas_uso: 2760.5, estado: "OPERATIVA" },
  { clave: "reductor", cliente: "molinos", codigo: "MAQ-007", nombre: "Reductor de velocidad", tipo: "Reductor", marca: "Flender", modelo: "B3SH 7", nro_serie: "FL-880213", horas_uso: 12450, estado: "OPERATIVA" },
  { clave: "prensa", cliente: "fundicion", codigo: "MAQ-008", nombre: "Prensa hidráulica 100 t", tipo: "Prensa", marca: "Enerpac", modelo: "P-100T", nro_serie: "EN-65120", horas_uso: 5200, estado: "OPERATIVA" },
  { clave: "tornoDyd", codigo: "MAQ-009", nombre: "Torno paralelo propio", tipo: "Torno", marca: "Colchester", modelo: "Master 2500", nro_serie: "CO-20871", horas_uso: 9100, estado: "OPERATIVA" },
  { clave: "comprDyd", codigo: "MAQ-010", nombre: "Compresor propio", tipo: "Compresor", marca: "Atlas Copco", modelo: "GA 11", nro_serie: "AC-114502", horas_uso: 3300, estado: "OPERATIVA" },
  { clave: "soldadora", codigo: "MAQ-011", nombre: "Soldadora inverter propia", tipo: "Soldadora", marca: "Lincoln Electric", modelo: "Invertec V350", nro_serie: "LE-770341", horas_uso: 1850, estado: "OPERATIVA" },
];

const MATERIALES = [
  { clave: "e6011", codigo: "MAT-001", nombre: 'Electrodo E6011 3/32"', unidad: "kg", stock_minimo: 10, precio_unitario: 14.5, stock: 40 },
  { clave: "e7018", codigo: "MAT-002", nombre: 'Electrodo E7018 1/8"', unidad: "kg", stock_minimo: 15, precio_unitario: 18.9, stock: 12 },
  { clave: "rod6205", codigo: "MAT-003", nombre: "Rodamiento 6205-2RS", unidad: "unid", stock_minimo: 4, precio_unitario: 28, stock: 20 },
  { clave: "aceite", codigo: "MAT-004", nombre: "Aceite hidráulico ISO 68", unidad: "gal", stock_minimo: 5, precio_unitario: 95, stock: 18 },
  { clave: "filtro", codigo: "MAT-005", nombre: "Filtro de aire para compresor", unidad: "unid", stock_minimo: 3, precio_unitario: 120, stock: 8 },
  { clave: "faja", codigo: "MAT-006", nombre: "Faja trapezoidal B-52", unidad: "unid", stock_minimo: 4, precio_unitario: 35, stock: 3 },
  { clave: "grasa", codigo: "MAT-007", nombre: "Grasa industrial EP-2", unidad: "kg", stock_minimo: 5, precio_unitario: 32, stock: 15 },
  { clave: "disco", codigo: "MAT-008", nombre: 'Disco de corte 7"', unidad: "unid", stock_minimo: 10, precio_unitario: 7.5, stock: 60 },
  { clave: "sello", codigo: "MAT-009", nombre: 'Sello mecánico 1-1/4"', unidad: "unid", stock_minimo: 2, precio_unitario: 210, stock: 5 },
  { clave: "piedra", codigo: "MAT-010", nombre: "Piedra abrasiva para rectificadora", unidad: "unid", stock_minimo: 2, precio_unitario: 180, stock: 4 },
];

// Horas de uso diarias registradas en los últimos días (la más reciente primero).
const USO = [
  { maquina: "torno1", horas: [7.5, 8, 6.5, 7] },
  { maquina: "fresa", horas: [6, 5.5, 7, 6.5] },
  { maquina: "compr1", horas: [16, 18, 17.5, 16] },
  { maquina: "compr2", horas: [9, 8.5, 10, 9.5] },
  { maquina: "rectif", horas: [5, 6.5, 6, 5.5] },
  { maquina: "reductor", horas: [20, 21, 20.5, 22] },
  { maquina: "comprDyd", horas: [4, 3.5, 5, 4.5] },
  { maquina: "tornoDyd", horas: [6, 7, 5.5, 6.5] },
];

interface DatosPrograma {
  maquina: string;
  descripcion: string;
  frecuencia_dias?: number;
  frecuencia_horas?: number;
  ultimoDias: number; // hace cuántos días fue el último mantenimiento
  horasConsumidas?: number; // horas de uso desde el último mantenimiento
}

// Elegidos para que las alertas muestren VENCIDO, PRÓXIMO y AL DÍA.
const PROGRAMAS: Record<string, DatosPrograma> = {
  compr1: { maquina: "compr1", descripcion: "Cambio de aceite y filtros del compresor", frecuencia_dias: 90, frecuencia_horas: 500, ultimoDias: 95, horasConsumidas: 410 },
  compr2: { maquina: "compr2", descripcion: "Mantenimiento preventivo general del compresor", frecuencia_dias: 120, ultimoDias: 115 },
  torno1: { maquina: "torno1", descripcion: "Lubricación y revisión de guías del torno", frecuencia_dias: 60, ultimoDias: 20 },
  comprDyd: { maquina: "comprDyd", descripcion: "Cambio de aceite y filtros del compresor propio", frecuencia_dias: 180, frecuencia_horas: 400, ultimoDias: 30, horasConsumidas: 120 },
  reductor: { maquina: "reductor", descripcion: "Cambio de aceite y revisión de sellos del reductor", frecuencia_dias: 180, ultimoDias: 185 },
  rectif: { maquina: "rectif", descripcion: "Calibración y balanceo de la piedra de rectificado", frecuencia_dias: 90, ultimoDias: 84 },
};

const ETAPAS = ["RECIBIDA", "EN_DIAGNOSTICO", "COTIZADA", "ASIGNADA", "EN_PROCESO", "FINALIZADA"] as const;
type Etapa = (typeof ETAPAS)[number];

type Linea =
  | { tipo: "SERVICIO"; descripcion: string; cantidad: number; precio_unitario: number }
  | { tipo: "MATERIAL"; material: string; cantidad: number };

interface Escenario {
  maquina: string;
  tipo: "CORRECTIVO" | "PREVENTIVO";
  prioridad: "ALTA" | "MEDIA" | "BAJA";
  descripcion: string;
  programa?: string;
  diasAtras: number;
  hasta: Etapa;
  cancelar?: boolean;
  tecnico: 0 | 1;
  diagnostico?: {
    estado_general: "BUENO" | "REGULAR" | "MALO" | "CRITICO";
    fallas_detectadas: string;
    observaciones?: string;
    recomendaciones?: string;
  };
  cotizacion?: { observaciones?: string; detalles: Linea[] };
  materialesUsados?: Array<{ material: string; cantidad: number }>;
  trabajo?: string;
}

const ESCENARIOS: Escenario[] = [
  {
    maquina: "fresa", tipo: "CORRECTIVO", prioridad: "BAJA", diasAtras: 50, hasta: "FINALIZADA", tecnico: 1,
    descripcion: "El cabezal produce golpeteo al trabajar con fresas de gran diámetro.",
    diagnostico: {
      estado_general: "BUENO",
      fallas_detectadas: "No se detectan fallas en el cabezal; el golpeteo se debe a una fresa mal sujeta en el portaherramientas.",
      observaciones: "Rodamientos y engranajes del cabezal en buen estado.",
      recomendaciones: "Verificar el ajuste del portaherramientas antes de cada turno.",
    },
    cotizacion: { detalles: [{ tipo: "SERVICIO", descripcion: "Revisión completa del cabezal y ajuste del portaherramientas", cantidad: 1, precio_unitario: 120 }] },
    trabajo: "Se ajustó el portaherramientas, se verificó el cabezal sin carga y se entregó la máquina en funcionamiento normal.",
  },
  {
    maquina: "torno1", tipo: "CORRECTIVO", prioridad: "ALTA", diasAtras: 40, hasta: "FINALIZADA", tecnico: 0,
    descripcion: "El husillo presenta vibración excesiva y ruido al trabajar a más de 800 rpm.",
    diagnostico: {
      estado_general: "MALO",
      fallas_detectadas: "Rodamientos del husillo con desgaste y juego axial de 0.12 mm.",
      observaciones: "Se encontró grasa degradada en la cámara del husillo.",
      recomendaciones: "Reemplazar los rodamientos y reajustar la precarga del husillo.",
    },
    cotizacion: {
      detalles: [
        { tipo: "SERVICIO", descripcion: "Desmontaje, reemplazo de rodamientos y ajuste del husillo", cantidad: 1, precio_unitario: 650 },
        { tipo: "MATERIAL", material: "rod6205", cantidad: 2 },
        { tipo: "MATERIAL", material: "grasa", cantidad: 1 },
      ],
    },
    materialesUsados: [{ material: "rod6205", cantidad: 2 }, { material: "grasa", cantidad: 1 }],
    trabajo: "Se reemplazaron los rodamientos del husillo, se renovó la grasa y se reajustó la precarga. Prueba a 1200 rpm sin vibración.",
  },
  {
    maquina: "torno1", tipo: "PREVENTIVO", prioridad: "MEDIA", diasAtras: 35, hasta: "FINALIZADA", tecnico: 1, programa: "torno1",
    descripcion: "Mantenimiento preventivo programado: lubricación y revisión de guías del torno.",
    diagnostico: {
      estado_general: "BUENO",
      fallas_detectadas: "Sin fallas. Guías con desgaste normal y lubricación por debajo del nivel recomendado.",
      recomendaciones: "Mantener el plan de lubricación cada 60 días.",
    },
    cotizacion: {
      detalles: [
        { tipo: "SERVICIO", descripcion: "Lubricación y revisión de guías", cantidad: 1, precio_unitario: 200 },
        { tipo: "MATERIAL", material: "grasa", cantidad: 1 },
      ],
    },
    materialesUsados: [{ material: "grasa", cantidad: 1 }],
    trabajo: "Se lubricaron guías y husillo, se verificó la holgura y se limpió el sistema de refrigeración.",
  },
  {
    maquina: "tornoDyd", tipo: "CORRECTIVO", prioridad: "BAJA", diasAtras: 30, hasta: "FINALIZADA", tecnico: 0,
    descripcion: "Ruido y salto de marchas en la caja de velocidades del torno propio.",
    diagnostico: {
      estado_general: "REGULAR",
      fallas_detectadas: "Engranaje intermedio con dientes desgastados y falta de lubricante en la caja.",
      recomendaciones: "Reemplazar el engranaje y renovar el lubricante.",
    },
    cotizacion: {
      detalles: [
        { tipo: "SERVICIO", descripcion: "Reparación de la caja de velocidades", cantidad: 1, precio_unitario: 850 },
        { tipo: "MATERIAL", material: "aceite", cantidad: 1 },
        { tipo: "MATERIAL", material: "rod6205", cantidad: 2 },
      ],
    },
    materialesUsados: [{ material: "aceite", cantidad: 1 }, { material: "rod6205", cantidad: 2 }],
    trabajo: "Se rectificó el engranaje intermedio, se cambiaron los rodamientos y se renovó el aceite de la caja.",
  },
  {
    maquina: "prensa", tipo: "CORRECTIVO", prioridad: "MEDIA", diasAtras: 25, hasta: "FINALIZADA", tecnico: 1,
    descripcion: "Pérdida de presión en el cilindro principal de la prensa hidráulica.",
    diagnostico: {
      estado_general: "MALO",
      fallas_detectadas: "Sello del vástago deteriorado y fuga de aceite hidráulico en el cilindro principal.",
      observaciones: "Vástago sin rayaduras profundas.",
      recomendaciones: "Reemplazar el sello y cambiar el aceite del circuito.",
    },
    cotizacion: {
      detalles: [
        { tipo: "SERVICIO", descripcion: "Desmontaje y reparación del cilindro principal", cantidad: 1, precio_unitario: 1200 },
        { tipo: "MATERIAL", material: "sello", cantidad: 1 },
        { tipo: "MATERIAL", material: "aceite", cantidad: 2 },
      ],
    },
    materialesUsados: [{ material: "sello", cantidad: 1 }, { material: "aceite", cantidad: 2 }],
    trabajo: "Se reemplazó el sello del vástago, se purgó el circuito y se repuso el aceite hidráulico. Prueba de presión satisfactoria.",
  },
  {
    maquina: "torno1", tipo: "CORRECTIVO", prioridad: "MEDIA", diasAtras: 22, hasta: "COTIZADA", cancelar: true, tecnico: 0,
    descripcion: "Cambio de portaherramientas dañado por una colisión.",
    diagnostico: {
      estado_general: "REGULAR",
      fallas_detectadas: "Portaherramientas con deformación en el alojamiento tras una colisión con la contrapunta.",
      observaciones: "Sin daños en el carro transversal.",
      recomendaciones: "Reemplazar el portaherramientas.",
    },
    cotizacion: {
      observaciones: "El cliente decidió posponer el trabajo.",
      detalles: [{ tipo: "SERVICIO", descripcion: "Suministro y montaje de portaherramientas", cantidad: 1, precio_unitario: 780 }],
    },
  },
  {
    maquina: "soldadora", tipo: "CORRECTIVO", prioridad: "BAJA", diasAtras: 18, hasta: "RECIBIDA", cancelar: true, tecnico: 1,
    descripcion: "Reemplazo del cable de masa y revisión de conectores de la soldadora.",
  },
  {
    maquina: "comprDyd", tipo: "PREVENTIVO", prioridad: "BAJA", diasAtras: 15, hasta: "FINALIZADA", tecnico: 0, programa: "comprDyd",
    descripcion: "Mantenimiento preventivo programado: cambio de aceite y filtros del compresor propio.",
    diagnostico: {
      estado_general: "BUENO",
      fallas_detectadas: "Sin fallas. Filtro de aire saturado y aceite próximo al límite de horas.",
      recomendaciones: "Cambiar aceite y filtro de aire según el plan.",
    },
    cotizacion: {
      detalles: [
        { tipo: "SERVICIO", descripcion: "Cambio de aceite y filtros", cantidad: 1, precio_unitario: 150 },
        { tipo: "MATERIAL", material: "aceite", cantidad: 1 },
        { tipo: "MATERIAL", material: "filtro", cantidad: 1 },
      ],
    },
    materialesUsados: [{ material: "aceite", cantidad: 1 }, { material: "filtro", cantidad: 1 }],
    trabajo: "Se cambió el aceite y el filtro de aire, y se verificó la presión de trabajo.",
  },
  {
    maquina: "fresa", tipo: "CORRECTIVO", prioridad: "MEDIA", diasAtras: 12, hasta: "EN_PROCESO", tecnico: 1,
    descripcion: "La mesa se traba en el eje X y deja marcas en las piezas.",
    diagnostico: {
      estado_general: "REGULAR",
      fallas_detectadas: "Guías del eje X con desgaste irregular y falta de lubricación en el tornillo de avance.",
      observaciones: "Holgura axial dentro de tolerancia.",
      recomendaciones: "Rectificar las guías y lubricar el tornillo de avance.",
    },
    cotizacion: {
      detalles: [
        { tipo: "SERVICIO", descripcion: "Rectificado de guías del eje X", cantidad: 1, precio_unitario: 480 },
        { tipo: "MATERIAL", material: "grasa", cantidad: 1 },
      ],
    },
    materialesUsados: [{ material: "grasa", cantidad: 1 }],
  },
  {
    maquina: "bomba", tipo: "CORRECTIVO", prioridad: "MEDIA", diasAtras: 6, hasta: "COTIZADA", tecnico: 0,
    descripcion: "Pérdida de caudal en la bomba hidráulica de la línea de prensado.",
    diagnostico: {
      estado_general: "MALO",
      fallas_detectadas: "Desgaste en el cuerpo de engranajes y bajo rendimiento volumétrico.",
      recomendaciones: "Reparar la bomba y renovar el aceite del circuito.",
    },
    cotizacion: {
      detalles: [
        { tipo: "SERVICIO", descripcion: "Reparación de bomba hidráulica", cantidad: 1, precio_unitario: 750 },
        { tipo: "MATERIAL", material: "aceite", cantidad: 3 },
      ],
    },
  },
  {
    maquina: "compr1", tipo: "CORRECTIVO", prioridad: "ALTA", diasAtras: 5, hasta: "ASIGNADA", tecnico: 1,
    descripcion: "Fuga de aceite por el sello del eje y caída de presión en el compresor.",
    diagnostico: {
      estado_general: "CRITICO",
      fallas_detectadas: "Sello del eje deteriorado con pérdida continua de aceite; riesgo de daño en el elemento compresor.",
      observaciones: "Se recomienda detener el equipo hasta realizar la reparación.",
      recomendaciones: "Reemplazar el sello mecánico y reponer el aceite.",
    },
    cotizacion: {
      detalles: [
        { tipo: "SERVICIO", descripcion: "Cambio de sello mecánico del eje", cantidad: 1, precio_unitario: 900 },
        { tipo: "MATERIAL", material: "sello", cantidad: 1 },
        { tipo: "MATERIAL", material: "aceite", cantidad: 2 },
      ],
    },
  },
  {
    maquina: "reductor", tipo: "PREVENTIVO", prioridad: "MEDIA", diasAtras: 3, hasta: "COTIZADA", tecnico: 0, programa: "reductor",
    descripcion: "Mantenimiento preventivo programado: cambio de aceite y revisión de sellos del reductor.",
    diagnostico: {
      estado_general: "REGULAR",
      fallas_detectadas: "Aceite oxidado y sello de salida con filtración leve.",
      recomendaciones: "Cambiar el aceite y reemplazar el sello de salida.",
    },
    cotizacion: {
      detalles: [
        { tipo: "SERVICIO", descripcion: "Cambio de aceite y sellos del reductor", cantidad: 1, precio_unitario: 620 },
        { tipo: "MATERIAL", material: "grasa", cantidad: 2 },
        { tipo: "MATERIAL", material: "sello", cantidad: 1 },
      ],
    },
  },
  {
    maquina: "compr2", tipo: "CORRECTIVO", prioridad: "ALTA", diasAtras: 2, hasta: "EN_DIAGNOSTICO", tecnico: 1,
    descripcion: "Sobrecalentamiento del compresor tras dos horas de operación continua.",
    diagnostico: {
      estado_general: "REGULAR",
      fallas_detectadas: "Radiador de aceite parcialmente obstruido y filtro de aire saturado.",
      recomendaciones: "Limpiar el radiador y cambiar el filtro de aire.",
    },
  },
  {
    maquina: "rectif", tipo: "CORRECTIVO", prioridad: "MEDIA", diasAtras: 1, hasta: "RECIBIDA", tecnico: 0,
    descripcion: "Acabado superficial irregular en piezas cilíndricas rectificadas.",
  },
  {
    maquina: "compr1", tipo: "PREVENTIVO", prioridad: "ALTA", diasAtras: 1, hasta: "RECIBIDA", tecnico: 1, programa: "compr1",
    descripcion: "Mantenimiento preventivo programado: cambio de aceite y filtros del compresor.",
  },
  {
    maquina: "reductor", tipo: "CORRECTIVO", prioridad: "ALTA", diasAtras: 0, hasta: "RECIBIDA", tecnico: 0,
    descripcion: "Ruido metálico y temperatura elevada en el reductor del molino.",
  },
];

// ───────────────────────────── Pasos ─────────────────────────────

async function limpiarDatos(): Promise<void> {
  // Orden de borrado: primero lo que depende de otras tablas. Los usuarios no se tocan.
  await prisma.$transaction([
    prisma.movimientoInventario.deleteMany(),
    prisma.ordenMaterial.deleteMany(),
    prisma.adjunto.deleteMany(),
    prisma.ordenTrabajo.deleteMany(),
    prisma.cotizacionDetalle.deleteMany(),
    prisma.cotizacion.deleteMany(),
    prisma.diagnostico.deleteMany(),
    prisma.alertaPreventiva.deleteMany(),
    prisma.solicitud.deleteMany(),
    prisma.registroUso.deleteMany(),
    prisma.programacionPreventiva.deleteMany(),
    prisma.maquina.deleteMany(),
    prisma.material.deleteMany(),
    prisma.cliente.deleteMany(),
  ]);

  // Si los códigos (SOL-2026-00001...) salen de secuencias de PostgreSQL, se reinician para
  // que los datos de demostración empiecen en 00001.
  const secuencias = await prisma.$queryRaw<Array<{ sequencename: string }>>`
    SELECT sequencename FROM pg_sequences WHERE schemaname = 'public'
  `;
  const reiniciadas: string[] = [];

  for (const { sequencename } of secuencias) {
    if (/solicitud|cotizacion|orden/i.test(sequencename)) {
      await prisma.$executeRawUnsafe(`ALTER SEQUENCE "${sequencename}" RESTART WITH 1`);
      reiniciadas.push(sequencename);
    }
  }

  console.log(
    reiniciadas.length
      ? `  Secuencias de códigos reiniciadas: ${reiniciadas.join(", ")}`
      : "  (No se encontraron secuencias de códigos que reiniciar)",
  );
}

// La API pone la fecha de hoy a todo; aquí se reparten en los últimos días para las capturas.
async function ajustarFechas(idSolicitud: string, diasAtras: number): Promise<void> {
  const ahora = Date.now();
  const fecha = (despuesDeDias: number) =>
    new Date(Math.min(ahora - 60_000, ahora - (diasAtras - despuesDeDias) * DIA));

  await prisma.solicitud.update({ where: { id_solicitud: idSolicitud }, data: { fecha_recepcion: fecha(0) } });
  await prisma.diagnostico.updateMany({ where: { id_solicitud: idSolicitud }, data: { fecha: fecha(1) } });
  await prisma.cotizacion.updateMany({ where: { id_solicitud: idSolicitud }, data: { fecha: fecha(2) } });
  await prisma.ordenTrabajo.updateMany({ where: { id_solicitud: idSolicitud }, data: { creado_en: fecha(3) } });
  await prisma.ordenTrabajo.updateMany({
    where: { id_solicitud: idSolicitud, fecha_inicio: { not: null } },
    data: { fecha_inicio: fecha(4) },
  });
  await prisma.ordenTrabajo.updateMany({
    where: { id_solicitud: idSolicitud, fecha_fin: { not: null } },
    data: { fecha_fin: fecha(6) },
  });
}

async function main(): Promise<void> {
  const emailAdmin = exigirEnv("DEMO_ADMIN_EMAIL");
  const passAdmin = exigirEnv("DEMO_ADMIN_PASSWORD");
  const passTecnico = exigirEnv("DEMO_TECNICO_PASSWORD");

  console.log(`API: ${API}\n`);

  const admin = new Sesion("admin");
  const usuarioAdmin = await admin.login(emailAdmin, passAdmin);

  if (usuarioAdmin.rol !== "ADMINISTRADOR") {
    throw new Error(`${emailAdmin} no es administrador. Usa un usuario con rol ADMINISTRADOR.`);
  }

  // Comprobación previa: si alguna ruta no responde, se detiene ANTES de borrar nada.
  for (const ruta of ["/clientes", "/maquinas", "/materiales", "/solicitudes", "/diagnosticos", "/cotizaciones", "/ordenes", "/preventivos", "/uso", "/usuarios"]) {
    await admin.pedir("GET", ruta);
  }
  console.log("✔ Sesión de administrador iniciada y rutas de la API verificadas\n");

  const lector = createInterface({ input: process.stdin, output: process.stdout });
  const respuesta = await lector.question(
    "Esto BORRARÁ clientes, máquinas, solicitudes, órdenes, materiales y demás datos de prueba\n" +
      "(los usuarios se conservan). ¿Hiciste el respaldo? Escribe BORRAR para continuar: ",
  );
  lector.close();

  if (respuesta.trim() !== "BORRAR") {
    console.log("Cancelado. No se modificó nada.");
    return;
  }

  console.log("\n→ Limpiando datos de prueba...");
  await limpiarDatos();

  // ── Técnicos de demostración ──
  console.log("→ Creando técnicos de demostración...");
  const tecnicos: Array<{ sesion: Sesion; id: string }> = [];

  for (const t of TECNICOS) {
    await admin.pedir("POST", "/usuarios", { ...t, password: passTecnico, rol: "TECNICO" }, [409]);
    const sesion = new Sesion(`${t.nombres} ${t.apellidos}`);
    const usuario = await sesion.login(t.email, passTecnico);
    tecnicos.push({ sesion, id: usuario.id_usuario });
  }

  // ── Clientes ──
  console.log("→ Creando clientes...");
  const idClientes = new Map<string, string>();

  for (const { clave, ...datos } of CLIENTES) {
    const r = await admin.pedir("POST", "/clientes", datos);
    idClientes.set(clave, r.cliente.id_cliente);
  }

  // ── Máquinas ──
  console.log("→ Creando máquinas...");
  const idMaquinas = new Map<string, string>();

  for (const { clave, cliente, ...datos } of MAQUINAS) {
    const cuerpo = cliente
      ? { ...datos, id_cliente: ident(idClientes, cliente) }
      : { ...datos, es_propia: true };
    const r = await admin.pedir("POST", "/maquinas", cuerpo);
    idMaquinas.set(clave, r.maquina.id_maquina);
  }

  // ── Materiales y stock inicial ──
  console.log("→ Creando materiales e inventario...");
  const idMateriales = new Map<string, string>();

  for (const { clave, stock, ...datos } of MATERIALES) {
    const r = await admin.pedir("POST", "/materiales", datos);
    const id: string = r.material.id_material;
    idMateriales.set(clave, id);
    await admin.pedir("POST", `/materiales/${id}/movimientos`, {
      tipo: "ENTRADA",
      cantidad: stock,
      motivo: "Compra inicial de almacén",
    });
  }

  // ── Registros de uso ──
  console.log("→ Registrando horas de uso...");

  for (const { maquina, horas } of USO) {
    for (const [i, h] of horas.entries()) {
      await admin.pedir("POST", "/uso", {
        id_maquina: ident(idMaquinas, maquina),
        horas: h,
        fecha: fechaISO(i + 1),
      });
    }
  }

  // ── Programaciones preventivas ──
  console.log("→ Creando programaciones preventivas...");
  const idProgramas = new Map<string, string>();

  for (const [clave, p] of Object.entries(PROGRAMAS)) {
    const idMaquina = ident(idMaquinas, p.maquina);
    const actual = await admin.pedir("GET", `/maquinas/${idMaquina}`);
    const horasActuales = Number(actual.maquina.horas_uso);

    const r = await admin.pedir("POST", "/preventivos", {
      id_maquina: idMaquina,
      descripcion: p.descripcion,
      ...(p.frecuencia_dias ? { frecuencia_dias: p.frecuencia_dias } : {}),
      ...(p.frecuencia_horas ? { frecuencia_horas: p.frecuencia_horas } : {}),
      fecha_ultimo_mant: fechaISO(p.ultimoDias),
      ...(p.horasConsumidas !== undefined
        ? { horas_ultimo_mant: Math.max(0, horasActuales - p.horasConsumidas), horas_aviso: 25 }
        : {}),
    });
    idProgramas.set(clave, r.preventivo.id_programacion);
  }

  // ── Solicitudes: de la más antigua a la más reciente, para que los códigos queden en orden ──
  console.log("→ Creando solicitudes, diagnósticos, cotizaciones y órdenes...");
  const ordenados = [...ESCENARIOS].sort((a, b) => b.diasAtras - a.diasAtras);

  for (const e of ordenados) {
    const nivel = ETAPAS.indexOf(e.hasta);
    const llega = (etapa: Etapa) => nivel >= ETAPAS.indexOf(etapa);
    const tecnico = tecnicos[e.tecnico];
    if (!tecnico) throw new Error("Falta el técnico de demostración");

    const creada = await admin.pedir("POST", "/solicitudes", {
      id_maquina: ident(idMaquinas, e.maquina),
      tipo_servicio: e.tipo,
      descripcion: e.descripcion,
      prioridad: e.prioridad,
      ...(e.programa ? { id_programacion: ident(idProgramas, e.programa) } : {}),
    });
    const idSolicitud: string = creada.solicitud.id_solicitud;
    const codigo: string = creada.solicitud.codigo;

    if (llega("EN_DIAGNOSTICO")) {
      if (!e.diagnostico) throw new Error(`Falta el diagnóstico en: ${e.descripcion}`);
      await tecnico.sesion.pedir("POST", "/diagnosticos", { id_solicitud: idSolicitud, ...e.diagnostico });
    }

    if (llega("COTIZADA")) {
      if (!e.cotizacion) throw new Error(`Falta la cotización en: ${e.descripcion}`);
      await admin.pedir("POST", "/cotizaciones", {
        id_solicitud: idSolicitud,
        observaciones: e.cotizacion.observaciones,
        detalles: e.cotizacion.detalles.map((l) =>
          l.tipo === "SERVICIO"
            ? l
            : { tipo: "MATERIAL", id_material: ident(idMateriales, l.material), cantidad: l.cantidad },
        ),
      });
    }

    let idOrden = "";

    if (llega("ASIGNADA")) {
      const orden = await admin.pedir("POST", "/ordenes", {
        id_solicitud: idSolicitud,
        id_tecnico: tecnico.id,
      });
      idOrden = orden.orden.id_orden_trabajo;
    }

    if (llega("EN_PROCESO")) {
      await tecnico.sesion.pedir("POST", `/ordenes/${idOrden}/iniciar`, {});

      for (const m of e.materialesUsados ?? []) {
        await tecnico.sesion.pedir("POST", `/ordenes/${idOrden}/materiales`, {
          id_material: ident(idMateriales, m.material),
          cantidad: m.cantidad,
        });
      }
    }

    if (llega("FINALIZADA")) {
      if (!e.trabajo) throw new Error(`Falta el trabajo realizado en: ${e.descripcion}`);
      await tecnico.sesion.pedir("POST", `/ordenes/${idOrden}/finalizar`, {
        trabajo_realizado: e.trabajo,
      });
    }

    if (e.cancelar) {
      await admin.pedir("POST", `/solicitudes/${idSolicitud}/cancelar`, {});
    }

    await ajustarFechas(idSolicitud, e.diasAtras);
    console.log(`  ${codigo}  ${e.hasta}${e.cancelar ? " → CANCELADA" : ""}  (${e.descripcion.slice(0, 50)}...)`);
  }

  // ── Resumen ──
  const [clientes, maquinas, materiales, solicitudes, ordenes] = await Promise.all([
    prisma.cliente.count(),
    prisma.maquina.count(),
    prisma.material.count(),
    prisma.solicitud.count(),
    prisma.ordenTrabajo.count(),
  ]);

  console.log("\n✔ Datos de demostración cargados");
  console.log(`  ${clientes} clientes · ${maquinas} máquinas · ${materiales} materiales`);
  console.log(`  ${solicitudes} solicitudes · ${ordenes} órdenes · ${Object.keys(PROGRAMAS).length} programaciones preventivas`);
  console.log(`\nTécnicos de demostración (contraseña: la que pusiste en DEMO_TECNICO_PASSWORD):`);
  for (const t of TECNICOS) console.log(`  ${t.nombres} ${t.apellidos} — ${t.email}`);
}

main()
  .catch((error: unknown) => {
    console.error("\n✖ El seed se detuvo:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());