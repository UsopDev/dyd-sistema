import { Route, Routes } from "react-router-dom";
import { ClientLayout } from "@/components/layout/client-layout";
import { StaffLayout } from "@/components/layout/staff-layout";
import { ClientAuthProvider } from "@/features/auth/client-auth";
import { ClientLoginPage } from "@/features/auth/client-login-page";
import { RequireClient, RequireStaff, RootRedirect } from "@/features/auth/guards";
import { StaffAuthProvider } from "@/features/auth/staff-auth";
import { StaffLoginPage } from "@/features/auth/staff-login-page";
import { AdminDashboardPage } from "@/features/dashboard/admin-dashboard-page";
import { ClientDashboardPage } from "@/features/dashboard/client-dashboard-page";
import { TechnicianDashboardPage } from "@/features/dashboard/technician-dashboard-page";
import { ClientMaquinasPage } from "@/features/client/client-maquinas-page";
import { ClientSolicitudesPage } from "@/features/client/client-solicitudes-page";
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
      <ClientAuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<StaffLoginPage />} />
          <Route path="/cliente/login" element={<ClientLoginPage />} />
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
            <Route
              path="/tecnico/ordenes"
              element={<TechnicianOrdenesPage />}
            />
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

          <Route
            element={
              <RequireClient>
                <ClientLayout />
              </RequireClient>
            }
          >
            <Route path="/cliente" element={<ClientDashboardPage />} />
            <Route
              path="/cliente/solicitudes"
              element={<ClientSolicitudesPage />}
            />
            <Route path="/cliente/maquinas" element={<ClientMaquinasPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ClientAuthProvider>
    </StaffAuthProvider>
  );
}
