import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { guardEnvironment } from "./e2e-guard";

const adminEmail = process.env.ADMIN_EMAIL ?? "admin@sardarsmall.local";
const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe_Admin_2026!";
const screenshotDir = path.resolve(process.cwd(), "docs/screenshots");

test.beforeAll(() => {
  guardEnvironment();
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
});

test("capture high-resolution screenshots of all screens at 1440x900", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });

  // 1. Login screen
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sardar's Mall" })).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(screenshotDir, "01-login.png") });

  // Sign in as admin
  await page.getByLabel("Email").fill(adminEmail);
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/inventory/, { timeout: 30_000 });
  await expect(page.getByText(/unit/i).first()).toBeVisible({ timeout: 15_000 });

  // 2. Dashboard
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({
    timeout: 15_000,
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotDir, "02-dashboard.png") });

  // 3. Inventory
  await page.goto("/inventory");
  await expect(page.getByRole("columnheader", { name: "Unit code" })).toBeVisible({
    timeout: 15_000,
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotDir, "03-inventory.png") });

  // 4. Inventory Unit Side Panel (Sheet)
  const unitCell = page.locator("tbody tr[tabindex='0'] td").first();
  await unitCell.waitFor({ state: "visible", timeout: 10_000 });
  await unitCell.click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(600); // allow 240ms slide transition to finish
  await page.screenshot({ path: path.join(screenshotDir, "04-unit-panel.png") });
  await sheet.getByRole("button", { name: "Close" }).click();
  await expect(sheet).toHaveCount(0);

  // 5. Structure
  await page.goto("/structure");
  await expect(page.getByRole("heading", { name: "Structure" })).toBeVisible({
    timeout: 15_000,
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotDir, "05-structure.png") });

  // 6. Users
  await page.goto("/users");
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible({
    timeout: 15_000,
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotDir, "06-users.png") });

  // 7. Audit log
  await page.goto("/audit");
  await expect(page.getByRole("heading", { name: "Audit log" })).toBeVisible({
    timeout: 15_000,
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotDir, "07-audit.png") });

  // 8. Import
  await page.goto("/import");
  await expect(page.getByRole("heading", { name: "Import" })).toBeVisible({
    timeout: 15_000,
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotDir, "08-import.png") });
});
