/**
 * Seed de datos de demostración completos — DYD E.I.R.L.
 *
 * Qué crea (directo a BD con Prisma, sin API):
 *   - 6 clientes reales
 *   - 11 máquinas (8 de clientes + 3 propias de DYD)
 *   - 10 materiales con stock inicial y movimientos de entrada
 *   - 8 programaciones preventivas con fechas escalonadas
 *   - 8 registros de uso (últimos 4 días por máquina)
 *   - 2 técnicos de demostración adicionales
 *   - 18 solicitudes con flujo completo en diferentes estados
 *
 * Variables de entorno necesarias:
 *   DEMO_TECNICO_PASSWORD  contraseña (mínimo 8 caracteres) para los técnicos demo
 *
 * Uso (desde backend, con Postgres encendido):
 *   npx tsx prisma/seedDataDyD.ts
 */
import { prisma } from "../src/lib/prisma.js";
import { hashPassword } from "../src/lib/passwords.js";

const DIA = 24 * 60 * 60 * 1000;

function exigirEnv(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    console.error(`✖ Falta la variable de entorno ${nombre}.`);
    process.exit(1);
  }
  return valor;
}

function fechaISO(diasAtras: number): string {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function fechaDate(diasAtras: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ───────────────────────────── Datos ─────────────────────────────

const TECNICOS_DEMO = [
  { nombres: "Jorge", apellidos: "Huamán Quispe", email: "jhuaman@dyd.pe" },
  { nombres: "Luis", apellidos: "Ccori Rojas", email: "lccori@dyd.pe" },
] as const;

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
  {
    clave: "textiles",
    razon_social: "Textiles del Norte S.A.C.",
    ruc_dni: "20345678912",
    contacto: "Ing. María Quispe",
    telefono: "933 221 445",
    email: "mantenimiento@textilesnorte.pe",
    direccion: "Av. Industrial 450, Los Olivos, Lima",
  },
] as const;

interface DatosMaquina {
  clave: string;
  cliente?: string; // sin cliente = máquina propia de DYD
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
  { clave: "extrusora", cliente: "textiles", codigo: "MAQ-009", nombre: "Extrusora de filamentos", tipo: "Extrusora", marca: "Reifenhäuser", modelo: "EVO Ultra", nro_serie: "RH-99201", horas_uso: 15600, estado: "OPERATIVA" },
  // Máquinas propias de DYD
  { clave: "tornoDyd", codigo: "MAQ-010", nombre: "Torno paralelo propio", tipo: "Torno", marca: "Colchester", modelo: "Master 2500", nro_serie: "CO-20871", horas_uso: 9100, estado: "OPERATIVA" },
  { clave: "comprDyd", codigo: "MAQ-011", nombre: "Compresor propio", tipo: "Compresor", marca: "Atlas Copco", modelo: "GA 11", nro_serie: "AC-114502", horas_uso: 3300, estado: "OPERATIVA" },
  { clave: "soldadora", codigo: "MAQ-012", nombre: "Soldadora inverter propia", tipo: "Soldadora", marca: "Lincoln Electric", modelo: "Invertec V350", nro_serie: "LE-770341", horas_uso: 1850, estado: "OPERATIVA" },
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
] as const;

// Horas de uso diarias registradas en los últimos 4 días (la más reciente primero).
const USO = [
  { maquina: "torno1", horas: [7.5, 8, 6.5, 7] },
  { maquina: "fresa", horas: [6, 5.5, 7, 6.5] },
  { maquina: "compr1", horas: [16, 18, 17.5, 16] },
  { maquina: "compr2", horas: [9, 8.5, 10, 9.5] },
  { maquina: "rectif", horas: [5, 6.5, 6, 5.5] },
  { maquina: "reductor", horas: [20, 21, 20.5, 22] },
  { maquina: "comprDyd", horas: [4, 3.5, 5, 4.5] },
  { maquina: "tornoDyd", horas: [6, 7, 5.5, 6.5] },
] as const;

interface DatosPrograma {
  maquina: string;
  descripcion: string;
  frecuencia_dias?: number;
  frecuencia_horas?: number;
  ultimoDias: number;
  horasConsumidas?: number;
}

const PROGRAMAS: Record<string, DatosPrograma> = {
  compr1: { maquina: "compr1", descripcion: "Cambio de aceite y filtros del compresor", frecuencia_dias: 90, frecuencia_horas: 500, ultimoDias: 95, horasConsumidas: 410 },
  compr2: { maquina: "compr2", descripcion: "Mantenimiento preventivo general del compresor", frecuencia_dias: 120, ultimoDias: 115 },
  torno1: { maquina: "torno1", descripcion: "Lubricación y revisión de guías del torno", frecuencia_dias: 60, ultimoDias: 20 },
  comprDyd: { maquina: "comprDyd", descripcion: "Cambio de aceite y filtros del compresor propio", frecuencia_dias: 180, frecuencia_horas: 400, ultimoDias: 30, horasConsumidas: 120 },
  reductor: { maquina: "reductor", descripcion: "Cambio de aceite y revisión de sellos del reductor", frecuencia_dias: 180, ultimoDias: 185 },
  rectif: { maquina: "rectif", descripcion: "Calibración y balanceo de la piedra de rectificado", frecuencia_dias: 90, ultimoDias: 84 },
  extrusora: { maquina: "extrusora", descripcion: "Mantenimiento preventivo de la extrusora (limpieza y calibración)", frecuencia_dias: 120, frecuencia_horas: 800, ultimoDias: 110, horasConsumidas: 650 },
  bomba: { maquina: "bomba", descripcion: "Revisión de sellos y cambio de aceite de la bomba hidráulica", frecuencia_dias: 90, ultimoDias: 88 },
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

// ───────────────────────────── Main ─────────────────────────────

async function main(): Promise<void> {
  const passTecnico = exigirEnv("DEMO_TECNICO_PASSWORD");
  const tecnicoHash = await hashPassword(passTecnico);

  console.log("🌱 Seed DYD — Cargando datos de demostración...\n");

  // ── Técnicos de demostración ──
  console.log("→ Creando técnicos de demostración...");
  const idTecnicos = new Map<string, string>();

  for (const t of TECNICOS_DEMO) {
    const u = await prisma.usuario.upsert({
      where: { email: t.email },
      update: {
        password_hash: tecnicoHash,
        rol: "TECNICO",
        activo: true,
        nombres: t.nombres,
        apellidos: t.apellidos,
      },
      create: {
        nombres: t.nombres,
        apellidos: t.apellidos,
        email: t.email,
        password_hash: tecnicoHash,
        rol: "TECNICO",
      },
    });
    idTecnicos.set(t.email, u.id_usuario);
  }
  console.log(`  ${TECNICOS_DEMO.length} técnicos listos\n`);

  // ── Clientes ──
  console.log("→ Creando clientes...");
  const idClientes = new Map<string, string>();

  for (const { clave, ...datos } of CLIENTES) {
    const c = await prisma.cliente.upsert({
      where: { email: datos.email },
      update: { ...datos, activo: true },
      create: { ...datos, activo: true },
    });
    idClientes.set(clave, c.id_cliente);
  }
  console.log(`  ${CLIENTES.length} clientes listos\n`);

  // ── Máquinas ──
  console.log("→ Creando máquinas...");
  const idMaquinas = new Map<string, string>();

  for (const { clave, cliente, ...datos } of MAQUINAS) {
    const m = await prisma.maquina.upsert({
      where: { codigo: datos.codigo },
      update: { ...datos, ...(cliente ? { id_cliente: idClientes.get(cliente)! } : { es_propia: true }) },
      create: { ...datos, ...(cliente ? { id_cliente: idClientes.get(cliente)! } : { es_propia: true }) },
    });
    idMaquinas.set(clave, m.id_maquina);
  }
  console.log(`  ${MAQUINAS.length} máquinas listas\n`);

  // ── Usuario admin para movimientos y registros ──
  const adminUser = await prisma.usuario.findFirst({ where: { rol: "ADMINISTRADOR" } });
  if (!adminUser) throw new Error("No se encontró usuario administrador");
  const idUsuarioAdmin = adminUser.id_usuario;

  // ── Materiales y stock inicial ──
  console.log("→ Creando materiales e inventario...");
  const idMateriales = new Map<string, string>();

  for (const { clave, stock, ...datos } of MATERIALES) {
    const mat = await prisma.material.upsert({
      where: { codigo: datos.codigo },
      update: { ...datos },
      create: { ...datos },
    });
    idMateriales.set(clave, mat.id_material);

    // Movimiento de entrada inicial
    await prisma.movimientoInventario.create({
      data: {
        id_material: mat.id_material,
        id_usuario: idUsuarioAdmin,
        tipo: "ENTRADA",
        cantidad: stock,
        motivo: "Compra inicial de almacén",
      },
    });
  }
  console.log(`  ${MATERIALES.length} materiales con stock inicial\n`);

  // ── Registros de uso ──
  console.log("→ Registrando horas de uso...");

  for (const { maquina, horas } of USO) {
    const idMaq = idMaquinas.get(maquina);
    if (!idMaq) continue;

    for (const [i, h] of horas.entries()) {
      await prisma.registroUso.create({
        data: {
          id_maquina: idMaq,
          id_usuario_registrado: idUsuarioAdmin,
          horas: h,
          fecha: fechaDate(i + 1),
        },
      });
    }
  }
  console.log(`  Registros de uso para ${USO.length} máquinas (4 días cada una)\n`);

  // ── Programaciones preventivas ──
  console.log("→ Creando programaciones preventivas...");
  const idProgramas = new Map<string, string>();

  for (const [clave, p] of Object.entries(PROGRAMAS)) {
    const idMaq = idMaquinas.get(p.maquina);
    if (!idMaq) continue;

    const maquinaActual = await prisma.maquina.findUnique({ where: { id_maquina: idMaq } });
    const horasActuales = Number(maquinaActual?.horas_uso ?? 0);

    const prog = await prisma.programacionPreventiva.create({
      data: {
        id_maquina: idMaq,
        descripcion: p.descripcion,
        frecuencia_dias: p.frecuencia_dias ?? null,
        frecuencia_horas: p.frecuencia_horas ?? null,
        fecha_ultimo_mant: fechaDate(p.ultimoDias),
        horas_ultimo_mant: p.horasConsumidas !== undefined ? Math.max(0, horasActuales - p.horasConsumidas) : null,
        horas_aviso: 25,
        activo: true,
      },
    });
    idProgramas.set(clave, prog.id_programacion);
  }
  console.log(`  ${Object.keys(PROGRAMAS).length} programaciones preventivas\n`);

  // ── Solicitudes con flujo completo ──
  console.log("→ Creando solicitudes, diagnósticos, cotizaciones y órdenes...\n");

  // Ordenar de más antigua a más reciente para que los códigos queden en orden
  const ordenados = [...ESCENARIOS].sort((a, b) => b.diasAtras - a.diasAtras);

  for (const e of ordenados) {
    const nivel = ETAPAS.indexOf(e.hasta);
    const llega = (etapa: Etapa) => nivel >= ETAPAS.indexOf(etapa);
    const idTecnico = idTecnicos.get(TECNICOS_DEMO[e.tecnico].email);
    if (!idTecnico) throw new Error(`Falta técnico ${e.tecnico}`);

    // Crear solicitud
    const solicitud = await prisma.solicitud.create({
      data: {
        id_maquina: idMaquinas.get(e.maquina)!,
        id_usuario_registrado: idUsuarioAdmin,
        tipo_servicio: e.tipo,
        descripcion: e.descripcion,
        prioridad: e.prioridad,
        estado: "RECIBIDA",
        id_programacion: e.programa ? idProgramas.get(e.programa) : null,
      },
    });

    const codigo = solicitud.codigo;

    let idDiagnostico = "";

    // Diagnóstico
    if (llega("EN_DIAGNOSTICO") && e.diagnostico) {
      const diagnostico = await prisma.diagnostico.create({
        data: {
          id_solicitud: solicitud.id_solicitud,
          id_maquina: idMaquinas.get(e.maquina)!,
          id_tecnico: idTecnico,
          estado_general: e.diagnostico.estado_general,
          fallas_detectadas: e.diagnostico.fallas_detectadas,
          observaciones: e.diagnostico.observaciones ?? null,
          recomendaciones: e.diagnostico.recomendaciones ?? null,
        },
      });
      idDiagnostico = diagnostico.id_diagnostico;
      await prisma.solicitud.update({
        where: { id_solicitud: solicitud.id_solicitud },
        data: { estado: "EN_DIAGNOSTICO" },
      });
    }

    // Cotización
    if (llega("COTIZADA") && e.cotizacion) {
      await prisma.cotizacion.create({
        data: {
          id_solicitud: solicitud.id_solicitud,
          id_usuario: idUsuarioAdmin,
          observaciones: e.cotizacion.observaciones ?? null,
          detalles: {
            create: e.cotizacion.detalles.map((l, idx) =>
              l.tipo === "SERVICIO"
                ? {
                    tipo: "SERVICIO",
                    descripcion: l.descripcion,
                    cantidad: l.cantidad,
                    precio_unitario: l.precio_unitario,
                  }
                : {
                    tipo: "MATERIAL",
                    descripcion: MATERIALES.find((m) => m.clave === l.material)?.nombre ?? l.material,
                    id_material: idMateriales.get(l.material)!,
                    cantidad: l.cantidad,
                    precio_unitario: MATERIALES.find((m) => m.clave === l.material)?.precio_unitario ?? 0,
                  },
            ),
          },
        },
      });
      await prisma.solicitud.update({
        where: { id_solicitud: solicitud.id_solicitud },
        data: { estado: "COTIZADA" },
      });
    }

    let idOrden = "";

    // Orden de trabajo
    if (llega("ASIGNADA")) {
      const orden = await prisma.ordenTrabajo.create({
        data: {
          id_solicitud: solicitud.id_solicitud,
          id_diagnostico: idDiagnostico,
          id_tecnico: idTecnico,
          estado: "PENDIENTE",
        },
      });
      idOrden = orden.id_orden_trabajo;
      await prisma.solicitud.update({
        where: { id_solicitud: solicitud.id_solicitud },
        data: { estado: "ASIGNADA" },
      });
    }

    // Iniciar orden
    if (llega("EN_PROCESO") && idOrden) {
      await prisma.ordenTrabajo.update({
        where: { id_orden_trabajo: idOrden },
        data: { estado: "EN_PROCESO", fecha_inicio: new Date() },
      });
      await prisma.solicitud.update({
        where: { id_solicitud: solicitud.id_solicitud },
        data: { estado: "EN_PROCESO" },
      });

      for (const m of e.materialesUsados ?? []) {
        await prisma.ordenMaterial.create({
          data: {
            id_orden_trabajo: idOrden,
            id_material: idMateriales.get(m.material)!,
            cantidad: m.cantidad,
          },
        });
        // Movimiento de salida
        await prisma.movimientoInventario.create({
          data: {
            id_material: idMateriales.get(m.material)!,
            id_usuario: idTecnico,
            tipo: "SALIDA",
            cantidad: m.cantidad,
            motivo: `Consumo en OT-${idOrden.slice(-6)}`,
          },
        });
      }
    }

    // Finalizar orden
    if (llega("FINALIZADA") && idOrden && e.trabajo) {
      await prisma.ordenTrabajo.update({
        where: { id_orden_trabajo: idOrden },
        data: {
          estado: "FINALIZADA",
          trabajo_realizado: e.trabajo,
          fecha_fin: new Date(),
        },
      });
      await prisma.solicitud.update({
        where: { id_solicitud: solicitud.id_solicitud },
        data: { estado: "FINALIZADA" },
      });
    }

    // Cancelar
    if (e.cancelar) {
      await prisma.solicitud.update({
        where: { id_solicitud: solicitud.id_solicitud },
        data: { estado: "CANCELADA" },
      });
    }

    // Ajustar fechas para que se vean escalonadas en las capturas
    const ahora = Date.now();
    const fecha = (despuesDeDias: number) =>
      new Date(Math.min(ahora - 60_000, ahora - (e.diasAtras - despuesDeDias) * DIA));

    await prisma.solicitud.update({
      where: { id_solicitud: solicitud.id_solicitud },
      data: { fecha_recepcion: fecha(0) },
    });

    if (e.diagnostico) {
      await prisma.diagnostico.updateMany({
        where: { id_solicitud: solicitud.id_solicitud },
        data: { fecha: fecha(1) },
      });
    }
    if (e.cotizacion) {
      await prisma.cotizacion.updateMany({
        where: { id_solicitud: solicitud.id_solicitud },
        data: { fecha: fecha(2) },
      });
    }
    if (idOrden) {
      await prisma.ordenTrabajo.updateMany({
        where: { id_solicitud: solicitud.id_solicitud },
        data: { creado_en: fecha(3) },
      });
      await prisma.ordenTrabajo.updateMany({
        where: { id_solicitud: solicitud.id_solicitud, fecha_inicio: { not: null } },
        data: { fecha_inicio: fecha(4) },
      });
      await prisma.ordenTrabajo.updateMany({
        where: { id_solicitud: solicitud.id_solicitud, fecha_fin: { not: null } },
        data: { fecha_fin: fecha(6) },
      });
    }

    console.log(`  ${codigo}  ${e.hasta}${e.cancelar ? " → CANCELADA" : ""}  (${e.descripcion.slice(0, 55)}...)`);
  }

  // ── Resumen ──
  const [clientes, maquinas, materiales, solicitudes, ordenes, preventivos] = await Promise.all([
    prisma.cliente.count(),
    prisma.maquina.count(),
    prisma.material.count(),
    prisma.solicitud.count(),
    prisma.ordenTrabajo.count(),
    prisma.programacionPreventiva.count(),
  ]);

  console.log("\n✔ Datos de demostración DYD cargados completamente");
  console.log(`  ${clientes} clientes · ${maquinas} máquinas · ${materiales} materiales`);
  console.log(`  ${solicitudes} solicitudes · ${ordenes} órdenes · ${preventivos} programaciones preventivas`);
  console.log(`\nTécnicos de demostración (contraseña: ${passTecnico}):`);
  for (const t of TECNICOS_DEMO) console.log(`  ${t.nombres} ${t.apellidos} — ${t.email}`);
}

async function run() {
  try {
    await main();
  } catch (error: unknown) {
    console.error("\n✖ El seed se detuvo:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

run();
