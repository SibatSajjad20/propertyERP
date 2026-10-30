import { StructureScreen } from "@/features/structure/components/structure-screen";
import { getStructureScreenData } from "@/features/structure/queries";
import { requireSession } from "@/lib/auth";
import { assertCan, can } from "@/lib/permissions";

export const instant = false;

export const metadata = {
  title: "Structure",
};

export default async function StructurePage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string; blockId?: string }>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "structure.read");

  const params = await searchParams;
  const data = await getStructureScreenData(params.propertyId, params.blockId);

  return (
    <StructureScreen {...data} canManage={can(session.user.role, "structure.manage")} />
  );
}
