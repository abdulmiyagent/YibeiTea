import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { checkRateLimit, getClientIp, rateLimiters } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`register:${clientIp}`, rateLimiters.register);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Te veel registratiepogingen. Probeer opnieuw over ${Math.ceil(rateLimit.resetIn / 60)} minuten.` },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimit.resetIn.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          },
        }
      );
    }

    const { name, email, password, newsletterOptIn } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email en wachtwoord zijn verplicht" },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Wachtwoord moet minimaal 8 tekens bevatten" },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: "Wachtwoord moet minimaal één hoofdletter bevatten" },
        { status: 400 }
      );
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Wachtwoord moet minimaal één cijfer bevatten" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Er bestaat al een account met dit emailadres" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with Account for credentials
    const userId = crypto.randomUUID();
    const user = await db.user.create({
      data: {
        id: userId,
        name,
        email,
        newsletterOptIn: newsletterOptIn ?? false,
        updatedAt: new Date(),
        accounts: {
          create: {
            id: crypto.randomUUID(),
            type: "credentials",
            provider: "credentials",
            providerAccountId: email,
            access_token: hashedPassword, // Store hashed password here
          },
        },
      },
    });

    return NextResponse.json({
      message: "Account succesvol aangemaakt",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het registreren" },
      { status: 500 }
    );
  }
}
