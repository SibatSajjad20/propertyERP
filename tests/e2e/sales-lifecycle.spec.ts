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
  await page.context().clearCookies();
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
  await page.getByLabel("Unit number").fill("LC1");
  await page.locator("#unit-floor").selectOption({ index: 0 });
  await page.locator("#unit-category").selectOption({ label: "Shop" });
  await page.getByLabel("Net area (sq ft)").fill("100.00");
  await page.getByLabel("Rate per sq ft (PKR)").fill("20000.00"); // 2,000,000 PKR
  await page.getByRole("button", { name: "Save unit" }).click();
  await expect(page.locator(".unit-code", { hasText: code }).first()).toBeVisible({
    timeout: 15_000,
  });
}

test.beforeAll(() => {
  guardEnvironment();
});

test.afterAll(async () => {
  await cleanupTestData(["LC-", "SL-"]);
});

test("full sales lifecycle: reserve -> convert to booking -> pay in full -> auto-sold -> admin buyback", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const code = `LC-${Date.now()}`;
  const cnicSeq = Math.floor(1000000 + Math.random() * 9000000);
  const clientCnic = `35201-${cnicSeq}-1`;

  // 1. Inventory Manager creates unit
  await signIn(page, inventoryEmail, inventoryPassword);
  await page.goto("/inventory");
  await createUnit(page, code);
  await signOut(page);

  // 2. Sales rep signs in and reserves the unit
  await signIn(page, salesEmail, salesPassword);
  await page.goto("/reservations/new");
  await expect(page).toHaveURL(/\/reservations\/new/, { timeout: 15_000 });

  // Select the unit card
  const unitCard = page.locator(".card", { hasText: code });
  await expect(unitCard).toBeVisible({ timeout: 10_000 });
  await unitCard.click();

  // Step 1 -> Step 2
  await page.getByRole("button", { name: "Next: Client Details" }).click();

  // Fill Client Form
  await page.locator("#client-cnic").fill(clientCnic);
  await page.locator("#client-name").fill("Tariq Mahmood");
  await page.locator("#client-phone").fill("03001234567");
  await page
    .locator("#client-home-address")
    .fill("House 42, Block B, Model Town, Lahore");
  await page
    .locator("#client-postal-address")
    .fill("House 42, Block B, Model Town, Lahore");

  // Step 2 -> Step 3
  await page.getByRole("button", { name: "Next: Duration & Notes" }).click();

  // Select 7 days preset and confirm reservation
  await page.getByRole("button", { name: "7 Days (1 Week)" }).click();
  await page.getByRole("button", { name: "Confirm Reservation" }).click();

  // Should navigate to reservation detail page
  await expect(page).toHaveURL(/\/reservations\/[0-9a-f-]+/, { timeout: 15_000 });
  await expect(page.getByText("Active Hold").first()).toBeVisible();
  await expect(page.getByText(code).first()).toBeVisible();

  // 3. Convert reservation to booking
  await page.getByRole("button", { name: "Convert to Booking" }).click();
  await expect(page).toHaveURL(/\/bookings\/new/, { timeout: 15_000 });

  // Wizard opens at Step 2 (Payment plan) because unit & client are already set!
  await expect(page.getByText("Step 2 of 5: Payment Plan")).toBeVisible();

  // Step 2 -> Step 3
  await page.getByRole("button", { name: "Next: Client Details" }).click();

  // Step 3 -> Step 4
  await page.getByRole("button", { name: "Next: Next of Kin" }).click();

  // Step 4 -> Step 5
  await page.getByRole("button", { name: "Next: Review & Confirm" }).click();

  // Step 5: Confirm & Create Booking
  await page.getByRole("button", { name: "Confirm & Create Booking" }).click();

  // Should navigate to booking detail page
  await expect(page).toHaveURL(/\/bookings\/[0-9a-f-]+/, { timeout: 15_000 });
  await expect(page.getByText(code).first()).toBeVisible();
  await expect(page.getByText("Booking Plan").first()).toBeVisible();

  // 4. Record payment to pay off the balance and trigger auto-SOLD
  // Click Record Payment button
  await page.getByRole("button", { name: "Record Payment" }).click();
  const paymentDialog = page.getByRole("dialog");
  await expect(paymentDialog).toBeVisible();

  // Enter full remaining balance (2,000,000 - down payment 400,000 = 1,600,000)
  // Let's enter 1600000
  await page.locator("#payment-amount").fill("1600000");
  await page.getByRole("button", { name: "Confirm Payment" }).click();

  // Toast confirmation & booking completed / auto-SOLD
  await expect(page.getByText("Completed").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("100%").first()).toBeVisible();
  await signOut(page);

  // 5. Admin Buyback
  await signIn(page, adminEmail, adminPassword);
  await page.goto("/sold");
  await expect(page).toHaveURL(/\/sold/, { timeout: 15_000 });

  // Open the sold unit detail page
  const row = page.getByRole("cell", { name: code });
  await expect(row).toBeVisible({ timeout: 10_000 });
  await row.click();
  await expect(page).toHaveURL(/\/sold\/[0-9a-f-]+/, { timeout: 15_000 });

  // Click Unit Buyback button
  await page.getByRole("button", { name: "Unit Buyback" }).click();
  const buybackDialog = page.getByRole("dialog");
  await expect(buybackDialog).toBeVisible();

  await page
    .locator("#buyback-reason")
    .fill("Customer agreed on full property buyback settlement");
  await page.getByRole("button", { name: "Confirm Buyback" }).click();

  // Unit status should update to Bought Back (Available)
  await expect(page.getByText("Bought Back (Available)").first()).toBeVisible({
    timeout: 15_000,
  });

  // Check inventory page: unit is now AVAILABLE again
  await page.goto(`/inventory?q=${encodeURIComponent(code)}`);
  await expect(page.getByRole("cell", { name: code })).toBeVisible();
  await expect(page.getByText("Available").first()).toBeVisible();
});
