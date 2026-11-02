import { describe, expect, it } from "vitest";
import { errorMessage, AppError, ValidationError } from "@/lib/errors";

describe("error utilities", () => {
  it("formats AppError messages accurately", () => {
    expect(errorMessage(new AppError("Custom error", "CODE", 400))).toBe("Custom error");
    expect(errorMessage(new ValidationError("Field is required"))).toBe(
      "Field is required",
    );
  });

  it("masks leaky connection string error patterns", () => {
    const errorWithSecret = new Error(
      "Connection failed at postgres://user:secret@db.host:5432",
    );
    expect(errorMessage(errorWithSecret)).toBe(
      "Something went wrong. Try again, or ask an administrator.",
    );
  });
});
