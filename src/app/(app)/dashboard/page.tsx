import { redirect } from "next/navigation";

export const instant = false;

export default async function DashboardRedirect({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const rawParams = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) {
    if (typeof value === "string") {
      params.set(key, value);
    } else if (Array.isArray(value) && value[0]) {
      params.set(key, value[0]);
    }
  }
  const qs = params.toString();
  redirect(qs ? `/?${qs}` : "/");
}
