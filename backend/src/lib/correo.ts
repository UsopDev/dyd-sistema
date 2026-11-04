import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

export const correoConfigurado = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

const puerto = Number(SMTP_PORT ?? 587);

const transporte = correoConfigurado
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: puerto,
      secure: puerto === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

// Los destinatarios van en copia oculta para que no vean los correos de los demás.
export async function enviarCorreo(para: string[], asunto: string, texto: string) {
  if (!transporte) throw new Error("El correo no está configurado en el servidor");

  const remitente = SMTP_FROM ?? SMTP_USER!;
  await transporte.sendMail({ from: remitente, to: remitente, bcc: para, subject: asunto, text: texto });
}
