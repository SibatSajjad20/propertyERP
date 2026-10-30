import { NextRequest, NextResponse } from "next/server";
import { inventoryExportRows } from "@/features/export/queries";
import { workbookToBuffer } from "@/features/export/workbook";
import { parseInventorySearchParams } from "@/features/units/schema";
import { requireSession } from "@/lib/auth";
import { errorMessage } from "@/lib/errors";
import { assertCan } from "@/lib/permissions";

export const instant = false;

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    assertCan(session.user.role, "units.export");
    const raw: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      raw[key] = value;
    });
    const query = parseInventorySearchParams(raw);
    const rows = await inventoryExportRows(query);
    const buffer = await workbookToBuffer([{ name: "inventory", rows }]);
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="sardars-mall-inventory-${stamp}.xlsx"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
