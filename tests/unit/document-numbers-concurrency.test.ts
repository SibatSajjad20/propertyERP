import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { allocateDocumentNumbers } from "@/features/sales/document-numbers";
import { assertTestDatabase } from "@/lib/test-db-guard";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("document number concurrency", () => {
  it("allocates 20 unique serials from parallel transactions", async () => {
    assertTestDatabase();
    const date = new Date(Date.UTC(2099, 5, 1));
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        db.transaction((tx) => allocateDocumentNumbers(tx, `GF-P${i + 1}`, date)),
      ),
    );
    const serials = results.map((row) => row.serialNo);
    expect(new Set(serials).size).toBe(20);
    expect(new Set(results.map((row) => row.applicationFormNo)).size).toBe(20);
    expect(new Set(results.map((row) => row.registrationNo)).size).toBe(20);
  }, 60_000);
});
