/**
 * E2E Tests voor e-mail functionaliteit
 *
 * Test nieuwsbrief aanmeldingen en e-mail verificatie
 * met Mailtrap als e-mail testing service.
 *
 * Vereiste environment variabelen:
 * - MAILTRAP_API_TOKEN
 * - MAILTRAP_ACCOUNT_ID
 * - MAILTRAP_INBOX_ID
 */

import puppeteer, { Browser, Page } from "puppeteer";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  MailtrapClient,
  createMailtrapClient,
  waitForVerificationEmail,
} from "../utils/mailtrap";

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";
const TEST_TIMEOUT = 60000;

// Skip tests als Mailtrap niet geconfigureerd is
const MAILTRAP_CONFIGURED =
  process.env.MAILTRAP_API_TOKEN &&
  process.env.MAILTRAP_ACCOUNT_ID &&
  process.env.MAILTRAP_INBOX_ID;

describe.skipIf(!MAILTRAP_CONFIGURED)("E-mail Verificatie Tests", () => {
  let browser: Browser;
  let page: Page;
  let mailtrap: MailtrapClient;

  beforeAll(async () => {
    // Initialiseer Mailtrap client
    mailtrap = createMailtrapClient();

    // Start browser
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    page = await browser.newPage();
  }, TEST_TIMEOUT);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    // Leeg de inbox voor elke test
    await mailtrap.cleanInbox();
  });

  describe("Nieuwsbrief Aanmelding", () => {
    it("should send confirmation email after newsletter signup", async () => {
      const testEmail = `test-${Date.now()}@example.com`;

      // Navigeer naar de pagina met nieuwsbrief formulier
      await page.goto(BASE_URL, { waitUntil: "networkidle0" });

      // Zoek en vul het nieuwsbrief formulier in
      const emailInput = await page.$('input[type="email"]');
      if (emailInput) {
        await emailInput.type(testEmail);

        // Submit het formulier
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();
        }
      }

      // Wacht op de bevestigingsmail
      const message = await mailtrap.waitForEmail({
        timeout: 30000,
        toEmail: testEmail,
      });

      expect(message).toBeDefined();
      expect(message.to_email).toBe(testEmail);
      expect(message.subject.toLowerCase()).toContain("nieuwsbrief");
    }, TEST_TIMEOUT);
  });

  describe("Account Verificatie", () => {
    it("should send verification email after registration", async () => {
      const testEmail = `newuser-${Date.now()}@example.com`;
      const testPassword = "TestPassword123!";

      // Navigeer naar registratiepagina
      await page.goto(`${BASE_URL}/auth/register`, {
        waitUntil: "networkidle0",
      });

      // Vul registratieformulier in
      await page.type('input[name="email"]', testEmail);
      await page.type('input[name="password"]', testPassword);
      await page.type('input[name="confirmPassword"]', testPassword);

      // Submit registratie
      await page.click('button[type="submit"]');

      // Wacht op verificatie e-mail
      const { message, verificationLink } = await waitForVerificationEmail(
        mailtrap,
        {
          timeout: 30000,
          toEmail: testEmail,
        }
      );

      expect(message).toBeDefined();
      expect(verificationLink).toBeTruthy();
      expect(verificationLink).toContain("verify");
    }, TEST_TIMEOUT);

    it("should verify account when clicking verification link", async () => {
      const testEmail = `verify-${Date.now()}@example.com`;
      const testPassword = "TestPassword123!";

      // Registreer nieuwe gebruiker
      await page.goto(`${BASE_URL}/auth/register`, {
        waitUntil: "networkidle0",
      });
      await page.type('input[name="email"]', testEmail);
      await page.type('input[name="password"]', testPassword);
      await page.type('input[name="confirmPassword"]', testPassword);
      await page.click('button[type="submit"]');

      // Haal verificatielink op
      const { verificationLink } = await waitForVerificationEmail(mailtrap, {
        timeout: 30000,
        toEmail: testEmail,
      });

      expect(verificationLink).toBeTruthy();

      // Klik op de verificatielink
      await page.goto(verificationLink!, { waitUntil: "networkidle0" });

      // Controleer of verificatie succesvol was
      const pageContent = await page.content();
      expect(
        pageContent.toLowerCase().includes("geverifieerd") ||
          pageContent.toLowerCase().includes("verified") ||
          pageContent.toLowerCase().includes("success")
      ).toBe(true);
    }, TEST_TIMEOUT);
  });

  describe("Wachtwoord Reset", () => {
    it("should send password reset email", async () => {
      const testEmail = "existing-user@example.com";

      // Navigeer naar wachtwoord vergeten pagina
      await page.goto(`${BASE_URL}/auth/forgot-password`, {
        waitUntil: "networkidle0",
      });

      // Vul e-mailadres in
      await page.type('input[name="email"]', testEmail);
      await page.click('button[type="submit"]');

      // Wacht op reset e-mail
      const message = await mailtrap.waitForEmail({
        timeout: 30000,
        toEmail: testEmail,
      });

      expect(message).toBeDefined();
      expect(
        message.subject.toLowerCase().includes("wachtwoord") ||
          message.subject.toLowerCase().includes("password") ||
          message.subject.toLowerCase().includes("reset")
      ).toBe(true);

      // Extraheer reset link
      const links = mailtrap.extractLinks(message);
      const resetLink = links.find(
        (l) =>
          l.url.includes("reset") ||
          l.url.includes("password") ||
          l.url.includes("token")
      );

      expect(resetLink).toBeDefined();
    }, TEST_TIMEOUT);
  });
});

describe("Mailtrap Client Unit Tests", () => {
  // Deze tests draaien alleen als Mailtrap geconfigureerd is
  const skipCondition = !MAILTRAP_CONFIGURED;

  it.skipIf(skipCondition)("should connect to Mailtrap API", async () => {
    const client = createMailtrapClient();
    const messages = await client.getMessages();

    expect(Array.isArray(messages)).toBe(true);
  });

  it.skipIf(skipCondition)("should clean inbox", async () => {
    const client = createMailtrapClient();

    // Dit zou geen error moeten geven
    await expect(client.cleanInbox()).resolves.not.toThrow();
  });

  it("should extract verification links correctly", () => {
    // Deze test draait altijd (geen API call nodig)
    const client = new (class extends MailtrapClient {
      constructor() {
        // Mock config voor unit test
        super({
          apiToken: "test",
          accountId: "test",
          inboxId: "test",
        });
      }
    })();

    const mockMessage = {
      id: 1,
      inbox_id: 1,
      subject: "Verify your email",
      sent_at: new Date().toISOString(),
      from_email: "noreply@example.com",
      from_name: "Test",
      to_email: "user@example.com",
      to_name: "User",
      html_body: `
        <p>Click here to verify:
          <a href="https://example.com/verify?token=abc123">Verify Email</a>
        </p>
        <p>Or this link:
          <a href="https://example.com/auth/callback?code=xyz789">Confirm</a>
        </p>
        <p>Regular link:
          <a href="https://example.com/about">About Us</a>
        </p>
      `,
      text_body:
        "Verify at: https://example.com/verify?token=abc123\nVisit: https://example.com",
      html_path: "",
      txt_path: "",
      raw_path: "",
      download_path: "",
      html_source_path: "",
      blacklists_report_info: false,
      smtp_information: { ok: true },
    };

    const links = client.extractLinks(mockMessage);
    const verificationLinks = client.extractVerificationLinks(mockMessage);

    expect(links.length).toBeGreaterThan(0);
    expect(verificationLinks.length).toBe(2);
    expect(verificationLinks).toContain(
      "https://example.com/verify?token=abc123"
    );
  });
});
