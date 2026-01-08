/**
 * Instagram Image Scraper for Yibei Tea
 * Captures product photos from Yibei Tea's Instagram page
 */

import puppeteer, { Browser } from "puppeteer";
import * as fs from "fs";
import * as path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "scraped-images");
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, "instagram");

// Yibei Tea Instagram URL
const INSTAGRAM_URL = "https://www.instagram.com/yibeitea/";

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

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║     Yibei Tea - Instagram Scraper                          ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  await ensureDirectories();

  const browser = await puppeteer.launch({
    headless: false,
    channel: "chrome",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1920,1080",
    ],
    defaultViewport: { width: 1920, height: 1080 },
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    console.log("📍 Navigating to Yibei Tea Instagram...");
    await page.goto(INSTAGRAM_URL, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    await delay(3000);

    // Handle cookie consent if present
    try {
      const cookieButton = await page.$('button:has-text("Allow"), button:has-text("Accept"), [role="button"]:has-text("Allow")');
      if (cookieButton) {
        await cookieButton.click();
        console.log("✅ Accepted cookies");
        await delay(2000);
      }
    } catch {
      // No cookie dialog
    }

    // Take initial screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01-instagram-profile.png"),
      fullPage: false
    });
    console.log("📸 Saved Instagram profile screenshot");

    // Scroll and capture the feed
    console.log("\n📷 Capturing Instagram posts...\n");

    for (let i = 0; i < 10; i++) {
      // Take screenshot at current scroll position
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `feed-${(i + 1).toString().padStart(2, "0")}.png`),
        fullPage: false
      });
      console.log(`   Captured feed screenshot ${i + 1}/10`);

      // Scroll down
      await page.evaluate(() => {
        window.scrollBy(0, 800);
      });

      await delay(2000);
    }

    // Try to click on individual posts for larger images
    console.log("\n📷 Trying to capture individual posts...\n");

    // Go back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(2000);

    // Find and click on posts
    const posts = await page.$$('article a[href*="/p/"], a[href*="/reel/"]');
    console.log(`Found ${posts.length} posts`);

    for (let i = 0; i < Math.min(posts.length, 15); i++) {
      try {
        // Re-query posts as DOM might have changed
        const currentPosts = await page.$$('article a[href*="/p/"], a[href*="/reel/"]');
        if (currentPosts[i]) {
          await currentPosts[i].click();
          await delay(3000);

          // Take screenshot of the post
          await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, `post-${(i + 1).toString().padStart(2, "0")}.png`),
            fullPage: false
          });
          console.log(`   Captured post ${i + 1}/${Math.min(posts.length, 15)}`);

          // Close the post modal by pressing Escape or clicking outside
          await page.keyboard.press('Escape');
          await delay(1000);
        }
      } catch (err) {
        console.log(`   Skipped post ${i + 1}`);
      }
    }

    console.log("\n✅ Instagram scraping complete!");
    console.log(`   📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);

    // Keep browser open for manual inspection
    console.log("\n⏳ Browser stays open for 20 seconds for manual inspection...");
    await delay(20000);

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
