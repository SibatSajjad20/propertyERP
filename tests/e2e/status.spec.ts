import { expect, test } from "@playwright/test";
import { cleanupTestData, guardEnvironment } from "./e2e-guard";

const inventoryEmail = process.env.INVENTORY_EMAIL ?? "inventory@sardarsmall.local";
const inventoryPassword = process.env.INVENTORY_PASSWORD ?? "ChangeMe_Inventory_2026!";
const salesEmail = process.env.SALES_EMAIL ?? "sales@sardarsmall.local";
const salesPassword = process.env.SALES_PASSWORD ?? "ChangeMe_Sales_2026!";
const adminEmail = process.env.ADMIN_EMAIL ?? "admin@sardarsmall.local";
const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe_Admin_2026!";

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

async function signOut(page: import("@playwright/test").Page) {
  const dialog = page.getByRole("dialog");
  if (await dialog.isVisible()) {
    const closeBtn = dialog.getByRole("button", { name: "Close" });
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  }
  await page
    .getByRole("button", { name: "Account menu" })
    .filter({ visible: true })
    .click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
}

async function createUnit(page: import("@playwright/test").Page, code: string) {
  await page.getByRole("link", { name: "New unit" }).click();
  await expect(page).toHaveURL(/\/units\/new/, { timeout: 15_000 });
  await page.getByLabel("Unit code").fill(code);
  await page.getByLabel("Unit number").fill("E1");
  await page.locator("#unit-floor").selectOption({ index: 0 });
  await page.locator("#unit-category").selectOption({ label: "Shop" });
  await page.getByLabel("Net area (sq ft)").fill("100.00");
  await page.getByLabel("Rate per sq ft (PKR)").fill("25000.00");
  await page.getByRole("button", { name: "Save unit" }).click();
  await expect(page.locator(".unit-code", { hasText: code }).first()).toBeVisible({
    timeout: 15_000,
  });
}

async function openUnit(page: import("@playwright/test").Page, code: string) {
  await page.goto(`/inventory?q=${encodeURIComponent(code)}`);
  await page.getByRole("cell", { name: code }).click();
  await expect(page).toHaveURL(/\/units\/[0-9a-f-]+/, { timeout: 15_000 });
  await expect(page.locator(".unit-code", { hasText: code }).first()).toBeVisible({
    timeout: 15_000,
  });
  return page;
}

test.beforeAll(() => {
  guardEnvironment();
});

test.afterAll(async () => {
  await cleanupTestData(["ST-", "RV-", "E2E"]);
});

test("sales marks a unit sold and cannot reverse it", async ({ page }) => {
  test.setTimeout(60_000);
  const code = `ST-${Date.now()}`;
  await signIn(page, inventoryEmail, inventoryPassword);
  await page.goto("/inventory");
  await createUnit(page, code);
  await signOut(page);

  await signIn(page, salesEmail, salesPassword);
  const panel = await openUnit(page, code);
  await panel.getByRole("button", { name: "Mark as Sold" }).click();
  await panel.locator("#sale-booking-ref").fill("BK-E2E-1");
  await panel.getByLabel("Note (optional)").fill("Walk-in buyer");
  await panel.getByRole("button", { name: "Confirm sale" }).click();

  await expect(panel.getByText("Sold", { exact: true }).first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(panel.getByText("Available → Sold")).toBeVisible();
  await expect(panel.getByText("Booking ref BK-E2E-1")).toBeVisible();
  await expect(panel.getByText(/Sold price Rs/)).toBeVisible();
  await expect(panel.getByRole("button", { name: "Reverse sale" })).toHaveCount(0);
  await expect(panel.getByRole("button", { name: "Mark as Sold" })).toHaveCount(0);

  const unitId =
    page.url().match(/\/units\/([0-9a-f-]+)/)?.[1] ||
    new URL(page.url()).searchParams.get("unitId") ||
    new URL(page.url()).searchParams.get("unit");
  expect(unitId).toBeTruthy();
  await page.waitForFunction(
    () =>
      typeof (window as unknown as { __erpChangeUnitStatus?: unknown })
        .__erpChangeUnitStatus === "function",
  );

  const result = await page.evaluate(
    async (payload) => {
      const fn = (
        window as unknown as {
          __erpChangeUnitStatus?: (input: unknown) => Promise<unknown>;
        }
      ).__erpChangeUnitStatus;
      if (!fn) {
        return "missing-hook";
      }
      try {
        await fn(payload);
        return "ok";
      } catch (error) {
        return error instanceof Error ? error.message : "rejected";
      }
    },
    {
      unitId,
      expectedVersion: 2,
      toStatus: "AVAILABLE",
      reason: "Customer cancelled the booking",
    },
  );

  expect(result).not.toBe("ok");
  expect(result).not.toBe("missing-hook");
});

test("admin reverses a sale with a reason", async ({ page }) => {
  test.setTimeout(60_000);
  const code = `RV-${Date.now()}`;
  await signIn(page, inventoryEmail, inventoryPassword);
  await page.goto("/inventory");
  await createUnit(page, code);
  await page.getByRole("button", { name: "Mark as Sold" }).click();
  await page.locator("#sale-booking-ref").fill("BK-E2E-2");
  await page.getByRole("button", { name: "Confirm sale" }).click();
  await expect(page.getByText("Sold", { exact: true }).first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText("Available → Sold")).toBeVisible();
  await signOut(page);

  await signIn(page, adminEmail, adminPassword);
  const panel = await openUnit(page, code);
  await panel.getByRole("button", { name: "Reverse sale" }).click();
  await panel.getByLabel("Reason").fill("Buyer financing fell through");
  await panel.getByRole("button", { name: "Confirm reverse" }).click();

  await expect(panel.getByText("Sold → Available")).toBeVisible();
  await expect(panel.getByText("Buyer financing fell through")).toBeVisible();
  await expect(panel.getByRole("button", { name: "Mark as Sold" })).toBeVisible();
});
