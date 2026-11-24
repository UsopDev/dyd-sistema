import type { NextFunction, Request, Response } from "express";
import { COOKIE_CLIENTE_ACCESO, verificarClienteAccessToken } from "../lib/cliente-jwt.js";

export function requireClienteAuth(req: Request, res: Response, next: NextFunction): void {
  const token: string | undefined = req.cookies?.[COOKIE_CLIENTE_ACCESO];
  const sesion = token ? verificarClienteAccessToken(token) : null;

  if (!sesion) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  res.locals.sesionCliente = sesion;
  next();
}
