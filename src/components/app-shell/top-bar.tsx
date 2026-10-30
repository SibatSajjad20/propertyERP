"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { CommandMenu } from "./command-menu";

type TopBarProps = {
  title: string;
  userName: string;
  role: string;
};

export function TopBar({ title, userName, role }: TopBarProps) {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="flex h-[var(--topbar-height)] items-center justify-between border-b border-line bg-bg px-4">
      <div>
        <h1 className="font-display text-[18px] leading-none text-ink">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <p className="hidden text-[12px] text-ink-muted sm:block">
          {userName}
          <span className="mx-1.5 text-line">|</span>
          {role.replaceAll("_", " ")}
        </p>
        <p className="hidden text-[11px] text-ink-muted md:block">Ctrl+K</p>
        <Button variant="outline" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
      <CommandMenu />
    </header>
  );
}
