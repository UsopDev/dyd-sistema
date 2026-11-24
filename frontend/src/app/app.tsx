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
          </Route>

          <Route
            element={
              <RequireStaff roles={["TECNICO"]}>
                <StaffLayout />
              </RequireStaff>
            }
          >
            <Route path="/tecnico" element={<TechnicianDashboardPage />} />
          </Route>

          <Route
            element={
              <RequireClient>
                <ClientLayout />
              </RequireClient>
            }
          >
            <Route path="/cliente" element={<ClientDashboardPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ClientAuthProvider>
    </StaffAuthProvider>
  );
}
