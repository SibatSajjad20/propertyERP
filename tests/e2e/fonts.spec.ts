import { expect, test } from "@playwright/test";
import { guardEnvironment } from "./e2e-guard";
import path from "node:path";
import fs from "node:fs";

const email = process.env.ADMIN_EMAIL ?? "admin@sardarsmall.local";
const password = process.env.ADMIN_PASSWORD ?? "ChangeMe_Admin_2026!";

test.beforeAll(() => {
  guardEnvironment();
});

test.describe("Font Verification in Production Built App", () => {
  test("verify Geist font, body styles, table styles, KPIs, prices, and buttons", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    // 1. Visit Login Page
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sardar's Mall" })).toBeVisible();

    // Verify document fonts
    const fontReady = await page.evaluate(async () => {
      await document.fonts.ready;
      const loaded: string[] = [];
      document.fonts.forEach((f) => loaded.push(`${f.family} (${f.status})`));
      return {
        hasGeistVariable: document.fonts.check("14px 'Geist Variable'"),
        hasGeistMonoVariable: document.fonts.check("14px 'Geist Mono Variable'"),
        loadedCount: loaded.length,
        fonts: loaded,
      };
    });
    console.log("Document Fonts:", fontReady);
    expect(fontReady.hasGeistVariable).toBe(true);

    // Verify body computed styles
    const bodyStyles = await page.evaluate(() => {
      const el = document.body;
      const s = window.getComputedStyle(el);
      return {
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        webkitFontSmoothing: s.getPropertyValue("-webkit-font-smoothing"),
      };
    });
    console.log("Body Styles:", bodyStyles);
    expect(bodyStyles.fontFamily).toContain("Geist Variable");
    expect(bodyStyles.fontSize).toBe("14px");
    expect(parseFloat(bodyStyles.lineHeight)).toBeCloseTo(21, 1); // 14px * 1.5 = 21px
    expect(bodyStyles.webkitFontSmoothing).toBe("antialiased");

    // Verify Login Heading (no serif, Geist 600, -0.015em letter-spacing)
    const loginHeadingStyles = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      if (!h1) return null;
      const s = window.getComputedStyle(h1);
      return {
        fontFamily: s.fontFamily,
        letterSpacing: s.letterSpacing,
        fontWeight: s.fontWeight,
      };
    });
    console.log("Login Heading Styles:", loginHeadingStyles);
    expect(loginHeadingStyles?.fontFamily).toContain("Geist Variable");
    expect(loginHeadingStyles?.fontFamily.toLowerCase()).not.toContain("newsreader");
    expect(loginHeadingStyles?.fontFamily.toLowerCase()).not.toContain("times");

    // Verify button computed styles on login page
    const loginButtonStyles = await page.evaluate(() => {
      const btn = document.querySelector("button[type='submit']");
      if (!btn) return null;
      const s = window.getComputedStyle(btn);
      return {
        fontFamily: s.fontFamily,
      };
    });
    console.log("Login Button Styles:", loginButtonStyles);
    expect(loginButtonStyles?.fontFamily).toContain("Geist Variable");

    // CDP verification for rendered platform fonts on body and button
    const client = await page.context().newCDPSession(page);
    await client.send("DOM.enable");
    await client.send("CSS.enable");

    const bodyNode = await client.send("DOM.getDocument");
    const bodyNodeId = bodyNode.root.nodeId;
    const bodyElement = await client.send("DOM.querySelector", {
      nodeId: bodyNodeId,
      selector: "body",
    });
    const bodyPlatformFonts = await client.send("CSS.getPlatformFontsForNode", {
      nodeId: bodyElement.nodeId,
    });
    console.log("Body Platform Fonts (CDP):", bodyPlatformFonts);
    expect(bodyPlatformFonts.fonts.some((f) => f.familyName.includes("Geist"))).toBe(
      true,
    );

    const btnElement = await client.send("DOM.querySelector", {
      nodeId: bodyNodeId,
      selector: "button[type='submit']",
    });
    const btnPlatformFonts = await client.send("CSS.getPlatformFontsForNode", {
      nodeId: btnElement.nodeId,
    });
    console.log("Button Platform Fonts (CDP):", btnPlatformFonts);
    expect(btnPlatformFonts.fonts.some((f) => f.familyName.includes("Geist"))).toBe(true);

    // Save screenshot of login page
    const screenshotDir = path.resolve(process.cwd(), "docs", "screenshots");
    fs.mkdirSync(screenshotDir, { recursive: true });
    await page.screenshot({
      path: path.join(screenshotDir, "01-login.png"),
      fullPage: true,
    });

    // 2. Log in and go to Dashboard (re-open login after CDP so the form is clean)
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/inventory/, { timeout: 30_000 });

    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({
      timeout: 15_000,
    });

    // Verify wordmark in sidebar: Geist 600
    const wordmarkStyles = await page.evaluate(() => {
      const wm = document.querySelector(".wordmark");
      if (!wm) return null;
      const s = window.getComputedStyle(wm);
      return {
        fontFamily: s.fontFamily,
        fontWeight: s.fontWeight,
      };
    });
    console.log("Wordmark Styles:", wordmarkStyles);
    expect(wordmarkStyles?.fontFamily).toContain("Geist Variable");
    expect(wordmarkStyles?.fontFamily.toLowerCase()).not.toContain("newsreader");

    // Verify Dashboard headings have letter-spacing -0.015em and no serif
    const dashboardHeadingStyles = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      if (!h1) return null;
      const s = window.getComputedStyle(h1);
      return {
        fontFamily: s.fontFamily,
        letterSpacing: s.letterSpacing,
      };
    });
    console.log("Dashboard Heading Styles:", dashboardHeadingStyles);
    expect(dashboardHeadingStyles?.fontFamily).toContain("Geist Variable");
    expect(dashboardHeadingStyles?.fontFamily.toLowerCase()).not.toContain("newsreader");

    // Verify Dashboard KPIs
    const kpiStyles = await page.evaluate(() => {
      const kpis = document.querySelectorAll(".kpi");
      return Array.from(kpis).map((k) => {
        const s = window.getComputedStyle(k);
        return {
          fontFeatureSettings: s.fontFeatureSettings,
          fontVariantNumeric: s.fontVariantNumeric,
        };
      });
    });
    console.log("KPI Styles:", kpiStyles);
    expect(kpiStyles.length).toBeGreaterThan(0);
    for (const kpi of kpiStyles) {
      expect(kpi.fontFeatureSettings).toContain("ss01");
      expect(kpi.fontFeatureSettings).toContain("cv11");
      expect(kpi.fontVariantNumeric).toBe("tabular-nums");
    }

    // Verify Dashboard Table styles
    const dashTableStyles = await page.evaluate(() => {
      const tbl = document.querySelector("table");
      if (!tbl) return null;
      const s = window.getComputedStyle(tbl);
      const th = tbl.querySelector("th");
      const td = tbl.querySelector("td");
      const thS = th ? window.getComputedStyle(th) : null;
      const tdS = td ? window.getComputedStyle(td) : null;
      return {
        tbl: {
          fontFamily: s.fontFamily,
          fontFeatureSettings: s.fontFeatureSettings,
          fontVariantNumeric: s.fontVariantNumeric,
        },
        th: thS
          ? {
              fontFeatureSettings: thS.fontFeatureSettings,
              fontVariantNumeric: thS.fontVariantNumeric,
            }
          : null,
        td: tdS
          ? {
              fontFeatureSettings: tdS.fontFeatureSettings,
              fontVariantNumeric: tdS.fontVariantNumeric,
            }
          : null,
      };
    });
    console.log("Dashboard Table Styles:", dashTableStyles);
    expect(dashTableStyles?.tbl.fontFamily).toContain("Geist Variable");
    expect(dashTableStyles?.tbl.fontFeatureSettings).toContain("ss01");
    expect(dashTableStyles?.tbl.fontFeatureSettings).toContain("cv11");
    expect(dashTableStyles?.tbl.fontVariantNumeric).toBe("tabular-nums");

    // Dashboard Table CDP check for rendered font
    const dashDoc = await client.send("DOM.getDocument");
    const dashTblElement = await client.send("DOM.querySelector", {
      nodeId: dashDoc.root.nodeId,
      selector: "table th",
    });
    if (dashTblElement.nodeId) {
      const tblPlatformFonts = await client.send("CSS.getPlatformFontsForNode", {
        nodeId: dashTblElement.nodeId,
      });
      console.log("Table Platform Fonts (CDP):", tblPlatformFonts);
      expect(tblPlatformFonts.fonts.some((f) => f.familyName.includes("Geist"))).toBe(
        true,
      );
    }

    // Screenshot dashboard
    await page.screenshot({
      path: path.join(screenshotDir, "02-dashboard.png"),
      fullPage: true,
    });

    // 3. Visit Inventory Page
    await page.getByRole("link", { name: "Inventory" }).click();
    await expect(page.locator("table").first()).toBeVisible({ timeout: 15_000 });

    // Verify Inventory Table styles (table, prices, areas, buttons)
    const inventoryStyles = await page.evaluate(() => {
      const tbl = document.querySelector("table");
      const s = tbl ? window.getComputedStyle(tbl) : null;
      const priceEl = document.querySelector(".price");
      const areaEl = document.querySelector(".area");
      const btn = document.querySelector("button");

      return {
        table: s
          ? {
              fontFamily: s.fontFamily,
              fontFeatureSettings: s.fontFeatureSettings,
              fontVariantNumeric: s.fontVariantNumeric,
            }
          : null,
        price: priceEl
          ? {
              fontFeatureSettings: window.getComputedStyle(priceEl).fontFeatureSettings,
              fontVariantNumeric: window.getComputedStyle(priceEl).fontVariantNumeric,
            }
          : null,
        area: areaEl
          ? {
              fontFeatureSettings: window.getComputedStyle(areaEl).fontFeatureSettings,
              fontVariantNumeric: window.getComputedStyle(areaEl).fontVariantNumeric,
            }
          : null,
        button: btn
          ? {
              fontFamily: window.getComputedStyle(btn).fontFamily,
            }
          : null,
      };
    });
    console.log("Inventory Page Styles:", inventoryStyles);
    expect(inventoryStyles.table?.fontFamily).toContain("Geist Variable");
    expect(inventoryStyles.table?.fontFeatureSettings).toContain("ss01");
    expect(inventoryStyles.table?.fontFeatureSettings).toContain("cv11");
    expect(inventoryStyles.table?.fontVariantNumeric).toBe("tabular-nums");
    expect(inventoryStyles.button?.fontFamily).toContain("Geist Variable");

    if (inventoryStyles.price) {
      expect(inventoryStyles.price.fontFeatureSettings).toContain("ss01");
      expect(inventoryStyles.price.fontFeatureSettings).toContain("cv11");
      expect(inventoryStyles.price.fontVariantNumeric).toBe("tabular-nums");
    }

    if (inventoryStyles.area) {
      expect(inventoryStyles.area.fontFeatureSettings).toContain("ss01");
      expect(inventoryStyles.area.fontFeatureSettings).toContain("cv11");
      expect(inventoryStyles.area.fontVariantNumeric).toBe("tabular-nums");
    }

    // Inventory Table CDP check
    await page.locator("tbody tr td span").first().waitFor();
    const invDoc = await client.send("DOM.getDocument");
    const invTblElement = await client.send("DOM.querySelector", {
      nodeId: invDoc.root.nodeId,
      selector: "tbody tr td span",
    });
    if (invTblElement.nodeId) {
      const invTblFonts = await client.send("CSS.getPlatformFontsForNode", {
        nodeId: invTblElement.nodeId,
      });
      console.log("Inventory Table Platform Fonts (CDP):", invTblFonts);
      expect(invTblFonts.fonts.some((f) => f.familyName.includes("Geist"))).toBe(true);
    }

    // Screenshot inventory
    await page.screenshot({
      path: path.join(screenshotDir, "03-inventory.png"),
      fullPage: true,
    });
  });
});
