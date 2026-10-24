import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type Rol = "ADMINISTRADOR" | "TECNICO";

export interface SesionUsuario {
  id: string;
  rol: Rol;
}

export const COOKIE_ACCESO = "access_token";

export function firmarAccessToken(usuario: SesionUsuario): string {
  return jwt.sign({ rol: usuario.rol }, env.JWT_ACCESS_SECRET, {
    algorithm: "HS256",
    subject: usuario.id,
    expiresIn: env.JWT_ACCESS_MINUTES * 60,
  });
}

export function verificarAccessToken(token: string): SesionUsuario | null {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ["HS256"] });
    if (typeof payload === "string" || !payload.sub) return null;
    if (payload.rol !== "ADMINISTRADOR" && payload.rol !== "TECNICO") return null;
    return { id: payload.sub, rol: payload.rol };
  } catch {
    return null;
  }
}
