/**
 * Mailtrap Client Unit Tests
 * Test de Mailtrap API connectie en basisfunctionaliteit
 */

import { describe, it, expect, beforeAll } from "vitest";
import { MailtrapClient, createMailtrapClient } from "./mailtrap";

const MAILTRAP_CONFIGURED =
  process.env.MAILTRAP_API_TOKEN &&
  process.env.MAILTRAP_ACCOUNT_ID &&
  process.env.MAILTRAP_INBOX_ID;

describe("Mailtrap Client", () => {
  describe.skipIf(!MAILTRAP_CONFIGURED)("API Connection Tests", () => {
    let client: MailtrapClient;

    beforeAll(() => {
      client = createMailtrapClient();
    });

    it("should connect to Mailtrap API and fetch messages", async () => {
      const messages = await client.getMessages();
      expect(Array.isArray(messages)).toBe(true);
      console.log(`Found ${messages.length} messages in inbox`);
    });

    it("should clean inbox successfully", async () => {
      await expect(client.cleanInbox()).resolves.not.toThrow();
      console.log("Inbox cleaned successfully");
    });

    it("should return null for latest message when inbox is empty", async () => {
      await client.cleanInbox();
      const message = await client.getLatestMessage();
      expect(message).toBeNull();
    });
  });

  describe("Link Extraction (no API needed)", () => {
    it("should extract verification links from HTML", () => {
      // Create a mock client for testing
      const client = createMailtrapClient({
        apiToken: "test-token",
        accountId: "test-account",
        inboxId: "test-inbox",
      });

      const mockMessage = {
        id: 1,
        inbox_id: 1,
        subject: "Verify your email",
        sent_at: new Date().toISOString(),
        from_email: "noreply@yibeitea.be",
        from_name: "Yibei Tea",
        to_email: "user@example.com",
        to_name: "User",
        html_body: `
          <p>Welkom bij Yibei Tea!</p>
          <p>Klik hier om je e-mail te verifiëren:
            <a href="https://yibeitea.be/api/auth/verify?token=abc123xyz">Verifieer E-mail</a>
          </p>
          <p>Of gebruik deze link:
            <a href="https://yibeitea.be/auth/callback?code=def456">Bevestig Account</a>
          </p>
          <p>Bezoek onze website:
            <a href="https://yibeitea.be">Yibei Tea</a>
          </p>
        `,
        text_body:
          "Verifieer je email: https://yibeitea.be/api/auth/verify?token=abc123xyz",
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
        "https://yibeitea.be/api/auth/verify?token=abc123xyz"
      );
      expect(verificationLinks).toContain(
        "https://yibeitea.be/auth/callback?code=def456"
      );
    });

    it("should identify verification link patterns", () => {
      const client = createMailtrapClient({
        apiToken: "test",
        accountId: "test",
        inboxId: "test",
      });

      const testUrls = [
        { url: "https://example.com/verify?token=123", expected: true },
        { url: "https://example.com/auth/verify-email", expected: true },
        { url: "https://example.com/confirm-account", expected: true },
        { url: "https://example.com/activate?code=abc", expected: true },
        { url: "https://example.com/callback?token=xyz", expected: true },
        { url: "https://example.com/about", expected: false },
        { url: "https://example.com/products", expected: false },
        { url: "https://example.com/contact", expected: false },
      ];

      const mockMessage = {
        id: 1,
        inbox_id: 1,
        subject: "Test",
        sent_at: "",
        from_email: "",
        from_name: "",
        to_email: "",
        to_name: "",
        html_body: testUrls.map((t) => `<a href="${t.url}">Link</a>`).join(""),
        text_body: "",
        html_path: "",
        txt_path: "",
        raw_path: "",
        download_path: "",
        html_source_path: "",
        blacklists_report_info: false,
        smtp_information: { ok: true },
      };

      const links = client.extractLinks(mockMessage);

      testUrls.forEach((test) => {
        const link = links.find((l) => l.url === test.url);
        expect(link).toBeDefined();
        expect(link?.isVerificationLink).toBe(test.expected);
      });
    });
  });
});
