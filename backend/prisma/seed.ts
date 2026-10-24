import { prisma } from "../src/lib/prisma.js";
import { hashPassword } from "../src/lib/passwords.js";

const email = process.env.ADMIN_EMAIL?.toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password || password.length < 8) {
  console.error("Define ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 8 caracteres) en backend/.env");
  process.exit(1);
}

await prisma.usuario.upsert({
  where: { email },
  update: {},
  create: {
    nombres: "Administrador",
    apellidos: "DYD",
    email,
    password_hash: await hashPassword(password),
    rol: "ADMINISTRADOR",
  },
});

console.log(`Administrador listo: ${email}`);
await prisma.$disconnect();
