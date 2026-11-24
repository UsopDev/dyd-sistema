import { ClipboardList, Stethoscope, Wrench } from "lucide-react";
import { PortalPlaceholder } from "@/components/layout/portal-placeholder";

export function TechnicianDashboardPage() {
  return (
    <PortalPlaceholder
      title="Panel técnico"
      description="Tus solicitudes, órdenes y diagnósticos asignados."
      modules={[
        {
          icono: ClipboardList,
          titulo: "Mis solicitudes",
          descripcion: "Solicitudes asignadas con prioridad y estado en tiempo real.",
        },
        {
          icono: Wrench,
          titulo: "Mis órdenes",
          descripcion: "Órdenes de trabajo, repuestos utilizados y avance.",
        },
        {
          icono: Stethoscope,
          titulo: "Diagnósticos",
          descripcion: "Registro de diagnósticos con adjuntos y observaciones.",
        },
      ]}
    />
  );
}
