import { logger } from "@/lib/logger";

export async function timed<T>(step: string, fn: () => Promise<T>): Promise<T> {
  const started = Date.now();
  try {
    return await fn();
  } finally {
    logger.info({ step, ms: Date.now() - started }, "documents timing");
  }
}
