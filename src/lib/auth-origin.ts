function stripProtocol(value: string): string {
  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export function vercelOrigin(vercelUrl = process.env.VERCEL_URL): string | undefined {
  if (!vercelUrl) {
    return undefined;
  }
  return `https://${stripProtocol(vercelUrl)}`;
}

type EnvLike = Record<string, string | undefined>;

export function resolveAuthBaseURL(env: EnvLike = process.env): string {
  const vercel = vercelOrigin(env.VERCEL_URL);
  if (env.VERCEL_ENV === "preview" && vercel) {
    return vercel;
  }
  if (env.BETTER_AUTH_URL) {
    return env.BETTER_AUTH_URL.replace(/\/$/, "");
  }
  if (vercel) {
    return vercel;
  }
  return "http://localhost:3000";
}

export function resolveTrustedOrigins(env: EnvLike = process.env): string[] {
  const origins = new Set<string>();
  origins.add(resolveAuthBaseURL(env));
  const vercel = vercelOrigin(env.VERCEL_URL);
  if (vercel) {
    origins.add(vercel);
  }
  if (env.VERCEL_URL) {
    origins.add(`https://${stripProtocol(env.VERCEL_URL)}`);
  }
  if (env.BETTER_AUTH_URL) {
    origins.add(env.BETTER_AUTH_URL.replace(/\/$/, ""));
  }
  origins.add("http://localhost:3000");
  origins.add("http://127.0.0.1:3000");
  return [...origins];
}
