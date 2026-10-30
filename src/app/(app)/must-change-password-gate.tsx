"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function MustChangePasswordGate({
  mustChangePassword,
  children,
}: {
  mustChangePassword: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const onProfile = pathname === "/settings/profile";

  useEffect(() => {
    if (mustChangePassword && !onProfile) {
      router.replace("/settings/profile" as never);
    }
  }, [mustChangePassword, onProfile, router]);

  if (mustChangePassword && !onProfile) {
    return (
      <p className="text-[13px] text-ink-muted">
        You must change your temporary password before continuing.
      </p>
    );
  }

  return children;
}
