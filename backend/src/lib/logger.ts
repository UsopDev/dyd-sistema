import pino from "pino";
import { env } from "../config/env.js";

const isProd = env.NODE_ENV === "production";

const loggerOptions: pino.LoggerOptions = {
  level: isProd ? "info" : "debug",
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
};

if (!isProd) {
  loggerOptions.transport = {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  };
}

export const logger = pino(loggerOptions);

export function createRequestLogger(reqId: string) {
  return logger.child({ reqId });
}