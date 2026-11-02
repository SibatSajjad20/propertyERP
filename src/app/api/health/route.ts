import { NextResponse } from "next/server";
import { connection } from "next/server";
import { pingDatabase } from "@/db";

export async function GET() {
  await connection();
  try {
    await pingDatabase();
    return NextResponse.json({
      ok: true,
      service: "sardars-mall-erp",
      database: "ready",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        service: "sardars-mall-erp",
        database: "error",
        message: "Database unavailable",
      },
      { status: 500 },
    );
  }
}
