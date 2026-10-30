import { afterEach, describe, expect, it } from "vitest";
import {
  LOGIN_MAX_ATTEMPTS,
  LOGIN_WINDOW_MS,
  assertLoginAllowed,
  clearLoginFailures,
  evaluateLoginRateLimit,
  recordFailedLoginAttempt,
  recordLoginFailure,
  resetLoginRateLimitForTests,
} from "@/lib/login-rate-limit";

describe("login rate limit", () => {
  afterEach(() => {
    resetLoginRateLimitForTests();
  });

  it("allows attempts under the cap and blocks at the cap", () => {
    const now = 1_000_000;
    let state = undefined as ReturnType<typeof recordFailedLoginAttempt> | undefined;
    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i += 1) {
      const check = evaluateLoginRateLimit(state, now);
      expect(check.allowed).toBe(true);
      state = recordFailedLoginAttempt(state, now);
    }
    expect(evaluateLoginRateLimit(state, now).allowed).toBe(false);
    expect(evaluateLoginRateLimit(state, now + LOGIN_WINDOW_MS).allowed).toBe(true);
  });

  it("blocks a stored identifier after too many failures", () => {
    const email = "sales@sardarsmall.local";
    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i += 1) {
      assertLoginAllowed(email);
      recordLoginFailure(email);
    }
    expect(() => assertLoginAllowed(email)).toThrow(/too many sign-in/i);
    clearLoginFailures(email);
    expect(() => assertLoginAllowed(email)).not.toThrow();
  });
});
