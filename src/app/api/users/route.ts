import { NextResponse } from "next/server";
import { createUser } from "@/features/users/actions";
import { listUsers } from "@/features/users/queries";
import { requireSession } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { assertCan } from "@/lib/permissions";

export async function GET() {
  try {
    const session = await requireSession();
    assertCan(session.user.role, "users.read");
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const created = await createUser(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
