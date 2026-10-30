/**
 * Tests (Vitest DB helpers and Playwright) must never touch production.
 * Allowed when DATABASE_URL is local, explicitly named as a test DB,
 * or ALLOW_TEST_DB=1 is set and the host is not a production marker.
 */
export function assertTestDatabase(
  env: Record<string, string | undefined> = process.env,
): void {
  if (env.VERCEL_ENV === "production") {
    throw new Error("ABORT: tests cannot run against VERCEL_ENV=production");
  }

  const dbUrl = env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("ABORT: DATABASE_URL is not set");
  }

  let host = "";
  try {
    host = new URL(dbUrl).hostname.toLowerCase();
  } catch {
    throw new Error("ABORT: DATABASE_URL is not a valid URL");
  }

  const looksLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".local");
  const looksNamedTest =
    /(?:^|[.-])(test|e2e|ci|dev)(?:[.-]|$)/i.test(host) ||
    /(?:^|[/_-])(test|e2e)(?:[/_-]|$)/i.test(dbUrl);
  const looksProduction =
    host.includes("prod") ||
    host.includes("production") ||
    host.includes("sardarsmall-prod") ||
    Boolean(env.NEON_PROJECT_ID && env.VERCEL_ENV === "production");

  if (looksProduction) {
    throw new Error(`ABORT: tests cannot run against production database (${host})`);
  }

  if (looksLocal || looksNamedTest) {
    return;
  }

  if (env.ALLOW_TEST_DB === "1") {
    return;
  }

  throw new Error(
    `ABORT: DATABASE_URL host "${host}" is not a test database. Use localhost or set ALLOW_TEST_DB=1 for a dedicated non-prod instance.`,
  );
}

export function isApplyFlag(argv: string[]): boolean {
  return argv.includes("--apply");
}

export function isAllowProductionFlag(argv: string[]): boolean {
  return argv.includes("--allow-production");
}
