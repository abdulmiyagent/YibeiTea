import { authenticator } from "otplib";
import QRCode from "qrcode";

// Configure authenticator options
authenticator.options = {
  window: 1, // Allow 1 step tolerance (30 seconds before/after)
};

const APP_NAME = "Yibei Tea Admin";

/**
 * Generate a new TOTP secret for a user
 */
export function generateTwoFactorSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate the otpauth URL for QR code
 */
export function generateTwoFactorUri(email: string, secret: string): string {
  return authenticator.keyuri(email, APP_NAME, secret);
}

/**
 * Generate QR code as data URL
 */
export async function generateQRCode(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, {
    width: 256,
    margin: 2,
    color: {
      dark: "#1a1a1a",
      light: "#ffffff",
    },
  });
}

/**
 * Verify a TOTP token against a secret
 */
export function verifyTwoFactorToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

/**
 * Check if a user requires 2FA
 * All admin users (ADMIN and SUPER_ADMIN) must have 2FA enabled
 */
export function requiresTwoFactor(role: string, twoFactorEnabled: boolean): boolean {
  // All admin users must use 2FA
  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    return true;
  }
  // Regular users don't need 2FA
  return twoFactorEnabled;
}

/**
 * Check if user has completed 2FA setup
 */
export function hasTwoFactorSetup(twoFactorSecret: string | null, twoFactorEnabled: boolean): boolean {
  return !!twoFactorSecret && twoFactorEnabled;
}
