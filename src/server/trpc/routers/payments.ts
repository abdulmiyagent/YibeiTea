import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { createPayment } from "@/lib/mollie";
import { TRPCError } from "@trpc/server";

export const paymentsRouter = router({
  // Create a payment for an order
  createPayment: publicProcedure
    .input(z.object({
      orderId: z.string(),
      orderNumber: z.string(),
      amount: z.number().positive(),
      paymentMethod: z.enum(["bancontact", "ideal", "creditcard", "paypal"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify the order exists and is pending
      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          paymentStatus: true,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bestelling niet gevonden",
        });
      }

      if (order.paymentStatus === "PAID") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Deze bestelling is al betaald",
        });
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const redirectUrl = `${baseUrl}/order/confirmation?orderNumber=${order.orderNumber}`;

      try {
        const payment = await createPayment({
          amount: input.amount,
          description: `Yibei Tea - Bestelling ${order.orderNumber}`,
          orderId: order.id,
          redirectUrl,
        });

        // Update order with Mollie payment ID
        await ctx.db.order.update({
          where: { id: order.id },
          data: { molliePaymentId: payment.id },
        });

        // Return checkout URL for redirect
        return {
          checkoutUrl: payment.getCheckoutUrl(),
          paymentId: payment.id,
        };
      } catch (error) {
        console.error("Mollie payment creation error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Er is een fout opgetreden bij het aanmaken van de betaling",
        });
      }
    }),

  // Check payment status (for polling on confirmation page)
  getPaymentStatus: publicProcedure
    .input(z.object({ orderNumber: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { orderNumber: input.orderNumber },
        select: {
          paymentStatus: true,
          status: true,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bestelling niet gevonden",
        });
      }

      return {
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
      };
    }),
});
