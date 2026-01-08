import * as brevo from "@getbrevo/brevo";

// Initialize Brevo API
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY || ""
);

const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || "noreply@yibeitea.be";
const FROM_NAME = "Yibei Tea";

// Mailtrap SMTP for testing (when configured)
const USE_MAILTRAP = !!process.env.MAILTRAP_SMTP_USER && !!process.env.MAILTRAP_SMTP_PASS;

// Mailtrap SMTP sender using fetch (no nodemailer dependency)
async function sendViaMailtrap(to: string, toName: string | undefined, subject: string, htmlContent: string) {
  const MAILTRAP_HOST = process.env.MAILTRAP_SMTP_HOST || "sandbox.smtp.mailtrap.io";
  const MAILTRAP_PORT = process.env.MAILTRAP_SMTP_PORT || "2525";
  const MAILTRAP_USER = process.env.MAILTRAP_SMTP_USER;
  const MAILTRAP_PASS = process.env.MAILTRAP_SMTP_PASS;
  const MAILTRAP_INBOX_ID = process.env.MAILTRAP_INBOX_ID;

  if (!MAILTRAP_USER || !MAILTRAP_PASS) {
    throw new Error("Mailtrap SMTP credentials not configured");
  }

  // Use Mailtrap's API instead of SMTP for simpler implementation
  const apiUrl = `https://sandbox.api.mailtrap.io/api/send/${MAILTRAP_INBOX_ID}`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Token": process.env.MAILTRAP_API_TOKEN || "",
    },
    body: JSON.stringify({
      from: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: to, name: toName || to }],
      subject,
      html: htmlContent,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Mailtrap API error:", error);
    throw new Error(`Mailtrap send failed: ${response.status}`);
  }

  console.log(`[MAILTRAP] Email sent to ${to}: ${subject}`);
  return response.json();
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  customizations?: Record<string, unknown> | null;
}

interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  pickupTime: Date;
  total: number;
  pointsEarned: number;
  items: OrderItem[];
}

function formatCustomizations(customizations: Record<string, unknown> | null | undefined): string {
  if (!customizations) return "";
  const parts: string[] = [];
  if (customizations.sugarLevel) parts.push(`Suiker: ${customizations.sugarLevel}%`);
  if (customizations.iceLevel) parts.push(`IJs: ${customizations.iceLevel}`);
  if (customizations.toppings && Array.isArray(customizations.toppings) && customizations.toppings.length > 0) {
    parts.push(`Toppings: ${customizations.toppings.map((t: { name?: string }) => t.name || "").join(", ")}`);
  }
  return parts.length > 0 ? ` (${parts.join(", ")})` : "";
}

export async function sendOrderConfirmation(data: OrderConfirmationData) {
  if (!process.env.BREVO_API_KEY) {
    console.warn("BREVO_API_KEY not set, skipping email");
    return;
  }

  const pickupTimeFormatted = new Intl.DateTimeFormat("nl-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data.pickupTime);

  const itemsList = data.items
    .map((item) => `${item.quantity}x ${item.name}${formatCustomizations(item.customizations)} - €${item.price.toFixed(2)}`)
    .join("\n      ");

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = `Bevestiging bestelling ${data.orderNumber} - Yibei Tea`;
  sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
  sendSmtpEmail.to = [{ email: data.customerEmail, name: data.customerName }];
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bevestiging bestelling ${data.orderNumber}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #9B7B5B; margin-bottom: 5px;">Yibei Tea</h1>
        <p style="color: #666; margin: 0;">Jouw bubble tea bestelling</p>
      </div>

      <div style="background: #f8f5f2; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #9B7B5B; margin-top: 0; margin-bottom: 16px;">Bedankt voor je bestelling, ${data.customerName}!</h2>
        <p style="margin: 0;">Je bestelling <strong>#${data.orderNumber}</strong> is bevestigd en wordt nu voorbereid.</p>
      </div>

      <div style="background: #fff; border: 1px solid #e0d9d3; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h3 style="color: #9B7B5B; margin-top: 0; border-bottom: 1px solid #e0d9d3; padding-bottom: 12px;">Afhaalmoment</h3>
        <p style="font-size: 18px; font-weight: 600; color: #333; margin: 0;">
          ${pickupTimeFormatted}
        </p>
        <p style="color: #666; margin: 8px 0 0 0;">
          Sint-Niklaasstraat 36, 9000 Gent
        </p>
      </div>

      <div style="background: #fff; border: 1px solid #e0d9d3; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h3 style="color: #9B7B5B; margin-top: 0; border-bottom: 1px solid #e0d9d3; padding-bottom: 12px;">Je bestelling</h3>
        <div style="white-space: pre-line; color: #333;">
  ${itemsList}
        </div>
        <div style="border-top: 1px solid #e0d9d3; margin-top: 16px; padding-top: 16px;">
          <p style="font-size: 18px; font-weight: 700; color: #9B7B5B; margin: 0; text-align: right;">
            Totaal: €${data.total.toFixed(2)}
          </p>
        </div>
      </div>

      ${data.pointsEarned > 0 ? `
      <div style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <p style="color: #155724; margin: 0; font-weight: 600;">
          Je hebt <strong>+${data.pointsEarned} punten</strong> verdiend!
        </p>
      </div>
      ` : ""}

      <div style="text-align: center; color: #666; font-size: 14px; border-top: 1px solid #e0d9d3; padding-top: 24px;">
        <p>Vragen over je bestelling?</p>
        <p>Neem contact met ons op via <a href="mailto:info@yibeitea.be" style="color: #9B7B5B;">info@yibeitea.be</a></p>
        <p style="margin-top: 20px;">
          <a href="https://yibeitea.be" style="color: #9B7B5B; text-decoration: none;">yibeitea.be</a>
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Order confirmation email sent to ${data.customerEmail}`);
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
    // Don't throw - email failure shouldn't block the order
  }
}

interface OrderReadyData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
}

export async function sendOrderReadyNotification(data: OrderReadyData) {
  if (!process.env.BREVO_API_KEY) {
    console.warn("BREVO_API_KEY not set, skipping email");
    return;
  }

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = `Je bestelling is klaar! - ${data.orderNumber}`;
  sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
  sendSmtpEmail.to = [{ email: data.customerEmail, name: data.customerName }];
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #9B7B5B; margin-bottom: 5px;">Yibei Tea</h1>
      </div>

      <div style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 24px;">
        <h2 style="color: #155724; margin: 0 0 10px 0;">Je bestelling is klaar!</h2>
        <p style="color: #155724; margin: 0; font-size: 18px;">
          Haal je drankjes op bij onze winkel.
        </p>
      </div>

      <div style="text-align: center; padding: 24px;">
        <p style="color: #666; margin-bottom: 8px;">Bestelnummer:</p>
        <p style="font-size: 24px; font-weight: 700; color: #9B7B5B; margin: 0;">
          #${data.orderNumber}
        </p>
      </div>

      <div style="background: #f8f5f2; border-radius: 12px; padding: 20px; text-align: center;">
        <p style="margin: 0; color: #666;">
          <strong>Sint-Niklaasstraat 36, 9000 Gent</strong>
        </p>
      </div>

      <div style="text-align: center; color: #666; font-size: 14px; margin-top: 24px;">
        <p>Tot zo bij Yibei Tea!</p>
      </div>
    </body>
    </html>
  `;

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Order ready notification sent to ${data.customerEmail}`);
  } catch (error) {
    console.error("Failed to send order ready notification:", error);
  }
}

// Email verification
interface VerificationEmailData {
  email: string;
  name: string | null;
  token: string;
}

export async function sendVerificationEmail(data: VerificationEmailData) {
  const verifyUrl = `${process.env.NEXTAUTH_URL || "https://yibeitea.be"}/login/verify-email?token=${data.token}`;
  const subject = "Bevestig je e-mailadres - Yibei Tea";
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bevestig je e-mailadres</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #9B7B5B; margin-bottom: 5px;">Yibei Tea</h1>
        <p style="color: #666; margin: 0;">Welkom bij Yibei Tea!</p>
      </div>

      <div style="background: #f8f5f2; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #9B7B5B; margin-top: 0; margin-bottom: 16px;">
          ${data.name ? `Hallo ${data.name}!` : "Hallo!"}
        </h2>
        <p style="margin: 0;">
          Bedankt voor je registratie! Klik op de onderstaande knop om je e-mailadres te bevestigen en je account te activeren.
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #9B7B5B 0%, #7d634a 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          E-mailadres bevestigen
        </a>
      </div>

      <div style="background: #fff; border: 1px solid #e0d9d3; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; color: #666; font-size: 14px; text-align: center;">
          Of kopieer deze link naar je browser:<br>
          <a href="${verifyUrl}" style="color: #9B7B5B; word-break: break-all;">${verifyUrl}</a>
        </p>
      </div>

      <div style="text-align: center; color: #999; font-size: 12px;">
        <p>Deze link is 24 uur geldig.</p>
        <p>Als je geen account hebt aangemaakt bij Yibei Tea, kun je deze email negeren.</p>
      </div>

      <div style="text-align: center; color: #666; font-size: 14px; border-top: 1px solid #e0d9d3; padding-top: 24px; margin-top: 24px;">
        <p>
          <a href="https://yibeitea.be" style="color: #9B7B5B; text-decoration: none;">yibeitea.be</a>
        </p>
      </div>
    </body>
    </html>
  `;

  // Use Mailtrap if configured (for testing), otherwise use Brevo
  if (USE_MAILTRAP) {
    try {
      await sendViaMailtrap(data.email, data.name || undefined, subject, htmlContent);
      console.log(`[MAILTRAP] Verification email sent to ${data.email}`);
    } catch (error) {
      console.error("Failed to send verification email via Mailtrap:", error);
      throw error;
    }
    return;
  }

  if (!process.env.BREVO_API_KEY) {
    console.warn("BREVO_API_KEY not set, skipping verification email");
    return;
  }

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
  sendSmtpEmail.to = [{ email: data.email, name: data.name || undefined }];
  sendSmtpEmail.htmlContent = htmlContent;

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Verification email sent to ${data.email}`);
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw error;
  }
}

// Newsletter campaign emails
interface NewsletterRecipient {
  email: string;
  name: string | null;
  unsubscribeToken?: string;
}

interface NewsletterCampaignData {
  subject: string;
  content: string;
  recipients: NewsletterRecipient[];
}

export async function sendNewsletterCampaign(data: NewsletterCampaignData): Promise<{
  success: boolean;
  sent: number;
  failed: number;
}> {
  if (!process.env.BREVO_API_KEY) {
    console.warn("BREVO_API_KEY not set, skipping newsletter");
    return { success: false, sent: 0, failed: data.recipients.length };
  }

  let sent = 0;
  let failed = 0;

  // Brevo free tier: 300 emails/day, no strict rate limit per second
  // We batch to avoid overwhelming the API
  const BATCH_SIZE = 50;
  const BATCH_DELAY = 500; // ms between batches

  for (let i = 0; i < data.recipients.length; i += BATCH_SIZE) {
    const batch = data.recipients.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((recipient) => {
        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.subject = data.subject;
        sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
        sendSmtpEmail.to = [{ email: recipient.email, name: recipient.name || undefined }];
        sendSmtpEmail.htmlContent = generateNewsletterHtml(data.content, recipient);
        return apiInstance.sendTransacEmail(sendSmtpEmail);
      })
    );

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        sent++;
      } else {
        failed++;
        console.error("Failed to send newsletter to recipient:", result.reason);
      }
    });

    // Wait between batches (except for last batch)
    if (i + BATCH_SIZE < data.recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
    }
  }

  console.log(`Newsletter campaign sent: ${sent} success, ${failed} failed`);
  return { success: failed === 0, sent, failed };
}

// Newsletter subscription confirmation email (double opt-in)
interface NewsletterConfirmationData {
  email: string;
  name: string | null;
  token: string;
  locale: string;
}

export async function sendNewsletterConfirmationEmail(data: NewsletterConfirmationData) {
  if (!process.env.BREVO_API_KEY) {
    console.warn("BREVO_API_KEY not set, skipping newsletter confirmation email");
    return;
  }

  const confirmUrl = `${process.env.NEXTAUTH_URL || "https://yibeitea.be"}/newsletter/confirm?token=${data.token}`;
  const isNL = data.locale === "nl";

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = isNL
    ? "Bevestig je nieuwsbrief inschrijving - Yibei Tea"
    : "Confirm your newsletter subscription - Yibei Tea";
  sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
  sendSmtpEmail.to = [{ email: data.email, name: data.name || undefined }];
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #9B7B5B; margin-bottom: 5px;">Yibei Tea</h1>
        <p style="color: #666; margin: 0;">${isNL ? "Nieuwsbrief" : "Newsletter"}</p>
      </div>

      <div style="background: #f8f5f2; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #9B7B5B; margin-top: 0; margin-bottom: 16px;">
          ${data.name ? (isNL ? `Hallo ${data.name}!` : `Hello ${data.name}!`) : (isNL ? "Hallo!" : "Hello!")}
        </h2>
        <p style="margin: 0;">
          ${isNL
            ? "Bedankt voor je interesse in onze nieuwsbrief! Klik op de onderstaande knop om je inschrijving te bevestigen."
            : "Thank you for your interest in our newsletter! Click the button below to confirm your subscription."}
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #9B7B5B 0%, #7d634a 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          ${isNL ? "Inschrijving bevestigen" : "Confirm subscription"}
        </a>
      </div>

      <div style="background: #fff; border: 1px solid #e0d9d3; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; color: #666; font-size: 14px; text-align: center;">
          ${isNL ? "Of kopieer deze link naar je browser:" : "Or copy this link to your browser:"}<br>
          <a href="${confirmUrl}" style="color: #9B7B5B; word-break: break-all;">${confirmUrl}</a>
        </p>
      </div>

      <div style="text-align: center; color: #999; font-size: 12px;">
        <p>${isNL
          ? "Als je je niet hebt ingeschreven voor onze nieuwsbrief, kun je deze email negeren."
          : "If you didn't subscribe to our newsletter, you can ignore this email."}</p>
      </div>

      <div style="text-align: center; color: #666; font-size: 14px; border-top: 1px solid #e0d9d3; padding-top: 24px; margin-top: 24px;">
        <p>
          <a href="https://yibeitea.be" style="color: #9B7B5B; text-decoration: none;">yibeitea.be</a>
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Newsletter confirmation email sent to ${data.email}`);
  } catch (error) {
    console.error("Failed to send newsletter confirmation email:", error);
    throw error;
  }
}

function generateNewsletterHtml(content: string, recipient: NewsletterRecipient): string {
  const unsubscribeUrl = recipient.unsubscribeToken
    ? `https://yibeitea.be/unsubscribe?token=${recipient.unsubscribeToken}`
    : "https://yibeitea.be/account/settings";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f5f2;">
      <div style="background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #9B7B5B 0%, #7d634a 100%); padding: 30px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 28px;">Yibei Tea</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Nieuwsbrief</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          ${recipient.name ? `<p style="color: #666; margin-top: 0;">Hallo ${recipient.name},</p>` : ""}
          <div style="color: #333;">
            ${content}
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8f5f2; padding: 20px 30px; text-align: center; border-top: 1px solid #e0d9d3;">
          <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
            <a href="https://yibeitea.be" style="color: #9B7B5B; text-decoration: none;">yibeitea.be</a>
            &nbsp;|&nbsp;
            Sint-Niklaasstraat 36, 9000 Gent
          </p>
          <p style="margin: 0; color: #999; font-size: 12px;">
            <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Uitschrijven</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
