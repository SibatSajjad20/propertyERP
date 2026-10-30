import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const instant = false;

export default async function HomePage() {
  const session = await getSession();
  redirect(session ? "/inventory" : "/login");
}
