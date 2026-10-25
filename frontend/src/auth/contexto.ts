import { createContext } from "react";

export type Rol = "ADMINISTRADOR" | "TECNICO";

export interface Usuario {
  id_usuario?: string;
  nombres?: string;
  apellidos?: string;
  email?: string;
  rol: Rol;
}

export interface ContextoAuth {
  usuario: Usuario | null;
  cargando: boolean;
  entrar: (email: string, password: string) => Promise<void>;
  salir: () => Promise<void>;
}

export const AuthContext = createContext<ContextoAuth | null>(null);
