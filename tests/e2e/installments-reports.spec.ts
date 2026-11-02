import { expect, test } from "@playwright/test";
import { cleanupTestData, guardEnvironment } from "./e2e-guard";

const inventoryEmail = process.env.INVENTORY_EMAIL ?? "inventory@sardarsmall.local";
const inventoryPassword = process.env.INVENTORY_PASSWORD ?? "ChangeMe_Inventory_2026!";

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

async function createUnit(page: import("@playwright/test").Page, code: string) {
  await page.getByRole("link", { name: "New unit" }).click();
  await expect(page).toHaveURL(/\/units\/new/, { timeout: 15_000 });
  await page.getByLabel("Unit code").fill(code);
  await page.getByLabel("Unit number").fill("INS1");
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
  await cleanupTestData(["INST-"]);
});

test("Installments: search client by CNIC -> record payment -> receipt -> status updates", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const code = `INST-${Date.now()}`;
  const cnicSeq = Math.floor(1000000 + Math.random() * 9000000);
  const clientCnic = `35201-${cnicSeq}-1`;

  // 1. Inventory Manager creates unit
  await signIn(page, inventoryEmail, inventoryPassword);
  await page.goto("/inventory");
  await createUnit(page, code);

  // 2. Create a booking for this client
  await page.goto("/bookings/new");
  await expect(page).toHaveURL(/\/bookings\/new/, { timeout: 15_000 });

  // Step 1: Select Unit
  const unitCard = page.locator(".card", { hasText: code });
  await expect(unitCard).toBeVisible({ timeout: 10_000 });
  await unitCard.click();
  await page.getByRole("button", { name: "Next: Payment Plan" }).click();

  // Step 2: Payment Plan
  await page.getByRole("button", { name: "Next: Client Details" }).click();

  // Step 3: Client Details
  await page.locator("#client-cnic").fill(clientCnic);
  await page.locator("#client-name").fill("Farhan Qureshi");
  await page.locator("#client-phone").fill("03009876543");
  await page.locator("#client-home-address").fill("House 12, Street 4, Gulberg, Lahore");
  await page
    .locator("#client-postal-address")
    .fill("House 12, Street 4, Gulberg, Lahore");
  await page.getByRole("button", { name: "Next: Next of Kin" }).click();

  // Step 4: Next of Kin
  await page.locator("#kin-name").fill("Zainab Farhan");
  await page.locator("#kin-relation").fill("Spouse");
  await page.locator("#kin-phone").fill("03009876544");
  await page.getByRole("button", { name: "Next: Review & Confirm" }).click();

  // Step 5: Confirm & Create Booking
  await page.getByRole("button", { name: "Confirm & Create Booking" }).click();
  await expect(page).toHaveURL(/\/bookings\/[0-9a-f-]+/, { timeout: 15_000 });
  await expect(page.getByText(code).first()).toBeVisible();

  // 3. Navigate to Installments module (/installments)
  await page.goto("/installments");
  await expect(page).toHaveURL(/\/installments/, { timeout: 15_000 });

  // 4. Search client by CNIC in Big Search bar
  const searchInput = page.getByPlaceholder(/Search by Client Name, CNIC/);
  await expect(searchInput).toBeVisible();
  await searchInput.fill(clientCnic);

  // Instant match should appear
  const clientMatch = page.getByText("Farhan Qureshi").first();
  await expect(clientMatch).toBeVisible({ timeout: 10_000 });
  await clientMatch.click();

  // 5. Client bookings view loads with schedule table
  await expect(page.getByText("Farhan Qureshi").first()).toBeVisible();
  await expect(page.getByText(code).first()).toBeVisible();
  await expect(page.getByText(/Installment Schedule/)).toBeVisible();

  // 6. Click "Record Payment" button
  await page.getByRole("button", { name: "Record Payment" }).first().click();

  const recordDialog = page.getByRole("dialog");
  await expect(recordDialog).toBeVisible();
  await expect(recordDialog.getByText("Record Installment Payment")).toBeVisible();

  // 7. Enter payment amount
  await recordDialog.getByPlaceholder("e.g. 150000").fill("100000");

  // Waterfall allocation preview should appear
  await expect(recordDialog.getByText("Waterfall Allocation Preview")).toBeVisible();

  // 8. Submit Payment
  await recordDialog.getByRole("button", { name: "Record & Print Receipt" }).click();

  // 9. Official Receipt Modal opens
  const receiptDialog = page.getByRole("dialog");
  await expect(
    receiptDialog.getByRole("heading", { name: "Payment Receipt" }),
  ).toBeVisible({ timeout: 10_000 });
  await expect(receiptDialog.getByText("Farhan Qureshi").first()).toBeVisible();
  await expect(receiptDialog.getByText(code).first()).toBeVisible();

  // Close receipt modal
  await page.keyboard.press("Escape");

  // 10. Status updates verified on the schedule
  await expect(page.getByText(/1,00,000/).first()).toBeVisible();

  // 11. Reports section check
  await page.goto("/reports/summary");
  await expect(page.getByRole("heading", { name: "Executive Summary" })).toBeVisible({
    timeout: 15_000,
  });

  await page.goto("/reports/client-ledger");
  await expect(
    page.getByRole("heading", { name: "Client Ledger & Statement" }),
  ).toBeVisible({ timeout: 15_000 });
});
