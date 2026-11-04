import { BrowserRouter, Route, Routes } from "react-router";
import { AuthProvider } from "./auth/AuthProvider";
import RutaProtegida from "./components/RutaProtegida";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Inicio from "./pages/Inicio";
import Clientes from "./pages/Clientes";
import Maquinas from "./pages/Maquinas";
import Materiales from "./pages/Materiales";
import Solicitudes from "./pages/Solicitudes";
import Ordenes from "./pages/Ordenes";
import Preventivo from "./pages/Preventivo";
import Usuarios from "./pages/Usuarios";
import Historiales from "./pages/Historiales";

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
              <Route path="/materiales" element={<Materiales />} />
              <Route path="/solicitudes" element={<Solicitudes />} />
              <Route path="/ordenes" element={<Ordenes />} />
              <Route path="/preventivo" element={<Preventivo />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/historiales" element={<Historiales />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
