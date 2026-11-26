"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
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
    <div className="space-y-6">
      <PageHeader title="Create New Unit" back={{ href: "/inventory", label: "Units" }} />

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
  );
}
