import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { getInventoryFilterOptions } from "@/features/units/queries";
import { listMergeRequests } from "@/features/units/merge-queries";
import { MergeRequestsScreen } from "@/features/units/components/merge-requests-screen";

export const metadata: Metadata = {
  title: "Unit Merge Requests",
};

export default async function InventoryMergesPage() {
  const session = await requireSession();
  assertCan(session.user.role, "units.merge_request");

  const [requests, options] = await Promise.all([
    listMergeRequests(),
    getInventoryFilterOptions(),
  ]);

  return (
    <MergeRequestsScreen requests={requests} options={options} role={session.user.role} />
  );
}
