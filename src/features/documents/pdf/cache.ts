import "server-only";

import { getSupabaseServer } from "@/lib/supabase-server";
import { CLIENT_DOCUMENTS_BUCKET } from "../constants";
import { timed } from "../timing";

const memoryCache = new Map<string, Buffer>();
const MEMORY_CACHE_LIMIT = 24;
const REMOTE_CACHE_TIMEOUT_MS = 800;

export const FORM_PDF_LAYOUT_VERSION = "2";

export function pdfCachePath(
  kind: "booking" | "sale",
  id: string,
  version: string,
  appendix: boolean,
) {
  return `${kind}s/${id}/${kind}-form-v${FORM_PDF_LAYOUT_VERSION}-${version}${appendix ? "-app" : ""}.pdf`;
}

export function receiptCachePath(
  kind: "booking" | "sale",
  id: string,
  version: string,
  signatoryId: string,
) {
  return `receipts/${kind}s/${id}/${signatoryId}-v${version}.pdf`;
}

function rememberPdf(path: string, pdf: Buffer) {
  memoryCache.set(path, pdf);
  if (memoryCache.size <= MEMORY_CACHE_LIMIT) return;
  const oldest = memoryCache.keys().next().value;
  if (oldest) memoryCache.delete(oldest);
}

export async function readCachedPdf(path: string): Promise<Buffer | null> {
  return timed("pdfCacheRead", async () => {
    const local = memoryCache.get(path);
    if (local) return local;
    try {
      const supabase = getSupabaseServer();
      const download = supabase.storage
        .from(CLIENT_DOCUMENTS_BUCKET)
        .download(path)
        .then(async ({ data, error }) => {
          if (error || !data) return null;
          const buf = Buffer.from(await data.arrayBuffer());
          rememberPdf(path, buf);
          return buf;
        });
      const timeout = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), REMOTE_CACHE_TIMEOUT_MS);
      });
      return await Promise.race([download, timeout]);
    } catch {
      return null;
    }
  });
}

export async function writeCachedPdf(path: string, pdf: Buffer) {
  rememberPdf(path, pdf);
  return timed("pdfCacheWrite", async () => {
    try {
      const supabase = getSupabaseServer();
      await supabase.storage.from(CLIENT_DOCUMENTS_BUCKET).upload(path, pdf, {
        contentType: "application/pdf",
        upsert: true,
      });
    } catch {
      // Cache write is best-effort.
    }
  });
}
