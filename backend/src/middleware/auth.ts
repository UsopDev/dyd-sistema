import type { NextFunction, Request, Response } from "express";
import { COOKIE_ACCESO, verificarAccessToken, type Rol, type SesionUsuario } from "../lib/jwt.js";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token: string | undefined = req.cookies?.[COOKIE_ACCESO];
  const sesion = token ? verificarAccessToken(token) : null;

  if (!sesion) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  res.locals.sesion = sesion;
  next();
}

export function requireRol(...roles: Rol[]) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const sesion = res.locals.sesion as SesionUsuario;

    if (!roles.includes(sesion.rol)) {
      res.status(403).json({ error: "No tienes permiso para esta acción" });
      return;
    }

    next();
  };
}
