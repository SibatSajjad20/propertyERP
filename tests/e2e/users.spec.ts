import { expect, test } from "@playwright/test";
import { guardEnvironment } from "./e2e-guard";

const salesEmail = process.env.SALES_EMAIL ?? "sales@sardarsmall.local";
const salesPassword = process.env.SALES_PASSWORD ?? "ChangeMe_Sales_2026!";

async function signIn(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/inventory/, { timeout: 15_000 });
}

test.beforeAll(() => {
  guardEnvironment();
});

test("sales cannot open admin pages or call user admin APIs", async ({ page }) => {
  await signIn(page, salesEmail, salesPassword);

  await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Audit log" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Import" })).toHaveCount(0);

  for (const path of ["/settings/users", "/users", "/audit", "/import"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/inventory/, { timeout: 15_000 });
  }

  const create = await page.request.post("/api/users", {
    data: {
      name: "Blocked",
      email: `blocked-${Date.now()}@sardarsmall.local`,
      role: "SALES",
      temporaryPassword: "Temporary1!",
    },
  });
  expect(create.status()).toBe(403);

  const list = await page.request.get("/api/users");
  expect(list.status()).toBe(403);
});
