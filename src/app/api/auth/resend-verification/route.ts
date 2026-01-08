import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp, rateLimiters } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    // Rate limiting - use the register limiter to prevent abuse
    const clientIp = getClientIp(request);
    const rateLimit = await checkRateLimit(`resend-verify:${clientIp}`, rateLimiters.register);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Te veel verzoeken. Probeer opnieuw over ${Math.ceil(rateLimit.resetIn / 60)} minuten.` },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimit.resetIn.toString(),
          },
        }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "E-mailadres is verplicht" },
        { status: 400 }
      );
    }

    // Find the user with their OAuth accounts (if any)
    const user = await db.user.findUnique({
      where: { email },
      include: {
        accounts: true, // Get all accounts to check for OAuth providers
      },
    });

    // Don't reveal if user exists or not
    if (!user) {
      return NextResponse.json({
        message: "Als er een account bestaat met dit e-mailadres, ontvang je een verificatie-email.",
      });
    }

    // Skip OAuth users (Google users are auto-verified, they have OAuth account records)
    // Credential users don't have Account records in NextAuth
    const hasOAuthAccount = user.accounts.length > 0;
    if (hasOAuthAccount) {
      return NextResponse.json({
        message: "Dit account gebruikt Google login. Je kunt direct inloggen.",
        alreadyVerified: true,
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        message: "Je e-mailadres is al bevestigd. Je kunt inloggen.",
        alreadyVerified: true,
      });
    }

    // Delete any existing verification tokens for this user
    await db.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Generate new verification token
    const verificationToken = crypto.randomUUID();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new verification token
    await db.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: tokenExpiry,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail({
        email,
        name: user.name,
        token: verificationToken,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return NextResponse.json(
        { error: "Kon verificatie-email niet verzenden. Probeer het later opnieuw." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Verificatie-email verzonden! Controleer je inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
