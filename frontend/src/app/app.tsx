import { Route, Routes } from "react-router-dom";
import { StaffLayout } from "@/components/layout/staff-layout";
import { RequireStaff } from "@/features/auth/guards";
import { StaffAuthProvider } from "@/features/auth/staff-auth";
import { StaffLoginPage } from "@/features/auth/staff-login-page";
import { PublicLandingPage } from "@/features/public/public-landing-page";
import { AdminDashboardPage } from "@/features/dashboard/admin-dashboard-page";
import { TechnicianDashboardPage } from "@/features/dashboard/technician-dashboard-page";
import { TechnicianOrdenesPage } from "@/features/technician/technician-ordenes-page";
import { TechnicianSolicitudesPage } from "@/features/technician/technician-solicitudes-page";
import { ClientesPage } from "@/features/admin/clientes-page";
import { CotizacionesPage } from "@/features/admin/cotizaciones-page";
import { DiagnosticosPage } from "@/features/admin/diagnosticos-page";
import { MaquinasPage } from "@/features/admin/maquinas-page";
import { MaterialesPage } from "@/features/admin/materiales-page";
import { OrdenesPage } from "@/features/admin/ordenes-page";
import { PreventivosPage } from "@/features/admin/preventivos-page";
import { ReportesPage } from "@/features/admin/reportes-page";
import { SolicitudesPage } from "@/features/admin/solicitudes-page";
import { UsuariosPage } from "@/features/admin/usuarios-page";
import { ForbiddenPage } from "./forbidden-page";
import { NotFoundPage } from "./not-found-page";

export function App() {
  return (
    <StaffAuthProvider>
      <Routes>
        <Route path="/" element={<PublicLandingPage />} />
        <Route path="/login" element={<StaffLoginPage />} />
        <Route path="/403" element={<ForbiddenPage />} />

        <Route
          element={
            <RequireStaff roles={["ADMINISTRADOR"]}>
              <StaffLayout />
            </RequireStaff>
          }
        >
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/solicitudes" element={<SolicitudesPage />} />
          <Route path="/admin/diagnosticos" element={<DiagnosticosPage />} />
          <Route path="/admin/cotizaciones" element={<CotizacionesPage />} />
          <Route path="/admin/ordenes" element={<OrdenesPage />} />
          <Route path="/admin/clientes" element={<ClientesPage />} />
          <Route path="/admin/maquinas" element={<MaquinasPage />} />
          <Route path="/admin/materiales" element={<MaterialesPage />} />
          <Route path="/admin/preventivos" element={<PreventivosPage />} />
          <Route path="/admin/usuarios" element={<UsuariosPage />} />
          <Route path="/admin/reportes" element={<ReportesPage />} />
        </Route>

        <Route
          element={
            <RequireStaff roles={["TECNICO"]}>
              <StaffLayout />
            </RequireStaff>
          }
        >
          <Route path="/tecnico" element={<TechnicianDashboardPage />} />
          <Route
            path="/tecnico/solicitudes"
            element={<TechnicianSolicitudesPage />}
          />
          <Route path="/tecnico/ordenes" element={<TechnicianOrdenesPage />} />
          <Route
            path="/tecnico/diagnosticos"
            element={
              <TechnicianSolicitudesPage
                estadoInicial="EN_DIAGNOSTICO"
                titulo="Diagnósticos"
                descripcion="Solicitudes con diagnóstico en curso."
              />
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </StaffAuthProvider>
  );
}
