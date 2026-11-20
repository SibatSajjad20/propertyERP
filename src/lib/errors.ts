import { ZodError } from "zod";

const TRANSIENT_DB_CODES = new Set([
  "ECONNRESET",
  "CONNECT_TIMEOUT",
  "ETIMEDOUT",
  "CONNECTION_CLOSED",
  "EPIPE",
  "ECONNREFUSED",
  "EAI_AGAIN",
]);

export function isTransientDbError(err: unknown): boolean {
  let cur: unknown = err;
  for (let depth = 0; depth < 5 && cur && typeof cur === "object"; depth++) {
    const rec = cur as { code?: unknown; message?: unknown; cause?: unknown };
    if (typeof rec.code === "string" && TRANSIENT_DB_CODES.has(rec.code)) {
      return true;
    }
    if (
      typeof rec.message === "string" &&
      (rec.message.includes("CONNECT_TIMEOUT") ||
        rec.message.includes("ECONNRESET") ||
        rec.message.includes("ETIMEDOUT") ||
        rec.message.includes("Client network socket disconnected") ||
        rec.message.includes("Connection terminated") ||
        rec.message.includes("socket hang up") ||
        rec.message.includes("connection closed"))
    ) {
      return true;
    }
    cur = rec.cause;
  }
  return false;
}

const LEAKY_PATTERN =
  /password|secret|DATABASE_URL|ECONN|postgres:\/\/|failed query|drizzlequeryerror|syntax error/i;
const FORBIDDEN_PATTERN = /forbidden|not allowed|permission/i;
const UNAUTHORIZED_PATTERN = /unauthorized|sign in required|unauthenticated/i;

export class AppError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Sign in required") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to do that") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(
    message = "This unit was changed by someone else. Reload to see the latest.",
  ) {
    super(message, "CONFLICT", 409);
    this.name = "ConflictError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input") {
    super(message, "VALIDATION", 422);
    this.name = "ValidationError";
  }
}

export function errorStatus(error: unknown): number {
  if (error instanceof AppError) {
    return error.status;
  }
  if (error instanceof ZodError) {
    return 422;
  }
  return 500;
}

export function errorCode(error: unknown): string {
  if (error instanceof AppError) {
    return error.code;
  }
  if (error instanceof ZodError) {
    return "VALIDATION";
  }
  return "INTERNAL";
}

export function errorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Invalid input";
  }
  if (isTransientDbError(error)) {
    return "A temporary database connection error occurred. Please try again.";
  }
  if (typeof error === "object" && error && "message" in error) {
    const message = String((error as { message: unknown }).message);
    if (FORBIDDEN_PATTERN.test(message)) {
      return "You do not have permission to do that";
    }
    if (UNAUTHORIZED_PATTERN.test(message)) {
      return "Sign in required";
    }
    if (message && !LEAKY_PATTERN.test(message)) {
      return message;
    }
  }
  return "Something went wrong. Try again, or ask an administrator.";
}
