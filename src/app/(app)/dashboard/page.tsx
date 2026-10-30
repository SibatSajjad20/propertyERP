import { OccupancyChart } from "@/features/dashboard/components/occupancy-chart";
import { getDashboardStats, getOccupancySeries } from "@/features/dashboard/queries";
import { formatPkr } from "@/lib/money";

export const instant = false;

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const [stats, series] = await Promise.all([getDashboardStats(), getOccupancySeries()]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 border-b border-line pb-6 sm:grid-cols-3">
        <Stat label="Units" value={String(stats.total)} />
        <Stat label="Available" value={String(stats.available)} tone="available" />
        <Stat label="Sold" value={String(stats.sold)} tone="sold" />
      </div>
      <div>
        <h2 className="font-display text-[20px] text-ink">Occupancy</h2>
        <p className="mt-1 text-[13px] text-ink-muted">
          Sold value is frozen at the time of sale. Live asking total is computed, never
          stored.
        </p>
        <div className="mt-4">
          <OccupancyChart data={series} />
        </div>
        <p className="mt-2 text-[12px] text-ink-muted">
          Placeholder asking book {formatPkr("0.00")} until units are imported.
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "available" | "sold";
}) {
  return (
    <div>
      <p className="text-[12px] tracking-wide text-ink-muted">{label}</p>
      <p
        className={`mt-1 font-display text-[40px] leading-none tabular-nums ${
          tone === "available"
            ? "text-available"
            : tone === "sold"
              ? "text-sold"
              : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
