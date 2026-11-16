import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { allocateReceiptNumber } from "@/features/sales/document-numbers";
import { assertTestDatabase } from "@/lib/test-db-guard";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("receipt number concurrency", () => {
  it("allocates 20 unique SM-DPR numbers from parallel transactions", async () => {
    assertTestDatabase();
    const date = new Date(Date.UTC(2098, 5, 1));
    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        db.transaction((tx) => allocateReceiptNumber(tx, date)),
      ),
    );
    expect(new Set(results).size).toBe(20);
    for (const no of results) {
      expect(no).toMatch(/^SM-DPR-98-\d{4,}$/);
    }
  }, 30_000);
});
