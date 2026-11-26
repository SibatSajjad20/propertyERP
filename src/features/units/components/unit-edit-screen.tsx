"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
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
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${unit.unitCode}`}
        idTitle
        back={{ href: `/units/${unit.id}`, label: `Unit ${unit.unitCode}` }}
        meta={[`Unit ${unit.unitNumber}`, unit.floorName, unit.categoryName]}
      />

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
  );
}
