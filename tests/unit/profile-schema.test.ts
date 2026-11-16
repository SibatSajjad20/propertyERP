import { describe, expect, it } from "vitest";
import { changeOwnPasswordSchema } from "@/features/profile/schema";

describe("changeOwnPasswordSchema", () => {
  it("rejects a new password that matches the current one", () => {
    const result = changeOwnPasswordSchema.safeParse({
      currentPassword: "Temporary1!",
      newPassword: "Temporary1!",
    });
    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error.issues[0]?.message).toBe(
      "Choose a new password that is different from the current one.",
    );
  });

  it("accepts a different new password of at least 8 characters", () => {
    const result = changeOwnPasswordSchema.safeParse({
      currentPassword: "Temporary1!",
      newPassword: "LedgerReady1!",
    });
    expect(result.success).toBe(true);
  });
});
