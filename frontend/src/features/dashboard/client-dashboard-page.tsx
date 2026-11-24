import { CalendarClock, ClipboardList, Factory } from "lucide-react";
import { PortalPlaceholder } from "@/components/layout/portal-placeholder";

export function ClientDashboardPage() {
  return (
    <PortalPlaceholder
      title="Portal de clientes"
      description="Consultat tus solicitudes, máquinas y mantenimientos."
      modules={[
        {
          icono: ClipboardList,
          titulo: "Mis solicitudes",
          descripcion: "Estado, prioridad y avance de cada solicitud enviada.",
        },
        {
          icono: Factory,
          titulo: "Mis máquinas",
          descripcion: "Equipos registrados, ubicación y estado operativo.",
        },
        {
          icono: CalendarClock,
          titulo: "Mantenimientos",
          descripcion: "Servicios preventivos programados y próximas visitas.",
        },
      ]}
    />
  );
}
