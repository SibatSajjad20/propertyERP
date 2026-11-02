import { expect, test } from "@playwright/test";
import { guardEnvironment } from "./e2e-guard";

const adminEmail = process.env.ADMIN_EMAIL ?? "admin@sardarsmall.local";
const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe_Admin_2026!";

async function signIn(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  await page.context().clearCookies();
  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible({ timeout: 15_000 });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/inventory/, { timeout: 15_000 });
}

test.beforeAll(() => {
  guardEnvironment();
});

test.describe("Header Control Sizing", () => {
  const viewports = [
    { width: 1280, height: 800, name: "1280" },
    { width: 1440, height: 900, name: "1440" },
    { width: 1920, height: 1080, name: "1920" },
  ];

  for (const vp of viewports) {
    test(`header controls on dashboard, inventory, bookings and users are all 36px tall at ${vp.name}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await signIn(page, adminEmail, adminPassword);

      const pagesToCheck = [
        { path: "/", name: "Dashboard" },
        { path: "/inventory", name: "Inventory" },
        { path: "/bookings", name: "Bookings" },
        { path: "/settings/users", name: "Users" },
      ];

      for (const { path, name } of pagesToCheck) {
        await page.goto(path);
        const headerActions = page.locator("[data-header-actions]");
        await expect(headerActions).toBeVisible({ timeout: 10_000 });

        // Find all interactive control elements in header actions
        const controls = headerActions.locator(
          "button, [role='combobox'], a.inline-flex, a[class*='h-9']",
        );
        const count = await controls.count();
        expect(count, `Expected controls in header of ${name}`).toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
          const control = controls.nth(i);
          // Wait for control to be attached and visible
          await expect(control).toBeVisible();
          const box = await control.boundingBox();
          expect(box, `Bounding box exists for control ${i} on ${name}`).not.toBeNull();
          if (box) {
            // Assert exact 36px height (md control scale)
            const roundedHeight = Math.round(box.height);
            expect(
              roundedHeight,
              `Control ${i} on ${name} at ${vp.name}px width must be 36px tall, got ${box.height}`,
            ).toBe(36);
          }
        }
      }
    });
  }
});
