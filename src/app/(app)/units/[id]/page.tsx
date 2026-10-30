import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getUnitById } from "@/features/units/queries";
import { formatSqft } from "@/lib/area";
import { formatPkr, formatPkrLedger } from "@/lib/money";

export const metadata = {
  title: "Unit",
};

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await getUnitById(id);
  if (!row) {
    notFound();
  }

  const price = row.unit.soldPricePkr ?? row.computedPricePkr ?? "0.00";

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <div>
          <p className="unit-code text-[13px] text-ink-muted">{row.unit.unitCode}</p>
          <h2 className="font-display text-[28px] text-ink">{row.unit.unitNumber}</h2>
        </div>
        <Badge tone={row.unit.status === "SOLD" ? "sold" : "available"}>
          {row.unit.status}
        </Badge>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
        <Item label="Floor" value={row.floorName} />
        <Item label="Category" value={row.categoryName} />
        <Item label="Net area" value={formatSqft(row.unit.netAreaSqft)} align="right" />
        <Item
          label="Gross area"
          value={formatSqft(row.unit.grossAreaSqft)}
          align="right"
        />
        <Item
          label="Rate / sqft"
          value={formatPkrLedger(row.unit.ratePerSqftPkr)}
          align="right"
        />
        <Item label="Book price" value={formatPkr(price)} align="right" />
      </dl>
    </div>
  );
}

function Item({
  label,
  value,
  align,
}: {
  label: string;
  value: string;
  align?: "right";
}) {
  return (
    <div className="border-b border-line py-2">
      <dt className="text-[11px] tracking-wide text-ink-muted">{label}</dt>
      <dd className={align === "right" ? "text-right tabular-nums" : undefined}>
        {value}
      </dd>
    </div>
  );
}
