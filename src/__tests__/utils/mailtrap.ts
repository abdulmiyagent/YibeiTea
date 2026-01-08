/**
 * Mailtrap Testing API Helper Module
 *
 * Hulpfuncties voor het testen van e-mail functionaliteit
 * zoals nieuwsbrief aanmeldingen en e-mail verificatie.
 *
 * Gebruik:
 * - Stel MAILTRAP_API_TOKEN en MAILTRAP_INBOX_ID in als environment variabelen
 * - Of geef ze mee bij het aanmaken van de MailtrapClient
 */

const MAILTRAP_API_BASE = "https://mailtrap.io/api";

export interface MailtrapConfig {
  apiToken: string;
  accountId: string;
  inboxId: string;
}

export interface MailtrapMessage {
  id: number;
  inbox_id: number;
  subject: string;
  sent_at: string;
  from_email: string;
  from_name: string;
  to_email: string;
  to_name: string;
  html_body: string;
  text_body: string;
  html_path: string;
  txt_path: string;
  raw_path: string;
  download_path: string;
  html_source_path: string;
  blacklists_report_info: boolean;
  smtp_information: {
    ok: boolean;
  };
}

export interface MailtrapMessageSummary {
  id: number;
  inbox_id: number;
  subject: string;
  sent_at: string;
  from_email: string;
  from_name: string;
  to_email: string;
  to_name: string;
  is_read: boolean;
  created_at: string;
}

export interface ExtractedLink {
  url: string;
  text: string;
  isVerificationLink: boolean;
}

export class MailtrapClient {
  private config: MailtrapConfig;

  constructor(config?: Partial<MailtrapConfig>) {
    this.config = {
      apiToken: config?.apiToken || process.env.MAILTRAP_API_TOKEN || "",
      accountId: config?.accountId || process.env.MAILTRAP_ACCOUNT_ID || "",
      inboxId: config?.inboxId || process.env.MAILTRAP_INBOX_ID || "",
    };

    if (!this.config.apiToken) {
      throw new Error("MAILTRAP_API_TOKEN is vereist");
    }
    if (!this.config.accountId) {
      throw new Error("MAILTRAP_ACCOUNT_ID is vereist");
    }
    if (!this.config.inboxId) {
      throw new Error("MAILTRAP_INBOX_ID is vereist");
    }
  }

  private get headers(): HeadersInit {
    return {
      "Api-Token": this.config.apiToken,
      "Content-Type": "application/json",
    };
  }

  private get baseUrl(): string {
    return `${MAILTRAP_API_BASE}/accounts/${this.config.accountId}/inboxes/${this.config.inboxId}`;
  }

  /**
   * Haal alle e-mails op uit de Mailtrap inbox
   * @param options - Optionele filters
   * @returns Array van e-mail samenvattingen
   */
  async getMessages(options?: {
    page?: number;
    search?: string;
    lastMessageId?: number;
  }): Promise<MailtrapMessageSummary[]> {
    const params = new URLSearchParams();
    if (options?.page) params.append("page", options.page.toString());
    if (options?.search) params.append("search", options.search);
    if (options?.lastMessageId) {
      params.append("last_id", options.lastMessageId.toString());
    }

    const url = `${this.baseUrl}/messages${params.toString() ? `?${params}` : ""}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch messages: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Haal een specifieke e-mail op met volledige inhoud
   * @param messageId - ID van het bericht
   * @returns Volledige e-mail data
   */
  async getMessage(messageId: number): Promise<MailtrapMessage> {
    const response = await fetch(`${this.baseUrl}/messages/${messageId}`, {
      method: "GET",
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch message: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Haal de meest recente e-mail op
   * @returns De laatste e-mail of null als inbox leeg is
   */
  async getLatestMessage(): Promise<MailtrapMessage | null> {
    const messages = await this.getMessages();

    if (messages.length === 0) {
      return null;
    }

    // Sorteer op datum (nieuwste eerst) en pak de eerste
    const sortedMessages = messages.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return this.getMessage(sortedMessages[0].id);
  }

  /**
   * Wacht op een nieuwe e-mail en retourneer deze
   * @param options - Configuratie opties
   * @returns De nieuwe e-mail
   */
  async waitForEmail(options?: {
    timeout?: number;
    pollInterval?: number;
    subject?: string;
    toEmail?: string;
  }): Promise<MailtrapMessage> {
    const timeout = options?.timeout || 30000;
    const pollInterval = options?.pollInterval || 1000;
    const startTime = Date.now();

    // Haal huidige messages op om te vergelijken
    const initialMessages = await this.getMessages();
    const initialIds = new Set(initialMessages.map((m) => m.id));

    while (Date.now() - startTime < timeout) {
      const messages = await this.getMessages();
      const newMessages = messages.filter((m) => !initialIds.has(m.id));

      for (const msg of newMessages) {
        const matchesSubject = options?.subject
          ? msg.subject.includes(options.subject)
          : true;
        const matchesToEmail = options?.toEmail
          ? msg.to_email === options.toEmail
          : true;

        if (matchesSubject && matchesToEmail) {
          return this.getMessage(msg.id);
        }
      }

      await this.sleep(pollInterval);
    }

    throw new Error(
      `Timeout: Geen nieuwe e-mail ontvangen binnen ${timeout}ms`
    );
  }

  /**
   * Extraheer alle links uit een e-mail
   * @param message - De e-mail om te analyseren
   * @returns Array van geëxtraheerde links
   */
  extractLinks(message: MailtrapMessage): ExtractedLink[] {
    const links: ExtractedLink[] = [];
    const content = message.html_body || message.text_body;

    if (!content) return links;

    // HTML link regex
    const htmlLinkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
    let match;

    while ((match = htmlLinkRegex.exec(content)) !== null) {
      const url = match[1];
      const text = match[2] || "";

      links.push({
        url,
        text,
        isVerificationLink: this.isVerificationLink(url),
      });
    }

    // Plain text URL regex voor text_body
    if (message.text_body) {
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
      let urlMatch;

      while ((urlMatch = urlRegex.exec(message.text_body)) !== null) {
        const url = urlMatch[0];
        // Voorkom duplicaten
        if (!links.some((l) => l.url === url)) {
          links.push({
            url,
            text: "",
            isVerificationLink: this.isVerificationLink(url),
          });
        }
      }
    }

    return links;
  }

  /**
   * Extraheer verificatielinks uit een e-mail
   * Zoekt naar URLs met tokens/verification patterns
   * @param message - De e-mail om te analyseren
   * @returns Array van verificatie URLs
   */
  extractVerificationLinks(message: MailtrapMessage): string[] {
    const links = this.extractLinks(message);
    return links.filter((l) => l.isVerificationLink).map((l) => l.url);
  }

  /**
   * Haal de eerste verificatielink op uit de meest recente e-mail
   * @returns De verificatielink of null
   */
  async getLatestVerificationLink(): Promise<string | null> {
    const message = await this.getLatestMessage();
    if (!message) return null;

    const verificationLinks = this.extractVerificationLinks(message);
    return verificationLinks[0] || null;
  }

  /**
   * Leeg de inbox voor een schone testomgeving
   */
  async cleanInbox(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/clean`, {
      method: "PATCH",
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to clean inbox: ${response.status} ${response.statusText}`
      );
    }
  }

  /**
   * Verwijder een specifiek bericht
   * @param messageId - ID van het te verwijderen bericht
   */
  async deleteMessage(messageId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/messages/${messageId}`, {
      method: "DELETE",
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to delete message: ${response.status} ${response.statusText}`
      );
    }
  }

  /**
   * Markeer een bericht als gelezen
   * @param messageId - ID van het bericht
   */
  async markAsRead(messageId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/messages/${messageId}`, {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify({ is_read: true }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to mark message as read: ${response.status} ${response.statusText}`
      );
    }
  }

  /**
   * Controleer of een URL een verificatielink is
   */
  private isVerificationLink(url: string): boolean {
    const verificationPatterns = [
      /verify/i,
      /verification/i,
      /confirm/i,
      /activate/i,
      /token=/i,
      /code=/i,
      /auth.*token/i,
      /email.*verify/i,
      /validate/i,
      /callback.*token/i,
    ];

    return verificationPatterns.some((pattern) => pattern.test(url));
  }

  /**
   * Helper functie voor delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Maak een pre-configured Mailtrap client aan
 * Gebruikt environment variabelen voor configuratie
 */
export function createMailtrapClient(
  config?: Partial<MailtrapConfig>
): MailtrapClient {
  return new MailtrapClient(config);
}

/**
 * Hulpfunctie om te wachten tot een verificatie e-mail aankomt
 * en de link te extraheren
 */
export async function waitForVerificationEmail(
  client: MailtrapClient,
  options?: {
    timeout?: number;
    toEmail?: string;
  }
): Promise<{ message: MailtrapMessage; verificationLink: string | null }> {
  const message = await client.waitForEmail({
    timeout: options?.timeout || 30000,
    subject: "verif", // Zoek naar verificatie-gerelateerde onderwerpen
    toEmail: options?.toEmail,
  });

  const verificationLinks = client.extractVerificationLinks(message);

  return {
    message,
    verificationLink: verificationLinks[0] || null,
  };
}
