import { z } from "zod";

export const importPreviewSchema = z.object({
  fileName: z.string().min(1),
});
