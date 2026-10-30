"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { BreadcrumbSet } from "@/components/app-shell/breadcrumb-set";
import { UnitForm } from "./unit-form";
import { createUnit } from "../actions";
import type { CreateUnitInput, UpdateUnitInput } from "../schema";
import type { InventoryFilterOptions } from "../types";
import type { UserRole } from "@/db/schema/enums";
import { errorMessage } from "@/lib/errors";

interface UnitCreateScreenProps {
  options: InventoryFilterOptions;
  role: UserRole;
}

export function UnitCreateScreen({ options, role }: UnitCreateScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(values: CreateUnitInput | UpdateUnitInput) {
    if (!("unitNumber" in values)) return;
    setPending(true);
    setError(null);
    try {
      const created = await createUnit(values);
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`Unit ${created.unitCode} created successfully`);
      router.push(`/units/${created.id}`);
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      toast.error(message);
      setPending(false);
      throw caught;
    }
  }

  function handleCancel() {
    router.push("/inventory");
  }

  return (
    <div className="t-page-enter mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col space-y-6">
      <BreadcrumbSet parent="Inventory" current="New unit" />
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/inventory" className="text-ink-muted hover:text-ink">
            <ArrowLeft weight="light" className="mr-1 size-3.5" />
            Back to Inventory
          </Link>
        </Button>
      </div>

      <div className="border-b border-line pb-4">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">
          Create New Unit
        </h1>
        <p className="mt-1 text-[13px] text-ink-muted">
          Add a new commercial property unit to the ledger.
        </p>
      </div>

      <div className="card overflow-hidden p-6 sm:p-8">
        <UnitForm
          mode="create"
          options={options}
          role={role}
          error={error}
          pending={pending}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
