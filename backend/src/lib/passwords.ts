import bcrypt from "bcrypt";

const COSTO = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COSTO);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Hash de relleno: se compara cuando el correo no existe, para que la respuesta
// tarde lo mismo y no se pueda descubrir qué correos están registrados.
export const HASH_FALSO = bcrypt.hashSync("contrasena-inexistente", COSTO);
