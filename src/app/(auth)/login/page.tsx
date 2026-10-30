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
    <div className="flex min-h-screen w-full items-center justify-center bg-bg px-4 py-12">
      {/* Centered 380px panel on ivory bg with subtle brass hairline */}
      <main
        id="main"
        className="shadow-floating relative w-full max-w-[380px] overflow-hidden rounded-[8px] border border-line bg-surface p-7"
      >
        {/* Subtle brass hairline top accent */}
        <div
          className="absolute top-0 right-0 left-0 h-[2px] bg-accent"
          aria-hidden="true"
        />

        <div className="flex flex-col items-center text-center">
          <div className="mb-2 flex items-center gap-2">
            <span className="size-2 rounded-[2px] bg-accent" aria-hidden="true" />
            <span className="font-mono text-[11px] tracking-widest text-ink-muted uppercase">
              Private Ledger
            </span>
          </div>

          <h1 className="text-[26px] font-semibold text-ink">Sardar&apos;s Mall</h1>

          <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">
            Property &amp; commercial inventory access
          </p>
        </div>

        <div className="mt-6 border-t border-line/70 pt-6">
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
