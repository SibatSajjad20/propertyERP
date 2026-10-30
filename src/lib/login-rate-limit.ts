export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_RATE_LIMIT_MESSAGE =
  "Too many sign-in attempts. Try again in a few minutes.";

export type LoginAttemptState = {
  count: number;
  windowStartMs: number;
};

const attempts = new Map<string, LoginAttemptState>();

export function normalizeLoginIdentifier(email: string): string {
  return email.trim().toLowerCase();
}

export function evaluateLoginRateLimit(
  state: LoginAttemptState | undefined,
  now: number,
  windowMs = LOGIN_WINDOW_MS,
  maxAttempts = LOGIN_MAX_ATTEMPTS,
): { allowed: boolean; state: LoginAttemptState | undefined } {
  if (!state) {
    return { allowed: true, state };
  }
  if (now - state.windowStartMs >= windowMs) {
    return { allowed: true, state: undefined };
  }
  if (state.count >= maxAttempts) {
    return { allowed: false, state };
  }
  return { allowed: true, state };
}

export function recordFailedLoginAttempt(
  state: LoginAttemptState | undefined,
  now: number,
  windowMs = LOGIN_WINDOW_MS,
): LoginAttemptState {
  if (!state || now - state.windowStartMs >= windowMs) {
    return { count: 1, windowStartMs: now };
  }
  return { count: state.count + 1, windowStartMs: state.windowStartMs };
}

export function assertLoginAllowed(email: string, now = Date.now()): void {
  const key = normalizeLoginIdentifier(email);
  if (!key) {
    return;
  }
  const current = attempts.get(key);
  const result = evaluateLoginRateLimit(current, now);
  if (!result.state) {
    attempts.delete(key);
  } else {
    attempts.set(key, result.state);
  }
  if (!result.allowed) {
    throw new LoginRateLimitError();
  }
}

export function recordLoginFailure(email: string, now = Date.now()): void {
  const key = normalizeLoginIdentifier(email);
  if (!key) {
    return;
  }
  attempts.set(key, recordFailedLoginAttempt(attempts.get(key), now));
}

export function clearLoginFailures(email: string): void {
  attempts.delete(normalizeLoginIdentifier(email));
}

export function resetLoginRateLimitForTests(): void {
  attempts.clear();
}

export class LoginRateLimitError extends Error {
  readonly code = "RATE_LIMIT";
  readonly status = 429;

  constructor(message = LOGIN_RATE_LIMIT_MESSAGE) {
    super(message);
    this.name = "LoginRateLimitError";
  }
}
