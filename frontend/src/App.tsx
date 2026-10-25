import { BrowserRouter, Route, Routes } from "react-router";
import { AuthProvider } from "./auth/AuthProvider";
import RutaProtegida from "./components/RutaProtegida";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Inicio from "./pages/Inicio";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RutaProtegida />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Inicio />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
