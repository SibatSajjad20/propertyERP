import { describe, expect, it } from "vitest";
import { isTransientDbError, WAKING_DB_MESSAGE, withDbRetry } from "@/lib/db-errors";

describe("db errors", () => {
  it("treats Neon cold-start messages as transient", () => {
    expect(isTransientDbError(new Error("the compute is not active"))).toBe(true);
    expect(isTransientDbError(new Error("connect ETIMEDOUT"))).toBe(true);
    expect(isTransientDbError(new Error("permission denied"))).toBe(false);
  });

  it("retries transient failures then succeeds", async () => {
    let attempts = 0;
    const value = await withDbRetry(async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new Error("connection timeout");
      }
      return "ok";
    });
    expect(value).toBe("ok");
    expect(attempts).toBe(3);
  });

  it("exposes a friendly waking message constant", () => {
    expect(WAKING_DB_MESSAGE.toLowerCase()).toContain("waking");
  });
});
