import os from "node:os";
import path from "node:path";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import sharp from "sharp";

export async function jpegFixture(): Promise<string> {
  const file = path.join(
    os.tmpdir(),
    `erp-photo-${Date.now()}-${Math.random().toString(16).slice(2)}.jpg`,
  );
  await sharp({
    create: {
      width: 350,
      height: 450,
      channels: 3,
      background: { r: 176, g: 128, b: 96 },
    },
  })
    .jpeg()
    .toFile(file);
  return file;
}

export async function selectUnitByCode(page: Page, code: string) {
  await page.getByPlaceholder("Search unit code or number…").fill(code);
  const unitCard = page.locator(".card", { hasText: code });
  await expect(unitCard).toBeVisible({ timeout: 15_000 });
  await unitCard.click();
}

export async function fillClientIdentity(
  page: Page,
  opts: { cnic: string; name: string; phone: string; relationName: string },
) {
  await page.locator("#client-cnic").fill(opts.cnic);
  await page.locator("#client-name").fill(opts.name);
  await page.locator("#client-relation-name").fill(opts.relationName);
  await page.locator("#client-phone").fill(opts.phone);
  await page
    .locator("#client-home-address")
    .fill("House 42, Block B, Model Town, Lahore");
  await page
    .locator("#client-postal-address")
    .fill("House 42, Block B, Model Town, Lahore");
}

export async function fillKinIdentity(
  page: Page,
  opts: {
    name: string;
    relation: string;
    relationName: string;
    phone: string;
    cnic: string;
  },
) {
  await page.locator("#kin-name").fill(opts.name);
  await page.locator("#kin-relation-name").fill(opts.relationName);
  await page.locator("#kin-relation").fill(opts.relation);
  await page.locator("#kin-phone").fill(opts.phone);
  await page.locator("#kin-cnic").fill(opts.cnic);
}

export async function uploadDocSlot(
  page: Page,
  ownerType: "CLIENT" | "KIN",
  docType: "PHOTO" | "KIN_PHOTO" | "CNIC_FRONT" | "CNIC_BACK",
  file: string,
) {
  const slot = page.locator(
    `[data-owner-type="${ownerType}"][data-doc-type="${docType}"]`,
  );
  await slot.locator('input[type="file"]').first().setInputFiles(file);
  if (docType === "PHOTO" || docType === "KIN_PHOTO") {
    const usePhoto = page.getByRole("button", { name: "Use photo" });
    await expect(usePhoto).toBeEnabled({ timeout: 10_000 });
    await usePhoto.click();
    await expect(
      page.getByRole("dialog").filter({ hasText: "Crop passport photo" }),
    ).toBeHidden({
      timeout: 10_000,
    });
  }
  await expect(slot.getByText("Ready to upload")).toBeVisible({ timeout: 15_000 });
}

export async function uploadRequiredDocs(page: Page) {
  const file = await jpegFixture();
  await uploadDocSlot(page, "CLIENT", "PHOTO", file);
  await uploadDocSlot(page, "CLIENT", "CNIC_FRONT", file);
  await uploadDocSlot(page, "CLIENT", "CNIC_BACK", file);
}

export async function uploadKinDocs(page: Page) {
  const file = await jpegFixture();
  await uploadDocSlot(page, "KIN", "KIN_PHOTO", file);
  await uploadDocSlot(page, "KIN", "CNIC_FRONT", file);
  await uploadDocSlot(page, "KIN", "CNIC_BACK", file);
}
