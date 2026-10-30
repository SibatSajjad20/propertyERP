import { describe, expect, it } from "vitest";
import { formatKarachiDate, formatKarachiDateTime } from "@/lib/datetime";

describe("Karachi timestamps", () => {
  it("formats a UTC instant in Asia/Karachi", () => {
    const instant = new Date("2026-10-30T13:30:00.000Z");
    expect(formatKarachiDateTime(instant)).toBe("30 Oct 2026, 6:30 PM");
    expect(formatKarachiDate(instant)).toBe("30 Oct 2026");
  });
});
