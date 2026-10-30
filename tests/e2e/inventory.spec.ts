import { expect, test } from "@playwright/test";
import { cleanupTestData, guardEnvironment } from "./e2e-guard";

const inventoryEmail = process.env.INVENTORY_EMAIL ?? "inventory@sardarsmall.local";
const inventoryPassword = process.env.INVENTORY_PASSWORD ?? "ChangeMe_Inventory_2026!";
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

test.afterAll(async () => {
  await cleanupTestData(["E2E", "SALES-"]);
});

test("inventory manager creates a unit and sees the computed total", async ({ page }) => {
  await signIn(page, inventoryEmail, inventoryPassword);
  await page.goto("/inventory");
  await expect(page.getByRole("columnheader", { name: "Unit code" })).toBeVisible();

  await page.getByRole("button", { name: "New unit" }).click();
  const panel = page.getByRole("dialog");
  const code = `E2E-${Date.now()}`;
  await panel.getByLabel("Unit code").fill(code);
  await panel.getByLabel("Unit number").fill("E1");
  await panel.locator("#unit-floor").selectOption({ index: 0 });
  await panel.getByLabel("Category").selectOption({ label: "Shop" });
  await panel.getByLabel("Net area (sq ft)").fill("100.00");
  await panel.getByLabel("Rate per sq ft (PKR)").fill("25000.00");
  await expect(panel.getByText("Rs 25,00,000")).toBeVisible();
  await panel.getByRole("button", { name: "Save unit" }).click();
  const saved = page.getByRole("dialog");
  await expect(saved.getByRole("heading", { name: code })).toBeVisible({
    timeout: 15_000,
  });
  await expect(saved.getByText("Rs 25,00,000").first()).toBeVisible();
  await saved.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("cell", { name: code })).toBeVisible();
});

test("inventory filters are shareable via the URL", async ({ page }) => {
  await signIn(page, inventoryEmail, inventoryPassword);
  await page.goto("/inventory?status=SOLD&missingGross=1");
  await expect(page.getByLabel("Status")).toHaveValue("SOLD");
  await expect(page.getByLabel("Missing gross area")).toBeChecked();
  await expect(page).toHaveURL(/status=SOLD/);
  await expect(page).toHaveURL(/missingGross=1/);
});

test("sales cannot edit units, including via a direct server action", async ({
  page,
}) => {
  await signIn(page, salesEmail, salesPassword);
  await page.goto("/inventory");
  await expect(page.getByRole("columnheader", { name: "Unit code" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "New unit" })).toHaveCount(0);

  const floorId = await page.locator("#filter-floor option").nth(1).getAttribute("value");
  const categoryId = await page
    .locator("#filter-category option")
    .nth(1)
    .getAttribute("value");
  expect(floorId).toBeTruthy();
  expect(categoryId).toBeTruthy();
  await page.waitForFunction(
    () =>
      typeof (window as unknown as { __erpCreateUnit?: unknown }).__erpCreateUnit ===
      "function",
  );

  const result = await page.evaluate(
    async (payload) => {
      const fn = (
        window as unknown as {
          __erpCreateUnit?: (input: unknown) => Promise<unknown>;
        }
      ).__erpCreateUnit;
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
      unitCode: `SALES-${Date.now()}`,
      unitNumber: "X1",
      floorId,
      categoryId,
      netAreaSqft: "100.00",
      ratePerSqftPkr: "10000.00",
      priceAdjustmentPkr: "0",
      isSellable: true,
    },
  );

  expect(result).not.toBe("ok");
  expect(result).not.toBe("missing-hook");
});
