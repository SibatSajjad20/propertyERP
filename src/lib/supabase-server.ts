import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/lib/errors";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseServer: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

export function getSupabaseServer(): SupabaseClient {
  if (!supabaseServer) {
    throw new ValidationError(
      "Document storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return supabaseServer;
}
