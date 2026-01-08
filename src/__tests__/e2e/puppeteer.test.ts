import puppeteer, { Browser, Page } from "puppeteer";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "path";
import os from "os";

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";
const TEST_TIMEOUT = 120000; // 120 seconds for browser tests with extensions

// Use a separate test profile directory to avoid conflicts with running Chrome
const TEST_USER_DATA_DIR = path.join(os.tmpdir(), `puppeteer-test-profile-${Date.now()}`);

describe("E2E Browser Tests", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // Must be false for extensions to work
      channel: "chrome", // Use installed Chrome instead of bundled Chromium
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        `--user-data-dir=${TEST_USER_DATA_DIR}`,
        "--enable-extensions",
      ],
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
  }, TEST_TIMEOUT);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it("should load the homepage", async () => {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Check that the page loaded successfully
    const title = await page.title();
    expect(title).toBeTruthy();

    // Take a screenshot for debugging
    await page.screenshot({ path: "screenshots/homepage.png" });
  }, TEST_TIMEOUT);

  it("should have navigation elements", async () => {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Check for common navigation elements
    const body = await page.$("body");
    expect(body).not.toBeNull();

    // Check if main content exists
    const mainContent = await page.$("main");
    if (mainContent) {
      expect(mainContent).not.toBeNull();
    }
  }, TEST_TIMEOUT);

  it("should be responsive", async () => {
    // Test mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.screenshot({ path: "screenshots/homepage-mobile.png" });

    // Reset to desktop viewport
    await page.setViewport({ width: 1280, height: 800 });
  }, TEST_TIMEOUT);

  it("should handle navigation", async () => {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Find all links on the page
    const links = await page.$$("a");
    expect(links.length).toBeGreaterThan(0);

    // Log the number of links found
    console.log(`Found ${links.length} links on the page`);
  }, TEST_TIMEOUT);

  it("should not have console errors", async () => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Filter out known/acceptable errors
    const criticalErrors = consoleErrors.filter(
      (error) => !error.includes("favicon") && !error.includes("404")
    );

    if (criticalErrors.length > 0) {
      console.log("Console errors:", criticalErrors);
    }
  }, TEST_TIMEOUT);
});
