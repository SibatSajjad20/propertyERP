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
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/(inventory|dashboard)/, { timeout: 20_000 });
}

test.beforeAll(() => {
  guardEnvironment();
});

test.afterAll(async () => {
  await cleanupTestData(["IMP-"]);
});

test("import route gates SALES role and redirects to inventory", async ({ page }) => {
  await signIn(page, salesEmail, salesPassword);
  await page.goto("/import");
  await expect(page).toHaveURL(/\/inventory/, { timeout: 15_000 });
});

test("full import workflow: upload CSV, map columns, preview validation, commit batch, and rollback", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await signIn(page, inventoryEmail, inventoryPassword);
  await page.goto("/import");

  await expect(page.getByRole("heading", { name: "Batch Import Pipeline" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText("Choose a spreadsheet or drag & drop")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("heading", { name: "Ingested Batches" })).toBeVisible({
    timeout: 15_000,
  });

  const timestamp = Date.now();
  const testUnitCode = `IMP-${timestamp}`;

  // Generate test CSV content in memory with valid and sold rows
  const testCsvContent =
    "Unit Code,Unit No,Floor,Block,Category,Net Area,Rate,Status,Sold Price,Buyer,Notes\n" +
    `${testUnitCode},U${timestamp.toString().slice(-3)},6th,Main,Shop,265.00,18500.00,AVAILABLE,,,Test import unit\n`;

  // Upload file via input
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: `test-import-${timestamp}.csv`,
    mimeType: "text/csv",
    buffer: Buffer.from(testCsvContent),
  });

  // Step 2: Mapping step should appear
  await expect(page.getByRole("heading", { name: "Column Mapping" })).toBeVisible({
    timeout: 15_000,
  });

  // Proceed to validation
  await page.getByRole("button", { name: "Proceed to validation preview" }).click();

  // Step 3: Validation preview table
  await expect(page.getByText("File & Mode")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(testUnitCode)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: /Valid/i })).toBeVisible({
    timeout: 15_000,
  });

  // Commit import
  const commitBtn = page.getByRole("button", { name: /Commit \d+ units/i });
  await expect(commitBtn).toBeEnabled({ timeout: 15_000 });
  await commitBtn.click();

  // Toast / confirmation return to upload screen
  await expect(page.getByText("Choose a spreadsheet or drag & drop")).toBeVisible({
    timeout: 20_000,
  });

  // Check Ingested Batches list has the new batch
  await expect(page.getByText(`test-import-${timestamp}.csv`)).toBeVisible({
    timeout: 15_000,
  });

  // Check the imported unit exists in inventory
  await page.goto("/inventory");
  await expect(page.getByRole("cell", { name: testUnitCode })).toBeVisible({
    timeout: 15_000,
  });

  // Return to import to test rollback action
  await page.goto("/import");
  const rollbackBtn = page.getByRole("button", { name: "Rollback" }).first();
  await expect(rollbackBtn).toBeVisible({ timeout: 15_000 });
  await rollbackBtn.click();

  // Dialog opens
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Rollback latest import batch?")).toBeVisible({
    timeout: 15_000,
  });
  await dialog.getByRole("button", { name: "Confirm Rollback" }).click();

  // Batch marked as rolled back
  await expect(page.getByText("Rolled Back").first()).toBeVisible({ timeout: 15_000 });
});
