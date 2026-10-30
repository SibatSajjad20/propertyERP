import { expect, test } from "@playwright/test";

const email = process.env.ADMIN_EMAIL ?? "admin@sardarsmall.local";
const password = process.env.ADMIN_PASSWORD ?? "ChangeMe_Admin_2026!";

test("admin can sign in and reach inventory", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sardar's Mall" })).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/inventory/);
  await expect(page.getByText(/unit/i).first()).toBeVisible();
});
