import "server-only";

import { cache } from "react";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, withTransientDbRetry } from "@/db";
import * as schema from "@/db/schema";
import { user } from "@/db/schema/auth";
import { userRoles, type UserRole } from "@/db/schema/enums";
import { resolveAuthBaseURL, resolveTrustedOrigins } from "./auth-origin";
import { ForbiddenError, UnauthorizedError } from "./errors";
import {
  LOGIN_RATE_LIMIT_MESSAGE,
  LoginRateLimitError,
  assertLoginAllowed,
  clearLoginFailures,
  recordLoginFailure,
} from "./login-rate-limit";

function signInEmail(body: unknown): string {
  if (typeof body !== "object" || body === null) {
    return "";
  }
  const email = (body as { email?: unknown }).email;
  return typeof email === "string" ? email : "";
}

function isFailedAuthResult(returned: unknown): boolean {
  if (!returned) {
    return false;
  }
  if (returned instanceof APIError) {
    return true;
  }
  if (
    typeof returned === "object" &&
    "error" in returned &&
    (returned as { error: unknown }).error
  ) {
    return true;
  }
  return false;
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: resolveAuthBaseURL(),
  trustedOrigins: resolveTrustedOrigins(),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    disableSignUp: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  rateLimit: {
    // Better Auth counts every /api/auth hit. Keep production tight; skip in
    // local/e2e so Playwright logins are not blocked after a busy first spec.
    enabled: process.env.NODE_ENV === "production" && process.env.ALLOW_TEST_DB !== "1",
    window: 60,
    max: 100,
  },
  user: {
    additionalFields: {
      role: {
        type: [...userRoles],
        required: true,
        defaultValue: "SALES",
        input: false,
      },
      disabled: {
        type: "boolean",
        required: true,
        defaultValue: false,
        input: false,
      },
      mustChangePassword: {
        type: "boolean",
        required: true,
        defaultValue: false,
        input: false,
      },
      lastLoginAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
    changeEmail: {
      enabled: false,
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") {
        return;
      }
      const email = signInEmail(ctx.body);
      try {
        assertLoginAllowed(email);
      } catch (error) {
        if (error instanceof LoginRateLimitError) {
          throw new APIError("TOO_MANY_REQUESTS", {
            message: LOGIN_RATE_LIMIT_MESSAGE,
          });
        }
        throw error;
      }
      if (!email) {
        return;
      }
      const [row] = await db
        .select({ disabled: user.disabled })
        .from(user)
        .where(eq(user.email, email.trim().toLowerCase()))
        .limit(1);
      if (row?.disabled) {
        throw new APIError("FORBIDDEN", {
          message: "Invalid email or password.",
        });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") {
        return;
      }
      const email = signInEmail(ctx.body);
      if (!email) {
        return;
      }
      if (isFailedAuthResult(ctx.context.returned)) {
        recordLoginFailure(email);
        return;
      }
      clearLoginFailures(email);
      void db
        .update(user)
        .set({ lastLoginAt: new Date(), updatedAt: new Date() })
        .where(eq(user.email, email.trim().toLowerCase()))
        .catch(() => {});
    }),
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const [row] = await db
            .select({ disabled: user.disabled })
            .from(user)
            .where(eq(user.id, session.userId))
            .limit(1);
          if (row?.disabled) {
            throw new APIError("FORBIDDEN", {
              message: "Invalid email or password.",
            });
          }
          return { data: session };
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
export type SessionUser = Session["user"] & {
  role: UserRole;
  disabled: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: Date | null;
};

type RequireSessionOptions = {
  allowMustChangePassword?: boolean;
  redirect?: boolean;
};

interface UserFlagsCacheEntry {
  expiresAt: number;
  data: {
    mustChangePassword: boolean;
    disabled: boolean;
    role: UserRole;
    name: string;
  };
}

const userFlagsCache = new Map<string, UserFlagsCacheEntry>();
const USER_FLAGS_CACHE_TTL_MS = 60_000; // 60 seconds

export function clearUserFlagsCache(userId?: string) {
  if (userId) {
    userFlagsCache.delete(userId);
  } else {
    userFlagsCache.clear();
  }
}

export const getSession = cache(async () => {
  const resolvedHeaders = await headers();
  const session = await withTransientDbRetry(() =>
    auth.api.getSession({
      headers: resolvedHeaders,
    }),
  );
  if (!session) {
    return null;
  }

  // Live user row flags cached in-memory for 60 seconds to avoid a redundant
  // round trip to remote Supabase on every navigation, while ensuring timely revocation.
  const cachedUserFlags = userFlagsCache.get(session.user.id);
  let row =
    cachedUserFlags && cachedUserFlags.expiresAt > Date.now()
      ? cachedUserFlags.data
      : null;

  if (!row) {
    const [fetchedRow] = await withTransientDbRetry(() =>
      db
        .select({
          mustChangePassword: user.mustChangePassword,
          disabled: user.disabled,
          role: user.role,
          name: user.name,
        })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1),
    );
    if (!fetchedRow) {
      return null;
    }
    row = fetchedRow;
    userFlagsCache.set(session.user.id, {
      expiresAt: Date.now() + USER_FLAGS_CACHE_TTL_MS,
      data: fetchedRow,
    });
  }

  return {
    ...session,
    user: {
      ...session.user,
      mustChangePassword: row.mustChangePassword,
      disabled: row.disabled,
      role: row.role,
      name: row.name,
    },
  };
});

export async function requireSession(options: RequireSessionOptions = {}) {
  const session = await getSession();
  if (!session) {
    if (options.redirect === false) {
      throw new UnauthorizedError();
    }
    redirect("/login");
  }
  const resolved = session as Session & { user: SessionUser };
  if (resolved.user.disabled) {
    if (options.redirect === false) {
      throw new UnauthorizedError("This account is disabled");
    }
    redirect("/login");
  }
  if (resolved.user.mustChangePassword && !options.allowMustChangePassword) {
    if (options.redirect === false) {
      throw new ForbiddenError("Change your temporary password before continuing");
    }
    redirect("/settings/profile");
  }
  return resolved;
}
