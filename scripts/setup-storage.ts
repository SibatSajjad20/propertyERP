import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env" });

const BUCKET = "client-documents";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing, error: getError } = await supabase.storage.getBucket(BUCKET);
  if (existing) {
    const { error: updateError } = await supabase.storage.updateBucket(BUCKET, {
      public: false,
      fileSizeLimit: MAX_BYTES,
      allowedMimeTypes: ALLOWED_MIMES,
    });
    if (updateError) throw updateError;
    console.log(`Bucket "${BUCKET}" already exists; settings refreshed.`);
    return;
  }

  if (getError && !/not found|does not exist/i.test(getError.message)) {
    throw getError;
  }

  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: ALLOWED_MIMES,
  });
  if (createError) throw createError;
  console.log(`Created private bucket "${BUCKET}".`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
