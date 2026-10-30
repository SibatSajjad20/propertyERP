type Floor = { id: string; name: string };
type Block = { id: string; name: string; floors: Floor[] };
type PropertyNode = { id: string; name: string; blocks: Block[] };

export function StructureTree({ tree }: { tree: PropertyNode[] }) {
  if (tree.length === 0) {
    return <p className="text-[13px] text-ink-muted">No properties seeded yet.</p>;
  }

  return (
    <ol className="space-y-4 text-[13px]">
      {tree.map((property) => (
        <li key={property.id}>
          <p className="font-display text-[18px] text-ink">{property.name}</p>
          <ol className="mt-2 space-y-2 border-l border-line pl-4">
            {property.blocks.map((block) => (
              <li key={block.id}>
                <p className="text-ink">{block.name}</p>
                {block.floors.length === 0 ? (
                  <p className="mt-1 text-ink-muted">No floors yet.</p>
                ) : (
                  <ol className="mt-1 space-y-1 pl-4">
                    {block.floors.map((floor) => (
                      <li key={floor.id} className="text-ink-muted">
                        {floor.name}
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}
