import { Router } from "express";
import multer from "multer";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { validar } from "../../lib/validar.js";
import type { SesionUsuario } from "../../lib/jwt.js";

export const adjuntosRouter = Router({ mergeParams: true });

const CARPETA = path.resolve("uploads", "diagnosticos");
const MAXIMO_BYTES = 5 * 1024 * 1024;

const EXTENSIONES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

const idSchema = z.object({ id: z.uuid() });
const descargaSchema = z.object({ id: z.uuid(), idAdjunto: z.uuid() });

// No basta con confiar en el tipo que declara el cliente: se revisan los primeros bytes.
function firmaValida(mime: string, b: Buffer): boolean {
  switch (mime) {
    case "image/jpeg":
      return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case "image/png":
      return b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/webp":
      return b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP";
    case "application/pdf":
      return b.length > 4 && b.toString("ascii", 0, 4) === "%PDF";
    default:
      return false;
  }
}

const recibir = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAXIMO_BYTES, files: 1 },
}).single("archivo");

adjuntosRouter.post("/", async (req, res) => {
  const params = validar(idSchema, req.params, res);
  if (!params) return;

  const sesion = res.locals.sesion as SesionUsuario;

  const diagnostico = await prisma.diagnostico.findUnique({
    where: { id_diagnostico: params.id },
    select: { id_diagnostico: true, id_tecnico: true, solicitud: { select: { estado: true } } },
  });

  if (!diagnostico) {
    res.status(404).json({ error: "Diagnóstico no encontrado" });
    return;
  }

  if (sesion.rol !== "ADMINISTRADOR" && diagnostico.id_tecnico !== sesion.id) {
    res.status(403).json({ error: "Solo su autor o un administrador puede adjuntar archivos" });
    return;
  }

  if (diagnostico.solicitud.estado !== "EN_DIAGNOSTICO") {
    res.status(409).json({ error: "Ya no se pueden adjuntar archivos porque la solicitud avanzó o fue cancelada" });
    return;
  }

  try {
    await new Promise<void>((resolve, reject) => {
      recibir(req, res, (err?: unknown) => (err ? reject(err) : resolve()));
    });
  } catch (err) {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "El archivo supera el máximo de 5 MB" });
      return;
    }
    res.status(400).json({ error: "No se pudo leer el archivo" });
    return;
  }

  const archivo = req.file;

  if (!archivo) {
    res.status(400).json({ error: "Falta el archivo (campo «archivo»)" });
    return;
  }

  const extension = EXTENSIONES[archivo.mimetype];

  if (!extension || !firmaValida(archivo.mimetype, archivo.buffer)) {
    res.status(400).json({ error: "Solo se permiten imágenes JPG, PNG, WEBP o archivos PDF" });
    return;
  }

  const clave = `${randomUUID()}${extension}`;
  await mkdir(CARPETA, { recursive: true });
  await writeFile(path.join(CARPETA, clave), archivo.buffer);

  const nombre = Buffer.from(archivo.originalname, "latin1").toString("utf8").slice(0, 150);

  const adjunto = await prisma.adjunto.create({
    data: {
      id_diagnostico: diagnostico.id_diagnostico,
      nombre_original: nombre,
      clave_almacenamiento: clave,
      tipo_mime: archivo.mimetype,
      tamano_bytes: archivo.size,
      id_usuario_subio: sesion.id,
    },
    select: {
      id_adjunto: true,
      nombre_original: true,
      tipo_mime: true,
      tamano_bytes: true,
      subido_en: true,
    },
  });

  res.status(201).json({ adjunto });
});

adjuntosRouter.get("/:idAdjunto", async (req, res) => {
  const params = validar(descargaSchema, req.params, res);
  if (!params) return;

  const adjunto = await prisma.adjunto.findFirst({
    where: { id_adjunto: params.idAdjunto, id_diagnostico: params.id },
  });

  if (!adjunto) {
    res.status(404).json({ error: "Archivo no encontrado" });
    return;
  }

  res.type(adjunto.tipo_mime ?? "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `inline; filename*=UTF-8''${encodeURIComponent(adjunto.nombre_original)}`,
  );
  res.sendFile(path.join(CARPETA, adjunto.clave_almacenamiento), (err) => {
    if (err && !res.headersSent) res.status(404).json({ error: "Archivo no encontrado" });
  });
});
