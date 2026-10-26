import { BrowserRouter, Route, Routes } from "react-router";
import { AuthProvider } from "./auth/AuthProvider";
import RutaProtegida from "./components/RutaProtegida";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Inicio from "./pages/Inicio";
import Clientes from "./pages/Clientes";
import Maquinas from "./pages/Maquinas";
import Solicitudes from "./pages/Solicitudes";
import Ordenes from "./pages/Ordenes";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RutaProtegida />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Inicio />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/maquinas" element={<Maquinas />} />
              <Route path="/solicitudes" element={<Solicitudes />} />
              <Route path="/ordenes" element={<Ordenes />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
