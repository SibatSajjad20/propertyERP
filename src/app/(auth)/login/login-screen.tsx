"use client";

import Image from "next/image";
import { LoginForm } from "./login-form";

export function LoginScreen() {
  return (
    <div className="flex min-h-dvh w-full overflow-hidden bg-[#F6F7F9]">
      {/* Left panel: Building photo with solid dark overlay band */}
      <aside className="relative hidden h-dvh w-[55%] overflow-hidden lg:flex lg:flex-col">
        <div className="absolute inset-0">
          <Image
            src="/images/sardar-mall-building.jpg"
            alt="Sardar's Mall commercial building"
            fill
            priority
            quality={90}
            className="object-cover object-center"
            sizes="55vw"
          />
        </div>

        {/* Solid dark overlay band holding logo, headline, and subline */}
        <div className="absolute inset-x-0 bottom-0 z-10 bg-black/60 p-10 text-white backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 p-1.5 backdrop-blur-sm">
              <Image
                src="/images/logo-mark-white.png"
                alt="Sardar's Mall logo mark"
                width={36}
                height={36}
                className="size-full object-contain"
                priority
              />
            </div>
            <div className="h-6 w-px bg-white/25" aria-hidden="true" />
            <span className="text-[14px] font-semibold tracking-wide text-white">
              Sardar&apos;s Mall{" "}
              <span className="font-normal text-white/70">/ Property ERP</span>
            </span>
          </div>

          <h2 className="mt-4 text-[26px] leading-tight font-semibold tracking-tight text-white">
            Every unit, booking and rupee in one place.
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-white/80">
            Inventory, reservations, installments and reports for the sales office.
          </p>
        </div>
      </aside>

      {/* Right panel: 380px centered form */}
      <main
        id="main"
        className="flex min-h-dvh w-full flex-1 items-center justify-center p-6 lg:w-[45%] lg:p-12"
      >
        <div className="w-full max-w-[380px] rounded-xl border border-line bg-surface p-8 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/5 p-1">
              <Image
                src="/images/logo-mark.png"
                alt="Sardar's Mall logo mark"
                width={32}
                height={32}
                className="size-full object-contain"
                priority
              />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-ink">
              Sardar&apos;s Mall
            </span>
          </div>

          <h1
            id="login-title"
            className="mt-6 text-[22px] font-semibold tracking-tight text-ink"
          >
            Welcome back
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            Sign in to access your sales workspace
          </p>

          <LoginForm />

          <p className="mt-6 text-center text-[12px] text-ink-muted">
            Access is invite-only. Contact your administrator if you need an account.
          </p>
        </div>
      </main>
    </div>
  );
}
