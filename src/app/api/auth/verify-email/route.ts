import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Verificatietoken ontbreekt" },
        { status: 400 }
      );
    }

    // Find the verification token
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Ongeldige of verlopen verificatielink" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await db.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json(
        { error: "Verificatielink is verlopen. Vraag een nieuwe aan." },
        { status: 400 }
      );
    }

    // Find the user by email (identifier)
    const user = await db.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      // Clean up the token
      await db.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json({
        message: "E-mailadres is al bevestigd. Je kunt nu inloggen.",
        alreadyVerified: true,
      });
    }

    // Update user's emailVerified field
    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // Delete the used verification token
    await db.verificationToken.delete({
      where: { token },
    });

    return NextResponse.json({
      message: "E-mailadres succesvol bevestigd! Je kunt nu inloggen.",
      success: true,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het verifiëren" },
      { status: 500 }
    );
  }
}
