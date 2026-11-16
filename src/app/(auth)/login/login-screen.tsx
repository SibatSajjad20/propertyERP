"use client";

import { CalendarCheck, ChartBar, Receipt, Storefront } from "@phosphor-icons/react";
import { motion, MotionConfig } from "motion/react";
import Image from "next/image";
import { LoginForm } from "./login-form";

const FEATURES = [
  { icon: Storefront, lines: ["Units", "Inventory"] },
  { icon: CalendarCheck, lines: ["Bookings &", "Reservations"] },
  { icon: Receipt, lines: ["Client Ledger"] },
  { icon: ChartBar, lines: ["Real-time", "Insights"] },
] as const;

const heroEase = [0.16, 1, 0.3, 1] as const;

function fadeUp(y: number, duration: number, delay: number) {
  return {
    initial: { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration, delay, ease: heroEase },
  };
}

function BrandMark({
  size,
  variant = "light",
}: {
  size: 40 | 36;
  variant?: "dark" | "light";
}) {
  const isDark = variant === "dark";
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-lg ${
        isDark
          ? "size-10 border border-white/20 bg-white/10 p-1.5 shadow-sm backdrop-blur-sm"
          : "size-9 border border-[#0B558B]/15 bg-[#0B558B]/5 p-1"
      }`}
      aria-hidden="true"
    >
      <Image
        src={isDark ? "/images/logo-mark-white.png" : "/images/logo-mark.png"}
        alt="Sardar's Mall logo mark"
        width={size}
        height={size}
        className="size-full object-contain"
        priority
      />
    </div>
  );
}

function ArchitectureSketchTop() {
  return (
    <svg
      className="pointer-events-none absolute -top-8 -right-10 h-[300px] w-[280px] opacity-60"
      viewBox="0 0 280 300"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="#CBD2DA" strokeWidth="1">
        <path d="M86 78 L154 28 L248 58 L248 250 L86 250 Z" />
        <path d="M86 78 L86 250" />
        <path d="M154 28 L154 250" />
        <path d="M201 43 L201 250" />
        {Array.from({ length: 9 }, (_, row) => (
          <path key={`h-${row}`} d={`M90 ${96 + row * 16} L248 ${96 + row * 16}`} />
        ))}
        {Array.from({ length: 3 }, (_, col) => (
          <path key={`v-${col}`} d={`M${118 + col * 28} 78 L${118 + col * 28} 250`} />
        ))}
        <path d="M40 128 L86 108 L86 250 L40 250 Z" />
        {Array.from({ length: 7 }, (_, row) => (
          <path key={`w-h-${row}`} d={`M44 ${140 + row * 14} L82 ${140 + row * 14}`} />
        ))}
        <path d="M63 128 L63 250" />
      </g>
    </svg>
  );
}

function ArchitectureSketchBottom() {
  return (
    <svg
      className="pointer-events-none absolute -right-8 -bottom-10 h-[220px] w-[340px] opacity-60"
      viewBox="0 0 340 220"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="#CBD2DA" strokeWidth="1">
        <rect x="24" y="78" width="210" height="110" />
        <rect x="150" y="38" width="170" height="150" />
        <path d="M150 38 L200 12 L320 12 L320 188" />
        {Array.from({ length: 5 }, (_, row) => (
          <path key={`bh-${row}`} d={`M28 ${96 + row * 16} L234 ${96 + row * 16}`} />
        ))}
        {Array.from({ length: 8 }, (_, col) => (
          <path key={`bv-${col}`} d={`M${48 + col * 22} 78 L${48 + col * 22} 188`} />
        ))}
        {Array.from({ length: 6 }, (_, row) => (
          <path key={`th-${row}`} d={`M154 ${52 + row * 18} L316 ${52 + row * 18}`} />
        ))}
        {Array.from({ length: 5 }, (_, col) => (
          <path key={`tv-${col}`} d={`M${178 + col * 26} 38 L${178 + col * 26} 188`} />
        ))}
      </g>
    </svg>
  );
}

export function LoginScreen() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-dvh min-h-dvh w-full overflow-hidden">
        <aside className="relative hidden h-dvh w-[55%] overflow-hidden lg:flex lg:flex-col">
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.04 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <Image
              src="/images/sardar-mall-building.jpg"
              alt="Sardar's Mall commercial building"
              fill
              priority
              quality={85}
              className="object-cover object-center"
              sizes="55vw"
            />
          </motion.div>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(4,24,42,0.95) 0%, rgba(8,52,88,0.78) 45%, rgba(11,85,139,0.22) 100%)",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex h-full flex-col px-14 py-12">
            <div className="flex items-center">
              <BrandMark size={40} variant="dark" />
              <span className="mx-4 h-7 w-px bg-white/25" aria-hidden="true" />
              <span className="text-[15px] font-medium text-white">
                Sardar&apos;s Mall
              </span>
            </div>

            <div className="mt-[max(2.5rem,calc(38vh-5.5rem))]">
              <motion.p
                className="text-[40px] leading-[1.15] font-normal tracking-tight text-white"
                {...fadeUp(8, 0.4, 0)}
              >
                Commercial inventory,
                <br />
                <span className="text-[#A3BED2]">smarter</span> management.
              </motion.p>
              <motion.p
                className="mt-5 max-w-[420px] text-[15px] leading-[1.6] text-white/[0.72]"
                {...fadeUp(8, 0.4, 0.06)}
              >
                Manage units, bookings, reservations and client ledger — all in one
                powerful platform.
              </motion.p>
              <motion.ul className="mt-12 flex items-stretch" {...fadeUp(8, 0.4, 0.12)}>
                {FEATURES.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <li
                      key={feature.lines.join(" ")}
                      className={`px-5 ${index === 0 ? "pl-0" : "border-l border-white/[0.15]"}`}
                    >
                      <Icon
                        weight="regular"
                        className="size-6 text-[#A3BED2]"
                        aria-hidden="true"
                      />
                      <p className="mt-3 text-[12px] leading-tight text-white/80">
                        {feature.lines.map((line, lineIndex) => (
                          <span key={line}>
                            {lineIndex > 0 ? <br /> : null}
                            {line}
                          </span>
                        ))}
                      </p>
                    </li>
                  );
                })}
              </motion.ul>
            </div>

            <div className="mt-auto flex items-center gap-3">
              <span className="h-px w-8 bg-white/40" aria-hidden="true" />
              <p className="text-[12px] text-white/60">Sardar&apos;s Mall Property ERP</p>
            </div>
          </div>
        </aside>

        <main
          id="main"
          className="relative flex h-dvh min-h-dvh w-full items-center justify-center overflow-y-auto bg-[#F3F5F7] px-6 py-8 lg:w-[45%] lg:overflow-hidden"
        >
          <ArchitectureSketchTop />
          <ArchitectureSketchBottom />

          <motion.div
            className="relative z-10 w-full max-w-[440px] rounded-xl border border-[#E3E7EC] bg-white/80 p-10 shadow-[0_1px_2px_rgba(16,24,40,0.04)] backdrop-blur-sm"
            {...fadeUp(6, 0.35, 0.1)}
          >
            <div className="flex items-center">
              <BrandMark size={36} />
              <span className="mx-4 h-7 w-px bg-[#DDE2E8]" aria-hidden="true" />
              <span className="text-[15px] font-medium text-[#0F172A]">
                Sardar&apos;s Mall
              </span>
            </div>

            <h1
              id="login-title"
              className="mt-8 text-[26px] font-semibold tracking-tight text-[#0F172A]"
            >
              Welcome Back
            </h1>
            <p className="mt-2 text-[14px] text-[#64748B]">
              Sign in to continue to your dashboard
            </p>

            <LoginForm />
          </motion.div>
        </main>
      </div>
    </MotionConfig>
  );
}
