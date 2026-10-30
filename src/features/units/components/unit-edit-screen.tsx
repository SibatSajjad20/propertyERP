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
import { archiveUnit, updateUnit } from "../actions";
import type { CreateUnitInput, UpdateUnitInput } from "../schema";
import type { InventoryFilterOptions, InventoryRow } from "../types";
import type { UserRole } from "@/db/schema/enums";
import { errorMessage } from "@/lib/errors";

interface UnitEditScreenProps {
  unit: InventoryRow;
  options: InventoryFilterOptions;
  role: UserRole;
}

export function UnitEditScreen({ unit, options, role }: UnitEditScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(values: CreateUnitInput | UpdateUnitInput) {
    if (!("id" in values)) return;
    setPending(true);
    setError(null);
    try {
      const updated = await updateUnit(values);
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["unit-detail", unit.id] });
      toast.success(`Unit ${updated.unitCode} updated successfully`);
      router.push(`/units/${unit.id}`);
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      toast.error(message);
      setPending(false);
      throw caught;
    }
  }

  async function handleArchive() {
    setPending(true);
    setError(null);
    try {
      await archiveUnit({ id: unit.id, version: unit.version });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`Unit ${unit.unitCode} archived`);
      router.push("/inventory");
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      toast.error(message);
      setPending(false);
      throw caught;
    }
  }

  function handleCancel() {
    router.push(`/units/${unit.id}`);
  }

  return (
    <div className="t-page-enter mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col space-y-6">
      <BreadcrumbSet parent="Inventory" current={`Edit ${unit.unitCode}`} />
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/units/${unit.id}`} className="text-ink-muted hover:text-ink">
            <ArrowLeft weight="light" className="mr-1 size-3.5" />
            Back to Unit {unit.unitCode}
          </Link>
        </Button>
      </div>

      <div className="border-b border-line pb-4">
        <div className="flex items-center gap-2">
          <span className="unit-code font-mono text-[13px] font-semibold text-primary">
            {unit.unitCode}
          </span>
          <span className="text-[13px] text-ink-muted">· Unit {unit.unitNumber}</span>
        </div>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-ink">
          Edit Unit
        </h1>
      </div>

      <div className="card overflow-hidden p-6 sm:p-8">
        <UnitForm
          mode="edit"
          options={options}
          role={role}
          unit={unit}
          error={error}
          pending={pending}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onArchive={handleArchive}
        />
      </div>
    </div>
  );
}
