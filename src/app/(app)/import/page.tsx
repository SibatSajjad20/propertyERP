import { redirect } from "next/navigation";
import { ImportScreen } from "@/features/import/components/import-screen";
import { listImportBatches } from "@/features/import/queries";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";

export const instant = false;

export const metadata = {
  title: "Import",
};

export default async function ImportPage() {
  const session = await requireSession();
  if (!can(session.user.role, "units.import")) {
    redirect("/inventory");
  }

  const batches = await listImportBatches();

  return <ImportScreen initialBatches={batches} />;
}
