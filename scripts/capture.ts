import { chromium, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.ADMIN_EMAIL ?? "admin@sardarsmall.local";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "ChangeMe_Admin_2026!";

const ROOT_DIR = process.cwd();
const LAUNCH_VIDEO_DIR = path.join(ROOT_DIR, "launch-video");
const PUBLIC_DIR = path.join(LAUNCH_VIDEO_DIR, "public");
const CAPTURES_DIR = path.join(PUBLIC_DIR, "captures");
const SCREENSHOTS_DIR = path.join(CAPTURES_DIR, "screenshots");
const VIDEOS_DIR = path.join(CAPTURES_DIR, "videos");
const RAW_VIDEOS_DIR = path.join(CAPTURES_DIR, "raw-videos");

fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
fs.mkdirSync(VIDEOS_DIR, { recursive: true });
fs.mkdirSync(RAW_VIDEOS_DIR, { recursive: true });

async function createMockImage(
  filename: string,
  text: string,
  color: { r: number; g: number; b: number },
): Promise<string> {
  const filePath = path.join(os.tmpdir(), filename);
  const svg = `
    <svg width="400" height="500" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="rgb(${color.r},${color.g},${color.b})" />
      <circle cx="200" cy="180" r="90" fill="#ffffff" opacity="0.9" />
      <circle cx="200" cy="150" r="40" fill="#0B558B" />
      <path d="M 130 250 Q 200 190 270 250" fill="#0B558B" />
      <text x="200" y="340" font-family="sans-serif" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle">${text}</text>
      <text x="200" y="380" font-family="sans-serif" font-size="16" fill="#e2e8f0" text-anchor="middle">SARDAR'S MALL VERIFIED</text>
    </svg>
  `;
  await sharp(Buffer.from(svg)).jpeg().toFile(filePath);
  return filePath;
}

async function smoothType(page: Page, selector: string, text: string, delay = 40) {
  const el = page.locator(selector);
  await el.click();
  await el.pressSequentially(text, { delay });
}

async function main() {
  console.log("Starting Capture Pipeline for Sardar's Mall ERP Launch Video...");
  console.log(`Connecting to ${BASE_URL}...`);

  const clientPhoto = await createMockImage("client-photo.jpg", "AHMAD KHAN", {
    r: 11,
    g: 85,
    b: 139,
  });
  const kinPhoto = await createMockImage("kin-photo.jpg", "BILAL KHAN", {
    r: 15,
    g: 118,
    b: 110,
  });
  const cnicFront = await createMockImage("cnic-front.jpg", "CNIC FRONT", {
    r: 30,
    g: 41,
    b: 59,
  });
  const cnicBack = await createMockImage("cnic-back.jpg", "CNIC BACK", {
    r: 51,
    g: 65,
    b: 85,
  });

  const browser = await chromium.launch({
    headless: true,
  });

  // 1. Initial login & Auth Context
  console.log("[1/8] Logging in and saving session...");
  const authContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });
  const authPage = await authContext.newPage();
  await authPage.goto(`${BASE_URL}/login`);
  await authPage.waitForLoadState("networkidle");
  await authPage.screenshot({ path: path.join(SCREENSHOTS_DIR, "01-login.png") });

  await smoothType(authPage, 'input[name="email"], #email, input[type="email"]', EMAIL);
  await smoothType(
    authPage,
    'input[name="password"], #password, input[type="password"]',
    PASSWORD,
  );
  await authPage.getByRole("button", { name: /sign in/i }).click();

  await authPage.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 20000,
  });
  await authPage.waitForLoadState("networkidle");

  const storageState = await authContext.storageState();
  await authContext.close();
  console.log("Logged in successfully. Reusing storage state across scenes.");

  // Helper to run video scene
  async function recordScene(
    sceneName: string,
    action: (page: Page) => Promise<void>,
  ): Promise<string> {
    console.log(`Recording scene: ${sceneName}...`);
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2,
      storageState,
      recordVideo: {
        dir: RAW_VIDEOS_DIR,
        size: { width: 1920, height: 1080 },
      },
    });

    const page = await context.newPage();
    await action(page);
    await page.waitForTimeout(1000);
    const videoObj = page.video();
    await context.close();

    const destPath = path.join(VIDEOS_DIR, `${sceneName}.webm`);
    if (videoObj) {
      const rawPath = await videoObj.path();
      fs.copyFileSync(rawPath, destPath);
      console.log(`Saved video: ${destPath}`);
    }
    return destPath;
  }

  // 2. Dashboard Scene
  await recordScene("clip-dashboard", async (page) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500); // Wait for animated counters
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "02-dashboard.png") });

    // Smooth hover over KPI cards
    const kpiCards = page
      .locator(".card, [class*='rounded']")
      .filter({ hasText: /units|value|available|booked|sold/i });
    const count = await kpiCards.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      await kpiCards.nth(i).hover();
      await page.waitForTimeout(400);
    }

    // Smooth scroll down to visx charts
    await page.mouse.wheel(0, 450);
    await page.waitForTimeout(1800);
    await page.mouse.wheel(0, -450);
    await page.waitForTimeout(800);
  });

  // 3. Inventory Scene
  await recordScene("clip-inventory", async (page) => {
    await page.goto(`${BASE_URL}/inventory`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "03-inventory.png") });

    // Search unit code
    const searchInput = page
      .locator('input[placeholder*="Search"], input[placeholder*="Filter"]')
      .first();
    if (await searchInput.isVisible()) {
      await searchInput.click();
      await searchInput.pressSequentially("GF-", { delay: 50 });
      await page.waitForTimeout(800);
    }

    // Smooth mouse movements over table
    await page.mouse.move(500, 300);
    await page.waitForTimeout(400);
    await page.mouse.move(500, 420);
    await page.waitForTimeout(400);
    await page.mouse.move(500, 540);
    await page.waitForTimeout(400);

    // Smooth scroll down
    await page.mouse.wheel(0, 350);
    await page.waitForTimeout(1000);
    await page.mouse.wheel(0, -350);
    await page.waitForTimeout(600);

    if (await searchInput.isVisible()) {
      await searchInput.fill("");
      await page.waitForTimeout(600);
    }
  });

  // 4. Booking Wizard Flow
  let bookedBookingId: string | null = null;
  await recordScene("clip-booking-wizard", async (page) => {
    await page.goto(`${BASE_URL}/bookings/new`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "04-booking-step1.png") });

    // Step 1: Select available unit card
    const unitCard = page
      .locator(".card.cursor-pointer, .card:has-text('Shop'), .card:has-text('GF-')")
      .first();
    try {
      await unitCard.waitFor({ state: "visible", timeout: 8000 });
      await unitCard.hover();
      await page.waitForTimeout(400);
      await unitCard.click();
      await page.waitForTimeout(600);
    } catch (e) {
      console.warn("Could not click unit card:", e);
    }

    const nextBtnStep1 = page.getByRole("button", { name: "Next: Payment Plan" });
    if (await nextBtnStep1.isVisible({ timeout: 2000 })) {
      await nextBtnStep1.click();
      await page.waitForTimeout(1200);
    }

    // Step 2: Payment Plan
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "05-booking-step2.png") });
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(800);
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(400);

    const step2Next = page.getByRole("button", { name: "Next: Client Details" });
    if (await step2Next.isVisible({ timeout: 2000 })) {
      await step2Next.click();
      await page.waitForTimeout(1200);
    }

    // Step 3: Client Details
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "06-booking-step3.png") });
    const cnicInput = page.locator("#client-cnic, input[name='cnic']").first();
    const nameInput = page
      .locator("#client-name, input[name='fullName'], input[name='name']")
      .first();
    const relationInput = page
      .locator("#client-relation-name, input[name='relationName']")
      .first();
    const phoneInput = page.locator("#client-phone, input[name='phone']").first();
    const homeAddressInput = page
      .locator("#client-home-address, textarea[name='homeAddress']")
      .first();
    const postalAddressInput = page
      .locator("#client-postal-address, textarea[name='postalAddress']")
      .first();

    if (await cnicInput.isVisible({ timeout: 1000 })) {
      await cnicInput.click();
      await cnicInput.pressSequentially("35202-1234567-1", { delay: 35 });
    }
    if (await nameInput.isVisible({ timeout: 1000 })) {
      await nameInput.click();
      await nameInput.pressSequentially("Muhammad Ahmad Khan", { delay: 35 });
    }
    if (await relationInput.isVisible({ timeout: 1000 })) {
      await relationInput.click();
      await relationInput.pressSequentially("Abdul Rashid Khan", { delay: 35 });
    }
    if (await phoneInput.isVisible({ timeout: 1000 })) {
      await phoneInput.click();
      await phoneInput.pressSequentially("03001234567", { delay: 35 });
    }
    if (await homeAddressInput.isVisible({ timeout: 1000 })) {
      await homeAddressInput.click();
      await homeAddressInput.pressSequentially("House 42, Block B, Model Town, Lahore", {
        delay: 20,
      });
    }
    if (await postalAddressInput.isVisible({ timeout: 1000 })) {
      await postalAddressInput.click();
      await postalAddressInput.pressSequentially(
        "House 42, Block B, Model Town, Lahore",
        { delay: 20 },
      );
    }

    // Upload client photo if slot exists
    try {
      const photoInput = page
        .locator('[data-owner-type="CLIENT"][data-doc-type="PHOTO"] input[type="file"]')
        .first();
      if (await photoInput.isVisible({ timeout: 1000 })) {
        await photoInput.setInputFiles(clientPhoto);
        await page.waitForTimeout(600);
        const usePhotoBtn = page.getByRole("button", { name: /use photo/i });
        if (await usePhotoBtn.isVisible({ timeout: 1000 })) {
          await usePhotoBtn.click();
          await page.waitForTimeout(600);
        }
      }
    } catch {}

    const step3Next = page.getByRole("button", { name: "Next: Next of Kin" });
    if (await step3Next.isVisible({ timeout: 2000 })) {
      await step3Next.click();
      await page.waitForTimeout(1200);
    }

    // Step 4: Next of Kin
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "07-booking-step4.png") });
    const kinNameInput = page.locator("#kin-name, input[name='kinName']").first();
    const kinRelationInput = page
      .locator("#kin-relation, input[name='kinRelation']")
      .first();
    const kinRelationNameInput = page
      .locator("#kin-relation-name, input[name='kinRelationName']")
      .first();
    const kinCnicInput = page.locator("#kin-cnic, input[name='kinCnic']").first();
    const kinPhoneInput = page.locator("#kin-phone, input[name='kinPhone']").first();

    if (await kinNameInput.isVisible({ timeout: 1000 }))
      await kinNameInput.pressSequentially("Bilal Ahmad Khan", { delay: 30 });
    if (await kinRelationInput.isVisible({ timeout: 1000 }))
      await kinRelationInput.pressSequentially("Son", { delay: 30 });
    if (await kinRelationNameInput.isVisible({ timeout: 1000 }))
      await kinRelationNameInput.pressSequentially("Muhammad Ahmad Khan", { delay: 30 });
    if (await kinCnicInput.isVisible({ timeout: 1000 }))
      await kinCnicInput.pressSequentially("35202-7654321-3", { delay: 30 });
    if (await kinPhoneInput.isVisible({ timeout: 1000 }))
      await kinPhoneInput.pressSequentially("03019876543", { delay: 30 });

    try {
      const kinPhotoInput = page
        .locator('[data-owner-type="KIN"][data-doc-type="KIN_PHOTO"] input[type="file"]')
        .first();
      if (await kinPhotoInput.isVisible({ timeout: 1000 })) {
        await kinPhotoInput.setInputFiles(kinPhoto);
        await page.waitForTimeout(500);
        const usePhotoBtn = page.getByRole("button", { name: /use photo/i });
        if (await usePhotoBtn.isVisible({ timeout: 1000 })) {
          await usePhotoBtn.click();
          await page.waitForTimeout(500);
        }
      }
    } catch {}

    const step4Next = page.getByRole("button", { name: "Next: Review & Confirm" });
    if (await step4Next.isVisible({ timeout: 2000 })) {
      await step4Next.click();
      await page.waitForTimeout(1200);
    }

    // Step 5: Review & Confirm
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "08-booking-step5.png") });
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(800);

    const confirmBtn = page.getByRole("button", { name: "Confirm & Create Booking" });
    if (await confirmBtn.isVisible({ timeout: 2000 })) {
      await confirmBtn.click();
      await page.waitForTimeout(3000);
      const url = page.url();
      const match = url.match(/\/bookings\/([a-f0-9-]+)/);
      if (match && match[1]) {
        bookedBookingId = match[1];
        console.log(`Created booking successfully: ${bookedBookingId}`);
      }
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "09-booking-detail.png") });
  });

  // 5. Booking Details & Printable Receipt
  await recordScene("clip-booking-detail", async (page) => {
    const bookingUrl = bookedBookingId
      ? `${BASE_URL}/bookings/${bookedBookingId}`
      : `${BASE_URL}/bookings/9f4212a7-490a-4681-8639-d022b979b9ce`;
    await page.goto(bookingUrl);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Click receipt button if available
    try {
      const receiptBtn = page.getByRole("button", { name: "Receipt" }).first();
      if (await receiptBtn.isVisible({ timeout: 2000 })) {
        await receiptBtn.click();
        await page.waitForTimeout(1200);
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, "18-receipt-modal.png"),
        });
        const closeBtn = page.getByRole("button", { name: /close/i }).first();
        if (await closeBtn.isVisible({ timeout: 1000 })) await closeBtn.click();
      }
    } catch (e) {
      console.warn("Receipt modal not clicked:", e);
    }
  });

  // 6. Unit Detail & Ownership Lifecycle
  await recordScene("clip-unit-detail", async (page) => {
    await page.goto(`${BASE_URL}/units/c789a538-c453-4da5-9658-3b4aaf8d505a`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "10-unit-detail.png") });

    await page.mouse.wheel(0, 350);
    await page.waitForTimeout(1200);
    await page.mouse.wheel(0, -350);
    await page.waitForTimeout(600);
  });

  // 7. Installments Cashier Desk
  await recordScene("clip-installments", async (page) => {
    await page.goto(
      `${BASE_URL}/installments?clientId=2aafd7a0-4603-4520-a6c9-42f2099cdf5b`,
    );
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "11-installments.png") });

    await page.mouse.wheel(0, 350);
    await page.waitForTimeout(1200);
    await page.mouse.wheel(0, -350);
    await page.waitForTimeout(600);
  });

  // 8. Client Ledger
  await recordScene("clip-client-ledger", async (page) => {
    await page.goto(
      `${BASE_URL}/reports/client-ledger?clientId=2aafd7a0-4603-4520-a6c9-42f2099cdf5b`,
    );
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "12-client-ledger.png") });
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(1200);
  });

  // 9. Financial Reports
  await recordScene("clip-reports", async (page) => {
    await page.goto(`${BASE_URL}/reports/summary`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "13-reports-summary.png") });

    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(1200);

    await page.goto(`${BASE_URL}/reports/collections`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "14-reports-collections.png"),
    });
  });

  // 10. Additional Supporting Screenshots
  const staticScreenshots = [
    { url: `${BASE_URL}/agreements`, name: "15-agreements.png" },
    { url: `${BASE_URL}/import`, name: "16-import.png" },
    { url: `${BASE_URL}/structure`, name: "17-structure.png" },
  ];

  const helperContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    storageState,
  });
  const helperPage = await helperContext.newPage();
  for (const item of staticScreenshots) {
    try {
      await helperPage.goto(item.url);
      await helperPage.waitForLoadState("networkidle");
      await helperPage.screenshot({ path: path.join(SCREENSHOTS_DIR, item.name) });
      console.log(`Captured ${item.name}`);
    } catch (e) {
      console.warn(`Could not capture ${item.url}:`, e);
    }
  }
  await helperContext.close();

  await browser.close();
  console.log("All real app captures and crisp screenshots completed successfully!");
}

main().catch((err) => {
  console.error("Capture script failed:", err);
  process.exit(1);
});
