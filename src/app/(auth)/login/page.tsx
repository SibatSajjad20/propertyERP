import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { getSession } from "@/lib/auth";

export const instant = false;

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/inventory");
  }

  return (
    <main
      id="main"
      className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col justify-center px-6 py-16"
    >
      <p className="text-[11px] tracking-[0.18em] text-ink-muted">LEDGER ACCESS</p>
      <h1 className="mt-2 font-display text-[36px] leading-none text-ink">
        Sardar&apos;s Mall
      </h1>
      <p className="mt-3 border-t border-line pt-3 text-[13px] text-ink-muted">
        Property and inventory management. Sign in with your staff account.
      </p>
      <LoginForm />
    </main>
  );
}
