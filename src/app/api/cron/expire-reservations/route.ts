import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { expireReservationsCron } from "@/features/sales/cron";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "Server misconfiguration: CRON_SECRET is not configured." },
      { status: 500 },
    );
  }

  const expected = `Bearer ${cronSecret}`;
  const isMatch =
    Boolean(authHeader) &&
    authHeader!.length === expected.length &&
    timingSafeEqual(Buffer.from(authHeader!), Buffer.from(expected));

  if (!isMatch) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await expireReservationsCron();
  return NextResponse.json({ ok: true, ...result });
}
