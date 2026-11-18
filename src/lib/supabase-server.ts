import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/lib/errors";

let cachedClient: SupabaseClient | null = null;
let cachedKey = "";

function resolveConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return { url: url.trim(), key: key.trim() };
}

export function isStorageConfigured(): boolean {
  const { url, key } = resolveConfig();
  return Boolean(url && key);
}

export function getSupabaseServer(): SupabaseClient {
  const { url, key } = resolveConfig();
  if (!url || !key) {
    throw new ValidationError(
      "Document storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  const cacheKey = `${url}|${key.slice(0, 8)}`;
  if (!cachedClient || cachedKey !== cacheKey) {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    cachedKey = cacheKey;
  }
  return cachedClient;
}

export const supabaseServer: SupabaseClient | null = isStorageConfigured()
  ? getSupabaseServer()
  : null;
