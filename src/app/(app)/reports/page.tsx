import { redirect } from "next/navigation";

export default function ReportsRedirect() {
  redirect("/reports/summary" as never);
}
