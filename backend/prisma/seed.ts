import { prisma } from "../src/lib/prisma.js";
import { hashPassword } from "../src/lib/passwords.js";

/**
 * Seed mínimo — solo usuarios del sistema.
 * Re-ejecutarlo restablece las contraseñas de admin y técnico.
 * El cliente NO accede al sistema: solo existe como registro de empresa en seedDataDyD.ts
 */

function emailValido(
  valor: string | undefined,
  variable: string,
  porDefecto?: string,
): string {
  const email = (valor ?? porDefecto)?.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`Define ${variable} con un correo válido (backend/.env o backend/.env.docker).`);
    process.exit(1);
  }

  return email;
}

function passwordValida(valor: string | undefined, variable: string): string {
  if (!valor || valor.length < 8) {
    console.error(
      `Define ${variable} con al menos 8 caracteres (backend/.env o backend/.env.docker).`,
    );
    process.exit(1);
  }

  return valor;
}

const adminEmail = emailValido(process.env.ADMIN_EMAIL, "ADMIN_EMAIL");
const adminPassword = passwordValida(process.env.ADMIN_PASSWORD, "ADMIN_PASSWORD");

const tecnicoEmail = emailValido(
  process.env.DEMO_TECNICO_EMAIL,
  "DEMO_TECNICO_EMAIL",
  "tecnico@dyd.com",
);
const tecnicoPassword = passwordValida(
  process.env.DEMO_TECNICO_PASSWORD ?? "Tecnico1234",
  "DEMO_TECNICO_PASSWORD",
);

const adminHash = await hashPassword(adminPassword);
const tecnicoHash = await hashPassword(tecnicoPassword);

await prisma.usuario.upsert({
  where: { email: adminEmail },
  update: {
    password_hash: adminHash,
    rol: "ADMINISTRADOR",
    activo: true,
  },
  create: {
    nombres: "Administrador",
    apellidos: "DYD",
    email: adminEmail,
    password_hash: adminHash,
    rol: "ADMINISTRADOR",
  },
});

await prisma.usuario.upsert({
  where: { email: tecnicoEmail },
  update: {
    password_hash: tecnicoHash,
    rol: "TECNICO",
    activo: true,
  },
  create: {
    nombres: "Técnico",
    apellidos: "Demo",
    email: tecnicoEmail,
    password_hash: tecnicoHash,
    rol: "TECNICO",
  },
});

console.log("\nUsuarios del sistema listos. Re-ejecutar el seed restablece estas contraseñas:\n");
console.table([
  { Rol: "Administrador", Email: adminEmail, Contraseña: adminPassword },
  { Rol: "Técnico", Email: tecnicoEmail, Contraseña: tecnicoPassword },
]);

await prisma.$disconnect();