import pino from "pino";
import { env } from "../config/env.js";

const isProd = env.NODE_ENV === "production";

export const logger = pino({
  level: isProd ? "info" : "debug",
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.cookies.*",
      "res.headers['set-cookie']",
      "*.password*",
      "*.token*",
      "*.secret*",
    ],
    censor: "[REDACTED]",
  },
  base: {
    service: "dyd-backend",
    env: env.NODE_ENV,
  },
});

export function createRequestLogger(reqId: string) {
  return logger.child({ reqId });
}