"use server";

import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { importPreviewSchema } from "./schema";

export async function previewImport(input: unknown) {
  const parsed = importPreviewSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "units.import");
  return {
    fileName: parsed.fileName,
    message:
      "Import pipeline is scaffolded. Cleaning rules live in docs/IMPORT_RULES.md.",
  };
}
