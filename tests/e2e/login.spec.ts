import { expect, test } from "@playwright/test";
import { guardEnvironment } from "./e2e-guard";

const email = process.env.ADMIN_EMAIL ?? "admin@sardarsmall.local";
const password = process.env.ADMIN_PASSWORD ?? "ChangeMe_Admin_2026!";

test.beforeAll(() => {
  guardEnvironment();
});

test("admin can sign in and reach inventory", async ({ page }) => {
  page.on("pageerror", (err) => console.error("PAGE ERROR:", err));
  page.on("console", (msg) => console.log("BROWSER CONSOLE:", msg.type(), msg.text()));
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sardar's Mall" })).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/inventory/, { timeout: 15_000 });
  await expect(page.getByText(/unit/i).first()).toBeVisible({ timeout: 15_000 });
});
