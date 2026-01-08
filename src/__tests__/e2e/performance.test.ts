import puppeteer, { Browser, Page } from "puppeteer";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "path";
import os from "os";

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";
const TEST_TIMEOUT = 60000;
const TEST_USER_DATA_DIR = path.join(os.tmpdir(), `puppeteer-perf-${Date.now()}`);

describe("Performance Tests", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        `--user-data-dir=${TEST_USER_DATA_DIR}`,
        "--disable-dev-shm-usage",
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

  it("should measure homepage performance", async () => {
    console.log("\n📊 HOMEPAGE PERFORMANCE METRICS\n");

    // Clear cache for accurate measurement
    const client = await page.createCDPSession();
    await client.send("Network.clearBrowserCache");

    const startTime = Date.now();

    // Navigate with domcontentloaded (faster, more reliable)
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    const domContentLoaded = Date.now() - startTime;

    // Wait for main content to appear
    await page.waitForSelector("main", { timeout: 10000 }).catch(() => null);
    const mainVisible = Date.now() - startTime;

    // Get paint timing
    const paintTiming = await page.evaluate(() => {
      const entries = performance.getEntriesByType("paint");
      const fp = entries.find(e => e.name === "first-paint");
      const fcp = entries.find(e => e.name === "first-contentful-paint");
      return {
        firstPaint: fp ? Math.round(fp.startTime) : 0,
        firstContentfulPaint: fcp ? Math.round(fcp.startTime) : 0,
      };
    });

    // Get memory usage
    const metrics = await page.metrics();
    const heapMB = (metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2);

    // Count DOM nodes
    const domNodes = await page.evaluate(() => document.getElementsByTagName("*").length);

    console.log("⏱️  Timing:");
    console.log(`   DOM Content Loaded: ${domContentLoaded}ms`);
    console.log(`   Main Content Visible: ${mainVisible}ms`);
    console.log(`   First Paint: ${paintTiming.firstPaint}ms`);
    console.log(`   First Contentful Paint: ${paintTiming.firstContentfulPaint}ms`);

    console.log("\n📦 Resources:");
    console.log(`   JS Heap: ${heapMB}MB`);
    console.log(`   DOM Nodes: ${domNodes}`);

    console.log("\n✅ Assessment:");
    const domOk = domContentLoaded < 3000;
    const fcpOk = paintTiming.firstContentfulPaint < 2000;
    const heapOk = parseFloat(heapMB) < 50;

    console.log(`   DOM Load < 3s: ${domOk ? "PASS ✓" : "FAIL ✗"} (${domContentLoaded}ms)`);
    console.log(`   FCP < 2s: ${fcpOk ? "PASS ✓" : "FAIL ✗"} (${paintTiming.firstContentfulPaint}ms)`);
    console.log(`   Heap < 50MB: ${heapOk ? "PASS ✓" : "FAIL ✗"} (${heapMB}MB)`);

    await client.detach();

    expect(domContentLoaded).toBeLessThan(5000);
    expect(paintTiming.firstContentfulPaint).toBeLessThan(3000);
  }, TEST_TIMEOUT);

  it("should measure scroll performance", async () => {
    console.log("\n📊 SCROLL PERFORMANCE METRICS\n");

    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Wait for content
    await new Promise(r => setTimeout(r, 2000));

    // Measure scroll performance
    const scrollMetrics = await page.evaluate(async () => {
      const results = {
        totalFrames: 0,
        slowFrames: 0,
        frameTimes: [] as number[],
      };

      let lastTime = performance.now();

      // Collect frames during scroll
      const collectFrames = () => {
        const now = performance.now();
        const frameTime = now - lastTime;
        results.frameTimes.push(frameTime);
        results.totalFrames++;
        if (frameTime > 33) results.slowFrames++; // >30fps threshold
        lastTime = now;
      };

      // Start frame collection
      let rafId: number;
      const frameLoop = () => {
        collectFrames();
        if (results.totalFrames < 60) {
          rafId = requestAnimationFrame(frameLoop);
        }
      };
      rafId = requestAnimationFrame(frameLoop);

      // Scroll down
      for (let i = 0; i < 10; i++) {
        window.scrollBy(0, 300);
        await new Promise(r => setTimeout(r, 100));
      }

      // Wait for frames to collect
      await new Promise(r => setTimeout(r, 1000));
      cancelAnimationFrame(rafId);

      // Calculate stats
      const avgFrameTime = results.frameTimes.length > 0
        ? results.frameTimes.reduce((a, b) => a + b, 0) / results.frameTimes.length
        : 0;

      return {
        totalFrames: results.totalFrames,
        slowFrames: results.slowFrames,
        avgFrameTime: Math.round(avgFrameTime * 100) / 100,
        smoothness: Math.round((1 - results.slowFrames / results.totalFrames) * 100),
      };
    });

    console.log("🖱️  Scroll Metrics:");
    console.log(`   Total Frames: ${scrollMetrics.totalFrames}`);
    console.log(`   Slow Frames (>33ms): ${scrollMetrics.slowFrames}`);
    console.log(`   Avg Frame Time: ${scrollMetrics.avgFrameTime}ms`);
    console.log(`   Smoothness: ${scrollMetrics.smoothness}%`);

    console.log("\n✅ Assessment:");
    const smoothOk = scrollMetrics.smoothness >= 70;
    console.log(`   Smoothness >= 70%: ${smoothOk ? "PASS ✓" : "FAIL ✗"}`);

    expect(scrollMetrics.smoothness).toBeGreaterThanOrEqual(50);
  }, TEST_TIMEOUT);

  it("should measure menu page performance", async () => {
    console.log("\n📊 MENU PAGE PERFORMANCE METRICS\n");

    const startTime = Date.now();
    await page.goto(`${BASE_URL}/nl/menu`, { waitUntil: "domcontentloaded", timeout: 30000 });
    const loadTime = Date.now() - startTime;

    // Wait for products to load
    await new Promise(r => setTimeout(r, 3000));

    // Count product cards
    const productCount = await page.evaluate(() => {
      return document.querySelectorAll("[class*='cursor-pointer']").length;
    });

    // Get heap usage
    const metrics = await page.metrics();
    const heapMB = (metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2);

    console.log("⏱️  Load Time: " + loadTime + "ms");
    console.log("📦  Products Found: " + productCount);
    console.log("💾  JS Heap: " + heapMB + "MB");

    console.log("\n✅ Assessment:");
    const loadOk = loadTime < 3000;
    console.log(`   Load < 3s: ${loadOk ? "PASS ✓" : "FAIL ✗"}`);

    expect(loadTime).toBeLessThan(5000);
  }, TEST_TIMEOUT);

  it("should check for long tasks", async () => {
    console.log("\n📊 LONG TASK DETECTION\n");

    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Monitor for long tasks
    const longTasks = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let count = 0;
        const observer = new PerformanceObserver((list) => {
          count += list.getEntries().length;
        });

        try {
          observer.observe({ type: "longtask", buffered: true });
        } catch (e) {
          // longtask may not be supported
          resolve(0);
          return;
        }

        setTimeout(() => {
          observer.disconnect();
          resolve(count);
        }, 5000);
      });
    });

    console.log(`🔍 Long Tasks Detected: ${longTasks}`);
    console.log(`   (Tasks > 50ms that block main thread)`);

    console.log("\n✅ Assessment:");
    const ok = longTasks <= 5;
    console.log(`   Long Tasks <= 5: ${ok ? "PASS ✓" : "FAIL ✗"}`);

    expect(longTasks).toBeLessThanOrEqual(10);
  }, TEST_TIMEOUT);
});
