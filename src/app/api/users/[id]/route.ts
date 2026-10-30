import { NextResponse } from "next/server";
import {
  resetUserPassword,
  setUserDisabled,
  updateUserRole,
} from "@/features/users/actions";
import { jsonError } from "@/lib/http";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.role === "string") {
      const updated = await updateUserRole({ id, role: body.role });
      return NextResponse.json(updated);
    }
    if (typeof body.disabled === "boolean") {
      const updated = await setUserDisabled({ id, disabled: body.disabled });
      return NextResponse.json(updated);
    }
    if (typeof body.temporaryPassword === "string") {
      const updated = await resetUserPassword({
        id,
        temporaryPassword: body.temporaryPassword,
      });
      return NextResponse.json(updated);
    }
    return NextResponse.json({ error: "No supported field to update" }, { status: 422 });
  } catch (error) {
    return jsonError(error);
  }
}
