import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { generateErrorRowsWorkbook } from "@/features/import/excel";
import type { ValidatedImportRow } from "@/features/import/types";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    assertCan(session.user.role, "units.import");

    const body = (await req.json()) as {
      headers: string[];
      errorRows: ValidatedImportRow[];
    };

    if (!body || !Array.isArray(body.headers) || !Array.isArray(body.errorRows)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const buffer = await generateErrorRowsWorkbook(body.headers, body.errorRows);

    return new Response(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="import-errors-${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error generating workbook";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
