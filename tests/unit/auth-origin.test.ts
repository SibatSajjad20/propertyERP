import { describe, expect, it } from "vitest";
import {
  resolveAuthBaseURL,
  resolveTrustedOrigins,
  vercelOrigin,
} from "@/lib/auth-origin";

describe("auth origin", () => {
  it("prefers the preview Vercel URL over BETTER_AUTH_URL", () => {
    expect(
      resolveAuthBaseURL({
        VERCEL_ENV: "preview",
        VERCEL_URL: "erp-git-feat.vercel.app",
        BETTER_AUTH_URL: "https://erp.example.com",
      }),
    ).toBe("https://erp-git-feat.vercel.app");
  });

  it("includes https VERCEL_URL in trusted origins", () => {
    const origins = resolveTrustedOrigins({
      BETTER_AUTH_URL: "https://erp.example.com",
      VERCEL_URL: "erp-git-feat.vercel.app",
    });
    expect(origins).toContain("https://erp.example.com");
    expect(origins).toContain("https://erp-git-feat.vercel.app");
    expect(vercelOrigin("erp-git-feat.vercel.app")).toBe(
      "https://erp-git-feat.vercel.app",
    );
  });
});
