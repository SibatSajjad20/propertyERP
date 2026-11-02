import { NextResponse } from "next/server";
import { expireReservationsCron } from "@/features/sales/actions";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await expireReservationsCron();
  return NextResponse.json({ ok: true, ...result });
}
