import { notFound } from "next/navigation";
import { DevUiScreen } from "./dev-ui-screen";
import { requireSession } from "@/lib/auth";

export const metadata = {
  title: "Design System & UI Controls (Dev)",
};

export default async function DevUiPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  const session = await requireSession();
  if (session.user.role !== "ADMIN") {
    notFound();
  }
  return <DevUiScreen />;
}
