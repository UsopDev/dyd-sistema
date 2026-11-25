import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  Factory,
  Gauge,
  Mail,
  MapPin,
  Phone,
  Ruler,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useStaffAuth } from "@/features/auth/staff-auth";

const SERVICIOS = [
  {
    icono: Wrench,
    titulo: "Mantenimiento industrial",
    descripcion:
      "Planes preventivos, correctivos y predictivos que mantienen sus líneas de producción en marcha.",
  },
  {
    icono: Gauge,
    titulo: "Rectificación de motores",
    descripcion:
      "Rectificado de cigüeñales, bloques, culatas y ejes con control dimensional en taller propio.",
  },
  {
    icono: Sparkles,
    titulo: "Soldadura especial",
    descripcion:
      "Soldadura TIG, MIG y de electrodo sobre aceros y aleaciones industriales de alta resistencia.",
  },
  {
    icono: Ruler,
    titulo: "Fabricación de repuestos",
    descripcion:
      "Mecanizado de piezas de repuesto a medida, reproduce o mejora el componente original.",
  },
  {
    icono: CalendarClock,
    titulo: "Mantenimiento CNC",
    descripcion:
      "Servicio especializado en máquinas de control numérico computarizado y sus sistemas.",
  },
  {
    icono: ClipboardCheck,
    titulo: "Diagnóstico en sitio",
    descripcion:
      "Evaluación técnica de la falla en planta o taller, con falla detectada y recomendación de acción.",
  },
] as const;

const PILARES = [
  {
    icono: Factory,
    titulo: "10+ años en el sector",
    descripcion:
      "Más de una década de trabajo metalmecánico en el Callao, con clientes del sector manufacturero.",
  },
  {
    icono: ShieldCheck,
    titulo: "Calidad y compromiso",
    descripcion:
      "Cada trabajo sale documentado: diagnóstico, cotización, orden de trabajo e informe de servicio.",
  },
  {
    icono: Gauge,
    titulo: "Respuesta con criterio",
    descripcion:
      "La prioridad de cada atención se define con el estado real del equipo, no con improvisación.",
  },
] as const;

export function PublicLandingPage() {
  const { usuario, cargando } = useStaffAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!cargando && usuario) {
      navigate(usuario.rol === "ADMINISTRADOR" ? "/admin" : "/tecnico", { replace: true });
    }
  }, [usuario, cargando, navigate]);

  return (
    <div className="min-h-screen bg-[#f4f8ff]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/60 bg-[#f4f8ff]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="#inicio" className="shrink-0">
            <Logo />
          </a>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#servicios" className="transition-colors hover:text-slate-900">
              Servicios
            </a>
            <a href="#empresa" className="transition-colors hover:text-slate-900">
              La empresa
            </a>
            <a href="#contacto" className="transition-colors hover:text-slate-900">
              Contacto
            </a>
          </nav>
          <Button size="sm" asChild>
            <Link to="/login">
              Ingresar
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section id="inicio" className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_500px_at_12%_-10%,rgba(37,99,235,0.18),transparent_60%),radial-gradient(700px_420px_at_92%_8%,rgba(56,189,248,0.20),transparent_62%)]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-28 lg:pt-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/70 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 backdrop-blur">
              <MapPin className="h-3.5 w-3.5" />
              Callao, Perú · Desde hace más de 10 años
            </span>

            <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Mantenimiento y rectificación de{" "}
              <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                maquinaria industrial
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Soldaduras Especiales y Rectificaciones DYD E.I.R.L. atiende reparaciones,
              rectificaciones y fabricación de repuestos con taller propio, equipos de control
              numérico y un historial documentado de cada trabajo.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/login">
                  Acceder al sistema
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#contacto">Solicitar un servicio</a>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <a href="tel:+51978719848">
                  <Phone className="h-4 w-4" />
                  +51 978 719 848
                </a>
              </Button>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-slate-200/80 pt-7">
              <div>
                <dt className="text-2xl font-extrabold text-slate-900">10+</dt>
                <dd className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Años operando
                </dd>
              </div>
              <div>
                <dt className="text-2xl font-extrabold text-slate-900">6</dt>
                <dd className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Servicios
                </dd>
              </div>
              <div>
                <dt className="text-2xl font-extrabold text-slate-900">24/7</dt>
                <dd className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Soporte en planta
                </dd>
              </div>
            </dl>
          </div>

          {/* Panel lateral */}
          <GlassCard className="overflow-hidden p-0">
            <div className="border-b border-slate-200/70 bg-white/60 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                Diagnóstico y mantenimiento
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                Cada equipo con historial y trazabilidad
              </h2>
            </div>
            <ul className="divide-y divide-slate-200/70">
              {[
                {
                  titulo: "Solicitud priorizada",
                  texto: "La prioridad se calcula con el estado real de la máquina y el tipo de falla.",
                },
                {
                  titulo: "Diagnóstico documentado",
                  texto: "Fallas detectadas, observaciones y recomendaciones quedan registrados.",
                },
                {
                  titulo: "Cotización e informe",
                  texto: "Documentos imprimibles que respaldan cada servicio realizado.",
                },
              ].map((item) => (
                <li key={item.titulo} className="flex gap-4 px-6 py-5">
                  <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.titulo}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-slate-200/70 bg-white/60 px-6 py-4">
              <p className="text-xs leading-relaxed text-slate-500">
                Sistema de gestión para administrador y técnico. El acceso es interno de la
                empresa; los clientes son registrados como parte del historial de sus equipos.
              </p>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="border-t border-slate-200/70 bg-white/55 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              Servicios
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Un solo taller para todo el ciclo del equipo
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Desde el preventivo programado hasta la rectificación de componentes, cubrimos el
              mantenimiento de la maquinaria que sostiene su producción.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICIOS.map((servicio) => {
              const Icono = servicio.icono;
              return (
                <GlassCard
                  key={servicio.titulo}
                  className="group p-7 transition-shadow duration-300 hover:shadow-xl hover:shadow-slate-900/[0.07]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700 transition-colors duration-300 group-hover:bg-blue-600 group-hover:text-white">
                    <Icono className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-900">{servicio.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {servicio.descripcion}
                  </p>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* La empresa */}
      <section id="empresa" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                La empresa
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Soldaduras Especiales y Rectificaciones DYD E.I.R.L.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-slate-600">
                Brindar servicios de mantenimiento, reparación y rectificación, y fabricación de
                repuestos de maquinaria industrial, con calidad y compromiso, garantizando la
                disponibilidad y el buen funcionamiento de los equipos de nuestros clientes del
                sector manufacturero.
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Antes, cada solicitud se anotaba en un cuaderno y la prioridad se decidía de
                manera improvisada. Hoy el sistema ordena cada trabajo, con diagnóstico técnico,
                cotización, orden de trabajo e informe de servicio en un mismo historial.
              </p>

              <dl className="mt-10 grid gap-x-10 gap-y-5 sm:grid-cols-2">
                <div className="border-l-2 border-blue-500/40 pl-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Misión
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-slate-700">
                    Mantenimiento, reparación, rectificación y repuestos con calidad y compromiso.
                  </dd>
                </div>
                <div className="border-l-2 border-sky-500/40 pl-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Visión
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-slate-700">
                    Ser líder en el sector metalmecánico, reconocida por la calidad y la
                    confiabilidad de sus servicios.
                  </dd>
                </div>
              </dl>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {PILARES.map((pilar) => {
                const Icono = pilar.icono;
                return (
                  <GlassCard key={pilar.titulo} className="p-6">
                    <Icono className="h-6 w-6 text-blue-600" />
                    <h3 className="mt-4 text-base font-bold text-slate-900">{pilar.titulo}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {pilar.descripcion}
                    </p>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section
        id="contacto"
        className="border-t border-slate-200/70 bg-white/55 py-20 lg:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              Contacto
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Visítanos en el taller o escríbenos
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Atendemos a empresas del sector manufacturero con equipos que requieren
              mantenimiento, rectificación o repuestos.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <GlassCard className="p-7">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Datos de la empresa
              </h3>
              <dl className="mt-6 space-y-5 text-sm">
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-4.5 w-4.5 shrink-0 text-blue-600" />
                  <div>
                    <dt className="font-semibold text-slate-900">Taller</dt>
                    <dd className="mt-0.5 text-slate-600">
                      Urbanización Faucet, Mz. M, Lote 1A
                      <br />
                      Callao, Perú
                    </dd>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Urbanizacion+Faucet+Mz+M+Lote+1A+Callao+Peru"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-900"
                    >
                      Ver en Google Maps
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Phone className="mt-0.5 h-4.5 w-4.5 shrink-0 text-blue-600" />
                  <div>
                    <dt className="font-semibold text-slate-900">Teléfono</dt>
                    <dd className="mt-0.5">
                      <a
                        href="tel:+51978719848"
                        className="text-slate-600 transition-colors hover:text-blue-700"
                      >
                        +51 978 719 848
                      </a>
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Mail className="mt-0.5 h-4.5 w-4.5 shrink-0 text-blue-600" />
                  <div>
                    <dt className="font-semibold text-slate-900">Correo</dt>
                    <dd className="mt-0.5">
                      <a
                        href="mailto:Soldadurasespecialesyrectificacioneseirl@hotmail.com"
                        className="break-all text-slate-600 transition-colors hover:text-blue-700"
                      >
                        Soldadurasespecialesyrectificacioneseirl@hotmail.com
                      </a>
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-blue-600" />
                  <div>
                    <dt className="font-semibold text-slate-900">RUC</dt>
                    <dd className="mt-0.5 font-mono text-slate-600">20505403089</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Factory className="mt-0.5 h-4.5 w-4.5 shrink-0 text-blue-600" />
                  <div>
                    <dt className="font-semibold text-slate-900">Razón social</dt>
                    <dd className="mt-0.5 text-slate-600">
                      Soldaduras Especiales y Rectificaciones DYD E.I.R.L.
                    </dd>
                  </div>
                </div>
              </dl>
            </GlassCard>

            <GlassCard className="p-7">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Solicitar información
              </h3>
              <form
                className="mt-6 space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                }}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contacto-nombre"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Nombre y apellido
                    </label>
                    <input
                      id="contacto-nombre"
                      name="nombre"
                      type="text"
                      placeholder="María Quispe"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contacto-empresa"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Empresa
                    </label>
                    <input
                      id="contacto-empresa"
                      name="empresa"
                      type="text"
                      placeholder="Textiles del Norte S.A.C."
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contacto-telefono"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Teléfono
                    </label>
                    <input
                      id="contacto-telefono"
                      name="telefono"
                      type="tel"
                      placeholder="+51 978 719 848"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contacto-email"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Correo
                    </label>
                    <input
                      id="contacto-email"
                      name="email"
                      type="email"
                      placeholder="operaciones@empresa.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="contacto-mensaje"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    ¿Qué necesita?
                  </label>
                  <textarea
                    id="contacto-mensaje"
                    name="mensaje"
                    rows={4}
                    placeholder="Detalle el equipo y la falla o el mantenimiento requerido."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button type="submit" size="lg">
                    Enviar solicitud
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <p className="text-xs leading-relaxed text-slate-500">
                    Formulario de demostración. El canal oficial de contacto se habilita cuando la
                    empresa publique sus datos.
                  </p>
                </div>
              </form>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 bg-slate-900 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_1fr]">
            <div>
              <Logo invertido />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
                Mantenimiento, reparación, rectificación y fabricación de repuestos de maquinaria
                industrial. Callao, Perú.
              </p>
            </div>
            <nav className="text-sm">
              <h3 className="font-semibold text-white">Navegación</h3>
              <ul className="mt-4 space-y-2.5 text-slate-400">
                <li>
                  <a href="#servicios" className="transition-colors hover:text-white">
                    Servicios
                  </a>
                </li>
                <li>
                  <a href="#empresa" className="transition-colors hover:text-white">
                    La empresa
                  </a>
                </li>
                <li>
                  <a href="#contacto" className="transition-colors hover:text-white">
                    Contacto
                  </a>
                </li>
                <li>
                  <Link to="/login" className="transition-colors hover:text-white">
                    Acceso interno
                  </Link>
                </li>
              </ul>
            </nav>
            <div className="text-sm">
              <h3 className="font-semibold text-white">Contacto</h3>
              <ul className="mt-4 space-y-2.5 text-slate-400">
                <li>
                  <a
                    href="tel:+51978719848"
                    className="transition-colors hover:text-white"
                  >
                    +51 978 719 848
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:Soldadurasespecialesyrectificacioneseirl@hotmail.com"
                    className="break-all transition-colors hover:text-white"
                  >
                    Soldadurasespecialesyrectificacioneseirl@hotmail.com
                  </a>
                </li>
                <li>Urbanización Faucet, Mz. M, Lote 1A, Callao</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} DYD E.I.R.L. Todos los derechos reservados.</p>
            <p>RUC 20505403089</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
