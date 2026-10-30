import { listImportBatches } from "@/features/import/queries";

export const instant = false;

export const metadata = {
  title: "Import",
};

export default async function ImportPage() {
  const batches = await listImportBatches();

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-[13px] text-ink-muted">
        Excel import uses SheetJS. Cleaning rules are in docs/IMPORT_RULES.md. The
        pipeline itself is the next milestone.
      </p>
      <div className="border-t border-line pt-3">
        <h2 className="font-display text-[20px] text-ink">Batches</h2>
        {batches.length === 0 ? (
          <p className="mt-2 text-[13px] text-ink-muted">No import batches yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line text-[13px]">
            {batches.map((batch) => (
              <li key={batch.id} className="flex h-8 items-center justify-between">
                <span>{batch.originalFilePath}</span>
                <span className="text-ink-muted tabular-nums">{batch.rowCount} rows</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
