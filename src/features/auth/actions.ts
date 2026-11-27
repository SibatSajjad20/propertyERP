"use server";

import { auth } from "@/lib/auth";
import { cookies, headers } from "next/headers";

/**
 * Server-side sign-out action.
 * Ensures the session is revoked in the database and clears Better Auth cookies
 * directly in HTTP response headers, providing a reliable fallback if client fetch fails.
 */
export async function signOutAction(): Promise<{ success: boolean }> {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch (error) {
    // If the database connection drops or session was already invalidated,
    // continue to explicitly delete local cookies so the user is signed out.
    console.warn("auth.api.signOut warning:", error);
  }

  const cookieStore = await cookies();
  const sessionCookieNames = [
    "better-auth.session_token",
    "better-auth.session_data",
    "better-auth.dont_remember",
    "__Secure-better-auth.session_token",
    "__Secure-better-auth.session_data",
    "__Secure-better-auth.dont_remember",
  ];

  for (const name of sessionCookieNames) {
    try {
      cookieStore.delete(name);
    } catch {
      // Ignored if outside deletion context
    }
  }

  return { success: true };
}
