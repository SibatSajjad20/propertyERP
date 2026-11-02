import { listSoldUnits } from "@/features/sales/queries";
import { SoldScreen } from "@/features/sales/components/sold-screen";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

export const instant = false;

export const metadata = {
  title: "Sold Units",
};

export default async function SoldPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "sales.read");

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;

  const data = await listSoldUnits({ q });

  return <SoldScreen initialData={data} />;
}
