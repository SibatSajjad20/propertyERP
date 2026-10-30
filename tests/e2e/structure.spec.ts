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
  await cleanupTestData(["E2E", "Archive empty"]);
});

test("inventory manager can create a floor", async ({ page }) => {
  await signIn(page, inventoryEmail, inventoryPassword);
  await page.goto("/structure");
  await expect(page.getByRole("columnheader", { name: "Level" })).toBeVisible();

  const blockName = `E2E ${Date.now()}`;
  await page.getByRole("button", { name: "New block" }).click();
  await page.getByLabel("Name").fill(blockName);
  await page.getByRole("button", { name: "Save block" }).click();
  await expect(page.getByRole("link", { name: blockName })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const blockHref = await page
    .getByRole("link", { name: blockName })
    .getAttribute("href");
  expect(blockHref).toBeTruthy();
  await page.goto(blockHref!);
  await expect(
    page.getByRole("heading", { name: `Floors · ${blockName}` }),
  ).toBeVisible();

  await page.getByRole("button", { name: "New floor" }).click();
  await page.getByLabel("Level").fill("0");
  await page.getByLabel("Label").fill("Ground");
  await page.getByRole("button", { name: "Save floor" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ground" })).toBeVisible({
    timeout: 15_000,
  });
});

test("inventory manager can archive an empty floor and is blocked when units remain", async ({
  page,
}) => {
  await signIn(page, inventoryEmail, inventoryPassword);
  await page.goto("/structure");
  await expect(page.getByRole("columnheader", { name: "Level" })).toBeVisible();

  const stamp = Date.now();
  const emptyBlockName = `E2E empty ${stamp}`;
  const emptyFloorName = `Archive empty ${stamp}`;

  await page.getByRole("button", { name: "New block" }).click();
  await page.getByLabel("Name").fill(emptyBlockName);
  await page.getByRole("button", { name: "Save block" }).click();
  await expect(page.getByRole("link", { name: emptyBlockName })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const emptyHref = await page
    .getByRole("link", { name: emptyBlockName })
    .getAttribute("href");
  expect(emptyHref).toBeTruthy();
  await page.goto(emptyHref!);
  await expect(
    page.getByRole("heading", { name: `Floors · ${emptyBlockName}` }),
  ).toBeVisible();

  await page.getByRole("button", { name: "New floor" }).click();
  await page.getByLabel("Level").fill("0");
  await page.getByLabel("Label").fill(emptyFloorName);
  await page.getByRole("button", { name: "Save floor" }).click();
  await expect(page.getByRole("button", { name: emptyFloorName })).toBeVisible();

  await page.getByRole("button", { name: emptyFloorName }).click();
  await page.getByRole("button", { name: "Archive floor" }).click();
  await expect(page.getByRole("button", { name: emptyFloorName })).toHaveCount(0);
  await expect(page.getByText("No floors in this block.")).toBeVisible();

  await page.getByRole("link", { name: "Main" }).click();
  await expect(page.getByText("Floors · Main")).toBeVisible();
  await page.getByRole("button", { name: "Ground" }).click();
  await page.getByRole("button", { name: "Archive floor" }).click();
  await expect(
    page.getByRole("alert").filter({
      hasText: /Cannot archive this floor: \d+ active units? still exists?/,
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Edit floor" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("button", { name: "Ground" })).toBeVisible();
});

test("sales cannot create a floor", async ({ page }) => {
  await signIn(page, salesEmail, salesPassword);
  await page.goto("/structure");
  await expect(page.getByText("This ledger is read-only for Sales.")).toBeVisible();
  await expect(page.getByRole("button", { name: "New floor" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "New block" })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Level" })).toBeVisible();
});
