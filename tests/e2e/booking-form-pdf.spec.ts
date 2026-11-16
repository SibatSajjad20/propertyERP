import { expect, test } from "@playwright/test";
import { cleanupTestData, guardEnvironment } from "./e2e-guard";
import {
  fillClientIdentity,
  fillKinIdentity,
  selectUnitByCode,
  uploadKinDocs,
  uploadRequiredDocs,
} from "./form-helpers";

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
  await expect(page).toHaveURL(/\/inventory/, { timeout: 15_000 });
}

async function createUnit(page: import("@playwright/test").Page, code: string) {
  await page.getByRole("link", { name: "New unit" }).click();
  await expect(page).toHaveURL(/\/units\/new/, { timeout: 15_000 });
  await page.getByLabel("Unit code").fill(code);
  await page.getByLabel("Unit number").fill("BF1");
  await page.locator("#unit-floor").selectOption({ index: 0 });
  await page.locator("#unit-category").selectOption({ label: "Shop" });
  await page.getByLabel("Net area (sq ft)").fill("100.00");
  await page.getByLabel("Rate per sq ft (PKR)").fill("20000.00");
  await page.getByRole("button", { name: "Save unit" }).click();
  await expect(page.locator(".unit-code", { hasText: code }).first()).toBeVisible({
    timeout: 15_000,
  });
}

test.beforeAll(() => {
  guardEnvironment();
});

test.afterAll(async () => {
  await cleanupTestData(["BF-", "SF-"]);
});

test("booking with uploads shows numbers and downloads PDF", async ({ page }) => {
  test.setTimeout(120_000);
  const code = `BF-${Date.now()}`;
  const cnicSeq = Math.floor(1000000 + Math.random() * 9000000);
  const clientCnic = `35201-${cnicSeq}-1`;

  await signIn(page, inventoryEmail, inventoryPassword);
  await page.goto("/inventory");
  await createUnit(page, code);

  await page.goto("/bookings/new");
  await expect(page).toHaveURL(/\/bookings\/new/, { timeout: 15_000 });
  await selectUnitByCode(page, code);
  await page.getByRole("button", { name: "Next: Payment Plan" }).click();
  await page.getByRole("button", { name: "Next: Client Details" }).click();

  await fillClientIdentity(page, {
    cnic: clientCnic,
    name: "Booking Form Client",
    phone: "03001112233",
    relationName: "Form Father",
  });
  await uploadRequiredDocs(page);
  await page.getByRole("button", { name: "Next: Next of Kin" }).click();
  await fillKinIdentity(page, {
    name: "Booking Kin",
    relation: "Brother",
    relationName: "Kin Father",
    phone: "03001112234",
    cnic: `35202-${cnicSeq}-1`,
  });
  await uploadKinDocs(page);
  await page.getByRole("button", { name: "Next: Review & Confirm" }).click();
  await page.getByRole("button", { name: "Confirm & Create Booking" }).click();
  await expect(page).toHaveURL(/\/bookings\/[0-9a-f-]+/, { timeout: 20_000 });
  await expect(page.getByText(/SM-/).first()).toBeVisible();
  await expect(page.getByText(/ASSH-/).first()).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Download PDF" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/SM-.*-booking-form\.pdf/);
});

test("direct sale with uploads shows numbers and downloads PDF", async ({ page }) => {
  test.setTimeout(120_000);
  const code = `SF-${Date.now()}`;
  const cnicSeq = Math.floor(1000000 + Math.random() * 9000000);
  const clientCnic = `35201-${cnicSeq}-1`;

  await signIn(page, inventoryEmail, inventoryPassword);
  await page.goto("/inventory");
  await createUnit(page, code);

  await signIn(page, salesEmail, salesPassword);
  await page.goto("/sold/new");
  await expect(page).toHaveURL(/\/sold\/new/, { timeout: 15_000 });
  await selectUnitByCode(page, code);
  await page.getByRole("button", { name: "Next Step" }).click();

  await fillClientIdentity(page, {
    cnic: clientCnic,
    name: "Sale Form Client",
    phone: "03002223344",
    relationName: "Sale Father",
  });
  await fillKinIdentity(page, {
    name: "Sale Kin",
    relation: "Son",
    relationName: "Sale Client",
    phone: "03002223345",
    cnic: `35202-${cnicSeq}-1`,
  });
  await uploadRequiredDocs(page);
  await uploadKinDocs(page);
  await page.getByRole("button", { name: "Next Step" }).click();
  await page.getByRole("button", { name: "Confirm & Mark Unit SOLD" }).click();
  await expect(page).toHaveURL(/\/sold\/[0-9a-f-]+/, { timeout: 20_000 });
  await expect(page.getByText(/SM-/).first()).toBeVisible();
  await expect(page.getByText(/ASSH-/).first()).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Download PDF" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/SM-.*-sale-form\.pdf/);
});
