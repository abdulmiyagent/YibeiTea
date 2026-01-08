/**
 * Google Reviews Image Scraper for Yibei Tea Gent
 *
 * This script uses Puppeteer to:
 * 1. Navigate to Yibei Tea's Google Reviews page
 * 2. Scroll through and capture product images from reviews
 * 3. Take screenshots of individual product images
 * 4. Save them for later processing with background removal
 *
 * Usage: npx tsx scripts/scrape-google-reviews.ts
 */

import puppeteer, { Browser, Page } from "puppeteer";
import * as fs from "fs";
import * as path from "path";

// Use search-based URL for more reliable access
const GOOGLE_MAPS_SEARCH_URL = "https://www.google.com/maps/search/Yibei+Tea+Gent";
const GOOGLE_SEARCH_URL = "https://www.google.com/search?q=Yibei+Tea+Gent+Google+Reviews&tbm=lcl";

const OUTPUT_DIR = path.join(process.cwd(), "scraped-images");
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, "screenshots");

interface ScrapedImage {
  filename: string;
  source: string;
  possibleProduct: string;
  timestamp: number;
}

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
  console.log("🍪 Checking for cookie consent dialog...");

  const consentSelectors = [
    'button[aria-label*="Accept all"]',
    'button[aria-label*="Alles accepteren"]',
    'button:has-text("Accept all")',
    'button:has-text("Alles accepteren")',
    '#L2AGLb', // Google's Accept all button ID
    'button[id="L2AGLb"]',
    '[aria-label="Accept all"]',
    'div[role="dialog"] button:last-child', // Usually the accept button
  ];

  for (const selector of consentSelectors) {
    try {
      const button = await page.$(selector);
      if (button) {
        await button.click();
        console.log(`✅ Clicked consent button: ${selector}`);
        await delay(2000);
        return true;
      }
    } catch {
      // Try next selector
    }
  }

  // Try with evaluate for text-based search
  try {
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      for (const btn of buttons) {
        if (btn.textContent?.toLowerCase().includes('accept all') ||
            btn.textContent?.toLowerCase().includes('alles accepteren') ||
            btn.textContent?.toLowerCase().includes('akkoord')) {
          (btn as HTMLButtonElement).click();
          return true;
        }
      }
      return false;
    });
    if (clicked) {
      console.log("✅ Clicked consent button via text search");
      await delay(2000);
      return true;
    }
  } catch {
    // Continue
  }

  console.log("⚠️ No cookie consent dialog found or already accepted");
  return false;
}

async function scrapeGoogleReviews() {
  console.log("🚀 Starting Google Reviews scraper for Yibei Tea Gent...\n");

  await ensureDirectories();

  let browser: Browser | null = null;
  const scrapedImages: ScrapedImage[] = [];

  try {
    // Launch browser with visible window for debugging
    browser = await puppeteer.launch({
      headless: false,
      channel: "chrome",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
        "--window-size=1920,1080",
      ],
      defaultViewport: { width: 1920, height: 1080 },
    });

    const page = await browser.newPage();

    // Set a realistic user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    console.log("📍 Navigating to Google Maps search for Yibei Tea Gent...");
    await page.goto(GOOGLE_MAPS_SEARCH_URL, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    // Wait for the page to load
    await delay(3000);

    // Handle cookie consent
    await acceptCookieConsent(page);
    await delay(2000);

    // Take initial screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01-initial-page.png"),
      fullPage: false
    });
    console.log("📸 Saved initial page screenshot");

    // Click on the first result (Yibei Tea)
    console.log("🔍 Looking for Yibei Tea in search results...");

    // Try to click on the search result
    const resultClicked = await page.evaluate(() => {
      // Look for any clickable element containing "Yibei"
      const elements = Array.from(document.querySelectorAll('[role="article"], [class*="result"], a[href*="place"]'));
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (el.textContent?.toLowerCase().includes('yibei')) {
          (el as HTMLElement).click();
          return true;
        }
      }
      // Also try clicking on the first visible business listing
      const firstResult = document.querySelector('[data-result-index="0"]') ||
                         document.querySelector('.section-result') ||
                         document.querySelector('[role="feed"] > div');
      if (firstResult) {
        (firstResult as HTMLElement).click();
        return true;
      }
      return false;
    });

    if (resultClicked) {
      console.log("✅ Clicked on Yibei Tea result");
    } else {
      console.log("⚠️ Could not find result, continuing anyway...");
    }

    await delay(4000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "02-after-result-click.png"),
      fullPage: false
    });

    // Now try to find and click on "Photos" tab
    console.log("🔍 Looking for Photos tab...");

    // Look for photos button/tab - Google Maps has different layouts
    const photosSelectors = [
      'button[data-tab-index="2"]',
      'button[aria-label*="photo" i]',
      'button[aria-label*="foto" i]',
      '[data-tab-index="1"]', // Often photos is index 1
      'button:has-text("Foto")',
      'button:has-text("Photo")',
      '[aria-label*="All"]',
    ];

    let photosClicked = false;
    for (const selector of photosSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.click();
          photosClicked = true;
          console.log(`✅ Clicked photos tab using selector: ${selector}`);
          break;
        }
      } catch {
        // Continue to next selector
      }
    }

    if (!photosClicked) {
      console.log("⚠️ Could not find Photos tab, trying to click on any image...");

      // Try clicking on any visible photo
      const clicked = await page.evaluate(() => {
        const images = document.querySelectorAll('img[src*="googleusercontent"], img[src*="gstatic"]');
        for (const img of images) {
          const imgEl = img as HTMLImageElement;
          if (imgEl.width > 50 && imgEl.height > 50) {
            imgEl.click();
            return true;
          }
        }
        // Try clicking on photo thumbnails in the business panel
        const photoButton = document.querySelector('[data-photo-index], [aria-label*="photo"], [aria-label*="foto"]');
        if (photoButton) {
          (photoButton as HTMLElement).click();
          return true;
        }
        return false;
      });
      if (clicked) {
        console.log("📷 Clicked on an image element");
      }
    }

    await delay(3000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "03-after-photos-click.png"),
      fullPage: false
    });

    // Click on photos at the bottom to open the gallery in fullscreen
    console.log("📷 Trying to open photo gallery in fullscreen...");

    const galleryOpened = await page.evaluate(() => {
      // Look for photo elements at the bottom of the page
      const photoContainers = Array.from(document.querySelectorAll('[data-photo-index], [role="img"], .gallery-cell'));
      for (const container of photoContainers) {
        (container as HTMLElement).click();
        return true;
      }
      // Try clicking on any large image
      const images = Array.from(document.querySelectorAll('img'));
      for (const img of images) {
        const imgEl = img as HTMLImageElement;
        if (imgEl.width > 100 && imgEl.height > 100 && imgEl.src.includes('googleusercontent')) {
          imgEl.click();
          return true;
        }
      }
      return false;
    });

    if (galleryOpened) {
      console.log("✅ Gallery opened");
      await delay(3000);
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "04-gallery-view.png"),
      fullPage: false
    });

    // Navigate through gallery and capture individual photos
    console.log("\n📸 Capturing individual product photos from gallery...\n");

    for (let photoNum = 0; photoNum < 20; photoNum++) {
      // Take screenshot of current photo
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `gallery-photo-${photoNum.toString().padStart(2, "0")}.png`),
        fullPage: false
      });

      scrapedImages.push({
        filename: `gallery-photo-${photoNum.toString().padStart(2, "0")}.png`,
        source: "google-maps-gallery",
        possibleProduct: "unknown",
        timestamp: Date.now(),
      });

      console.log(`   Captured photo ${photoNum + 1}/20`);

      // Try to navigate to next photo
      const hasNext = await page.evaluate(() => {
        // Look for next button
        const nextButtons = document.querySelectorAll('[aria-label*="Next"], [aria-label*="Volgende"], button[jsaction*="next"], [data-value="next"]');
        for (const btn of nextButtons) {
          (btn as HTMLElement).click();
          return true;
        }
        // Try pressing arrow right
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        return true;
      });

      if (!hasNext) {
        console.log("   No more photos available");
        break;
      }

      await delay(1500);
    }

    // Now look for food/drink photos
    console.log("\n🍵 Searching for additional product images...\n");

    // More comprehensive image selectors for Google Maps
    const imageSelectors = [
      'img[src*="googleusercontent"]',
      'img[src*="lh3.google"]',
      'img[src*="gstatic"]',
      'img[data-src*="googleusercontent"]',
      '[style*="background-image"]',
      'button[data-photo-index] img',
      '.gallery-image img',
      '[aria-label*="Photo"] img',
      '[aria-label*="Foto"] img',
    ];

    // Scroll and capture images
    for (let i = 0; i < 10; i++) {
      console.log(`📜 Scroll iteration ${i + 1}/10...`);

      // Find all images on the page using multiple selectors
      let allImages: Array<{src: string, alt: string, width: number, height: number}> = [];

      for (const selector of imageSelectors) {
        try {
          const images = await page.$$eval(selector, (imgs) => {
            return imgs.map((el) => {
              const img = el as HTMLImageElement;
              // Handle both img tags and background images
              const src = img.src || img.getAttribute('data-src') || '';
              const style = getComputedStyle(el);
              const bgImage = style.backgroundImage;
              const actualSrc = src || (bgImage !== 'none' ? bgImage.replace(/url\(['"]?(.+?)['"]?\)/, '$1') : '');

              return {
                src: actualSrc,
                alt: img.alt || "",
                width: img.naturalWidth || img.offsetWidth || 0,
                height: img.naturalHeight || img.offsetHeight || 0,
              };
            }).filter(img => img.src && (img.width > 100 || img.height > 100));
          });
          allImages = [...allImages, ...images];
        } catch {
          // Selector not found, continue
        }
      }

      // Remove duplicates
      const uniqueImages = allImages.filter((img, index, self) =>
        index === self.findIndex((t) => t.src === img.src)
      );

      console.log(`   Found ${uniqueImages.length} unique images`);

      // Take full page screenshot at each scroll position
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `scroll-${i + 1}.png`),
        fullPage: false
      });

      // Take screenshots of individual images
      for (let j = 0; j < Math.min(uniqueImages.length, 5); j++) {
        const imgIndex = i * 5 + j;
        const screenshotPath = path.join(SCREENSHOTS_DIR, `product-${imgIndex.toString().padStart(3, "0")}.png`);

        try {
          // Try to find and screenshot individual images
          const imageElements = await page.$$('img');
          for (const imgEl of imageElements) {
            const box = await imgEl.boundingBox();
            if (box && box.width > 150 && box.height > 150) {
              await page.screenshot({
                path: screenshotPath,
                clip: {
                  x: Math.max(0, box.x - 10),
                  y: Math.max(0, box.y - 10),
                  width: Math.min(box.width + 20, 800),
                  height: Math.min(box.height + 20, 800),
                },
              });

              scrapedImages.push({
                filename: `product-${imgIndex.toString().padStart(3, "0")}.png`,
                source: uniqueImages[j]?.src || "unknown",
                possibleProduct: "unknown",
                timestamp: Date.now(),
              });
              break;
            }
          }
        } catch (err) {
          // Skip this image
        }
      }

      // Scroll down - try different scroll containers
      await page.evaluate(() => {
        const containers = [
          document.querySelector('[role="main"]'),
          document.querySelector('.section-layout'),
          document.querySelector('[aria-label*="Reviews"]'),
          document.querySelector('[aria-label*="Recensies"]'),
          document.body
        ];
        for (const container of containers) {
          if (container) {
            container.scrollBy(0, 600);
            break;
          }
        }
      });

      await delay(2000);
    }

    // Also take full page screenshots at different scroll positions
    console.log("\n📸 Taking overview screenshots...");

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(1000);

    for (let i = 0; i < 5; i++) {
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `overview-${i + 1}.png`),
        fullPage: false
      });

      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      await delay(1000);
    }

    // Save metadata
    const metadata = {
      scrapedAt: new Date().toISOString(),
      totalImages: scrapedImages.length,
      images: scrapedImages,
    };

    fs.writeFileSync(
      path.join(OUTPUT_DIR, "scraped-metadata.json"),
      JSON.stringify(metadata, null, 2)
    );

    console.log(`\n✅ Scraping complete!`);
    console.log(`   📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);
    console.log(`   📊 Total images captured: ${scrapedImages.length}`);
    console.log(`   📝 Metadata saved to: ${path.join(OUTPUT_DIR, "scraped-metadata.json")}`);

    // Keep browser open for manual inspection
    console.log("\n⏳ Browser will stay open for 30 seconds for manual inspection...");
    console.log("   You can manually browse and take additional screenshots.");
    await delay(30000);

  } catch (error) {
    console.error("❌ Error during scraping:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return scrapedImages;
}

// Alternative approach: Direct search for Yibei Tea photos
async function scrapeGooglePhotosSearch() {
  console.log("\n🔍 Alternative approach: Google Image search for Yibei Tea products...\n");

  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch({
      headless: false,
      channel: "chrome",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: { width: 1920, height: 1080 },
    });

    const page = await browser.newPage();

    // Search for Yibei Tea Gent photos
    const searchQuery = "Yibei Tea Gent bubble tea";
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=isch`;

    console.log(`📍 Searching: ${searchQuery}`);
    await page.goto(searchUrl, { waitUntil: "networkidle2" });

    await delay(2000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "google-image-search.png"),
      fullPage: false
    });

    console.log("📸 Saved Google Image search results");

    // Click on some images to get larger versions
    const thumbnails = await page.$$('img[data-src]');
    console.log(`Found ${thumbnails.length} image thumbnails`);

    for (let i = 0; i < Math.min(thumbnails.length, 10); i++) {
      try {
        await thumbnails[i].click();
        await delay(1500);
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, `search-result-${i + 1}.png`),
          fullPage: false
        });
      } catch {
        // Continue
      }
    }

    console.log("\n⏳ Browser will stay open for 30 seconds for manual inspection...");
    await delay(30000);

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Main execution
async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║     Yibei Tea - Google Reviews Image Scraper               ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  await ensureDirectories();

  // First try Google Maps reviews
  await scrapeGoogleReviews();

  // Then try Google Image search as backup
  // await scrapeGooglePhotosSearch();

  console.log("\n🎉 Done! Check the scraped-images folder for results.");
}

main().catch(console.error);
