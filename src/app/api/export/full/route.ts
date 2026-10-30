import { NextResponse } from "next/server";
import { fullExportSheets } from "@/features/export/queries";
import { workbookToBuffer } from "@/features/export/workbook";
import { requireSession } from "@/lib/auth";
import { errorMessage } from "@/lib/errors";
import { assertCan } from "@/lib/permissions";

export const instant = false;

export async function GET() {
  try {
    const session = await requireSession();
    assertCan(session.user.role, "data.export");
    const sheets = await fullExportSheets();
    const buffer = await workbookToBuffer(sheets);
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="sardars-mall-full-export-${stamp}.xlsx"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
