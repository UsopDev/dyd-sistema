import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error("Variables de entorno inválidas:", z.treeifyError(result.error));
  process.exit(1);
}

export const env = result.data;
