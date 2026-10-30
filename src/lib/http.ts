import { NextResponse } from "next/server";
import { errorCode, errorMessage, errorStatus } from "./errors";

export function jsonError(error: unknown) {
  return NextResponse.json(
    { error: errorMessage(error), code: errorCode(error) },
    { status: errorStatus(error) },
  );
}
