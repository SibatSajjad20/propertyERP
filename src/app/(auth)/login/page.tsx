import { redirect } from "next/navigation";
import { LoginScreen } from "./login-screen";
import { getSession } from "@/lib/auth";

export const instant = false;

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    if (Boolean((session.user as { mustChangePassword?: boolean }).mustChangePassword)) {
      redirect("/settings/profile");
    }
    redirect("/inventory");
  }

  return <LoginScreen />;
}
