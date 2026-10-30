export const WAKING_DB_MESSAGE =
  "Waking the database. This can take a few seconds after idle time.";

const TRANSIENT_PATTERN =
  /timeout|timed out|etimedout|econnreset|econnrefused|enotfound|connection terminated|connection refused|connection reset|remaining connection slots|too many clients|neon|compute is not active|endpoint is not ready|server closed the connection|57P01|53300|08006|08001|08004|08003|40001/i;

export function isTransientDbError(error: unknown): boolean {
  if (!error) {
    return false;
  }
  const parts: string[] = [];
  if (error instanceof Error) {
    parts.push(error.message, error.name);
    const code = (error as { code?: string }).code;
    if (code) {
      parts.push(code);
    }
  } else {
    parts.push(String(error));
  }
  return TRANSIENT_PATTERN.test(parts.join(" "));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withDbRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      if (!isTransientDbError(error) || attempt === attempts - 1) {
        throw error;
      }
      await sleep(400 * 2 ** attempt);
    }
  }
  throw last;
}
