import { NextResponse } from "next/server";
import { connection } from "next/server";
import { pingDatabase } from "@/db";
import { isTransientDbError, WAKING_DB_MESSAGE } from "@/lib/db-errors";

export async function GET() {
  await connection();
  try {
    await pingDatabase();
    return NextResponse.json({
      ok: true,
      service: "sardars-mall-erp",
      database: "ready",
    });
  } catch (error) {
    const waking = isTransientDbError(error);
    return NextResponse.json(
      {
        ok: false,
        service: "sardars-mall-erp",
        database: waking ? "waking" : "error",
        message: waking ? WAKING_DB_MESSAGE : "Database unavailable",
      },
      { status: waking ? 503 : 500 },
    );
  }
}
