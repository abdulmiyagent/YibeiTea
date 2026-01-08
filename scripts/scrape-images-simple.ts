/**
 * Simple Image Scraper for Yibei Tea
 * Uses Google Images search to find product photos
 */

import puppeteer, { Browser, Page } from "puppeteer";
import * as fs from "fs";
import * as path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "scraped-images");
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, "screenshots");

async function ensureDirectories() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function acceptCookieConsent(page: Page) {
  console.log("🍪 Checking for cookie consent...");
  try {
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      for (const btn of buttons) {
        const text = btn.textContent?.toLowerCase() || '';
        if (text.includes('accept all') || text.includes('alles accepteren') || text.includes('i agree')) {
          btn.click();
          return true;
        }
      }
      return false;
    });
    if (clicked) {
      console.log("✅ Accepted cookies");
      await delay(2000);
    }
  } catch {
    // Continue
  }
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║     Yibei Tea - Simple Image Scraper                       ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  await ensureDirectories();

  const browser = await puppeteer.launch({
    headless: false,
    channel: "chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1920,1080"],
    defaultViewport: { width: 1920, height: 1080 },
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Search for Yibei Tea images on Google
    console.log("📍 Searching Google Images for Yibei Tea Gent...");
    await page.goto("https://www.google.com/search?q=Yibei+Tea+Gent+bubble+tea&tbm=isch", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    await delay(2000);
    await acceptCookieConsent(page);
    await delay(2000);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "google-images-search.png"),
      fullPage: false
    });
    console.log("📸 Saved Google Images search results");

    // Click on images and capture them
    console.log("\n📷 Capturing individual images...\n");

    for (let i = 0; i < 15; i++) {
      try {
        // Find image thumbnails
        const thumbnails = await page.$$('img[data-src], img[src*="encrypted"]');

        if (thumbnails[i]) {
          await thumbnails[i].click();
          await delay(2000);

          // Take screenshot of the larger image view
          await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, `google-image-${i.toString().padStart(2, "0")}.png`),
            fullPage: false
          });
          console.log(`   Captured image ${i + 1}/15`);

          // Press Escape to close the image viewer
          await page.keyboard.press('Escape');
          await delay(500);
        }
      } catch (err) {
        console.log(`   Skipped image ${i + 1}`);
      }
    }

    // Now try Google Maps photos directly
    console.log("\n📍 Navigating to Google Maps photos...");

    // Use the direct photos URL for Yibei Tea
    await page.goto("https://www.google.com/maps/search/Yibei+Tea+Gent/@51.054,3.725,17z", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    await delay(3000);
    await acceptCookieConsent(page);
    await delay(2000);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "maps-search.png"),
      fullPage: false
    });

    // Try to click on "All" photos or the business listing
    console.log("🔍 Looking for photos section...");

    // Click on the first result
    await page.evaluate(() => {
      const feed = document.querySelector('[role="feed"]');
      const firstItem = feed?.querySelector('div') || document.querySelector('[data-result-index="0"]');
      if (firstItem) {
        (firstItem as HTMLElement).click();
      }
    });

    await delay(4000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "maps-business.png"),
      fullPage: false
    });

    // Look for and click on "See all photos" or similar
    const photosClicked = await page.evaluate(() => {
      // Look for "Foto's bekijken" or "See photos" button
      const allElements = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      for (const el of allElements) {
        const text = el.textContent?.toLowerCase() || '';
        if (text.includes('photo') || text.includes('foto') || text.includes('all')) {
          (el as HTMLElement).click();
          return true;
        }
      }
      return false;
    });

    if (photosClicked) {
      console.log("✅ Clicked on photos section");
      await delay(3000);
    }

    // Take screenshots at different positions
    for (let i = 0; i < 10; i++) {
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `maps-photos-${i.toString().padStart(2, "0")}.png`),
        fullPage: false
      });
      console.log(`   Captured maps view ${i + 1}/10`);

      // Scroll or navigate
      await page.keyboard.press('ArrowRight');
      await delay(1500);
    }

    console.log("\n✅ Scraping complete!");
    console.log(`   📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);

    // Keep browser open for manual inspection
    console.log("\n⏳ Browser stays open for 20 seconds for manual inspection...");
    await delay(20000);

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
