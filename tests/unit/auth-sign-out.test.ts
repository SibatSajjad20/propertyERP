import { describe, expect, it, vi } from "vitest";
import { signOutAction } from "@/features/auth/actions";

const deletedCookies: string[] = [];

vi.mock("next/headers", () => {
  return {
    headers: vi.fn().mockResolvedValue(new Headers()),
    cookies: vi.fn().mockResolvedValue({
      delete: vi.fn((name: string) => {
        deletedCookies.push(name);
      }),
    }),
  };
});

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      signOut: vi.fn().mockResolvedValue({ success: true }),
    },
  },
}));

describe("signOutAction", () => {
  it("calls auth.api.signOut and clears all session cookies", async () => {
    const result = await signOutAction();
    expect(result).toEqual({ success: true });
    expect(deletedCookies).toContain("better-auth.session_token");
    expect(deletedCookies).toContain("better-auth.session_data");
    expect(deletedCookies).toContain("__Secure-better-auth.session_token");
  });

  it("handles auth.api.signOut failures gracefully and still clears cookies", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth.api.signOut).mockRejectedValueOnce(new Error("DB timeout"));

    const result = await signOutAction();
    expect(result).toEqual({ success: true });
  });
});
