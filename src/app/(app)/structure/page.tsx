import { StructureTree } from "@/features/structure/components/structure-tree";
import { getStructureTree } from "@/features/structure/queries";

export const metadata = {
  title: "Structure",
};

export default async function StructurePage() {
  const tree = await getStructureTree();
  return (
    <div>
      <p className="mb-4 text-[13px] text-ink-muted">
        Hierarchy is Property, Block, Floor, then Unit. Floors are created during import.
      </p>
      <StructureTree tree={tree} />
    </div>
  );
}
