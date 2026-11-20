import { CLIENT_DOCUMENTS_BUCKET, thumbnailStoragePath } from "../constants";
import { getSupabaseServer } from "@/lib/supabase-server";

export type EmbeddedImage = {
  dataUrl: string;
  mimeType: string;
};

const MAX_EDGE = 800;

async function downscale(
  buffer: Buffer,
  mime: string,
): Promise<{ buffer: Buffer; mime: string }> {
  try {
    const sharp = (await import("sharp")).default;
    const image = sharp(buffer);
    const meta = await image.metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    const needsResize = Math.max(width, height) > MAX_EDGE;
    const isJpeg = mime === "image/jpeg";
    if (
      width === 0 ||
      height === 0 ||
      (!needsResize && isJpeg && buffer.length <= 250_000)
    ) {
      return { buffer, mime };
    }
    const resized = await image
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();
    return { buffer: resized, mime: "image/jpeg" };
  } catch {
    return { buffer, mime };
  }
}

async function downloadImage(storagePath: string): Promise<EmbeddedImage | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.storage
    .from(CLIENT_DOCUMENTS_BUCKET)
    .download(storagePath);
  if (error || !data) return null;
  if (data.type === "application/pdf") return null;
  const raw = Buffer.from(await data.arrayBuffer());
  const { buffer, mime } = await downscale(raw, data.type || "image/jpeg");
  return { dataUrl: `data:${mime};base64,${buffer.toString("base64")}`, mimeType: mime };
}

export async function embedStorageImage(
  storagePath: string,
): Promise<EmbeddedImage | null> {
  const thumb = await downloadImage(thumbnailStoragePath(storagePath));
  if (thumb) return thumb;
  return downloadImage(storagePath);
}
