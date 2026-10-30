import pino from "pino";

export const logger = pino({
  level:
    process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  base: { service: "sardars-mall-erp" },
  redact: {
    paths: ["password", "req.headers.cookie", "req.headers.authorization"],
    censor: "[redacted]",
  },
});
