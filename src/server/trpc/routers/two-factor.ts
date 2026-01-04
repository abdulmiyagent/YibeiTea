import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/lib/db";
import {
  generateTwoFactorSecret,
  generateTwoFactorUri,
  generateQRCode,
  verifyTwoFactorToken,
} from "@/lib/two-factor";

export const twoFactorRouter = router({
  // Get current 2FA status for the logged-in user
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        role: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    const isAdminUser = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    const isRequired = isAdminUser; // 2FA is required for all admin users
    const isEnabled = user.twoFactorEnabled;
    const hasSecret = !!user.twoFactorSecret;

    return {
      isRequired,
      isEnabled,
      isSetup: hasSecret && isEnabled,
      needsSetup: isRequired && !isEnabled,
    };
  }),

  // Initialize 2FA setup - generates secret and QR code
  initSetup: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        email: true,
        role: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    // Only allow admins to set up 2FA
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only administrators can enable two-factor authentication",
      });
    }

    // Generate new secret
    const secret = generateTwoFactorSecret();
    const otpauthUrl = generateTwoFactorUri(user.email, secret);
    const qrCode = await generateQRCode(otpauthUrl);

    // Store the secret temporarily (not enabled yet)
    await db.user.update({
      where: { id: ctx.session.user.id },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: false,
      },
    });

    return {
      secret,
      qrCode,
      otpauthUrl,
    };
  }),

  // Verify and enable 2FA
  enable: protectedProcedure
    .input(z.object({ token: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          twoFactorSecret: true,
          twoFactorEnabled: true,
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (!user.twoFactorSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Two-factor authentication has not been initialized",
        });
      }

      if (user.twoFactorEnabled) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Two-factor authentication is already enabled",
        });
      }

      // Verify the token
      const isValid = verifyTwoFactorToken(input.token, user.twoFactorSecret);

      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid verification code. Please try again.",
        });
      }

      // Enable 2FA
      await db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          twoFactorEnabled: true,
          twoFactorVerified: new Date(),
        },
      });

      return { success: true };
    }),

  // Disable 2FA (requires current token)
  disable: protectedProcedure
    .input(z.object({ token: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          role: true,
          twoFactorSecret: true,
          twoFactorEnabled: true,
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Admin users cannot disable 2FA (required for all admins)
      if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Administrators cannot disable two-factor authentication",
        });
      }

      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Two-factor authentication is not enabled",
        });
      }

      // Verify the token before disabling
      const isValid = verifyTwoFactorToken(input.token, user.twoFactorSecret);

      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid verification code",
        });
      }

      // Disable 2FA
      await db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          twoFactorSecret: null,
          twoFactorEnabled: false,
          twoFactorVerified: null,
        },
      });

      return { success: true };
    }),

  // Verify 2FA token during login (called after password verification)
  verify: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        token: z.string().length(6),
      })
    )
    .mutation(async ({ input }) => {
      const user = await db.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          twoFactorSecret: true,
          twoFactorEnabled: true,
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Two-factor authentication is not enabled for this user",
        });
      }

      const isValid = verifyTwoFactorToken(input.token, user.twoFactorSecret);

      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid verification code",
        });
      }

      // Update last verified timestamp
      await db.user.update({
        where: { id: user.id },
        data: { twoFactorVerified: new Date() },
      });

      return { success: true, userId: user.id };
    }),

  // Check if a user requires 2FA (for login flow)
  checkRequired: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const user = await db.user.findUnique({
        where: { email: input.email },
        select: {
          id: true,
          role: true,
          twoFactorEnabled: true,
        },
      });

      if (!user) {
        // Don't reveal if user exists
        return { required: false, userId: null };
      }

      const isAdminUser = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
      const required = isAdminUser || user.twoFactorEnabled;

      return {
        required,
        userId: required ? user.id : null,
        needsSetup: isAdminUser && !user.twoFactorEnabled,
      };
    }),
});
