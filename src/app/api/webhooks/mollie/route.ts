import { NextRequest, NextResponse } from "next/server";
import { getPayment } from "@/lib/mollie";
import { db } from "@/lib/db";
import { sendOrderConfirmation } from "@/lib/email";
import { calculateLoyaltyTier } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const paymentId = body.get("id") as string;

    if (!paymentId) {
      return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
    }

    const payment = await getPayment(paymentId);
    const orderId = payment.metadata?.orderId as string;

    if (!orderId) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    // Get order details
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { loyaltyPoints: true } },
        items: {
          include: {
            product: {
              include: { translations: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Handle successful payment
    if (payment.status === "paid") {
      // Update order status
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          status: "PAID",
          molliePaymentId: paymentId,
        },
      });

      // Award loyalty points if user is logged in
      if (order.userId && order.pointsEarned > 0) {
        const currentPoints = order.user?.loyaltyPoints ?? 0;
        const newPoints = currentPoints + order.pointsEarned;
        const newTier = calculateLoyaltyTier(newPoints);

        // Update user points
        await db.user.update({
          where: { id: order.userId },
          data: {
            loyaltyPoints: newPoints,
            loyaltyTier: newTier,
          },
        });

        // Create EARN transaction
        await db.loyaltyTransaction.create({
          data: {
            id: crypto.randomUUID(),
            userId: order.userId,
            orderId: order.id,
            points: order.pointsEarned,
            type: "EARN",
            description: `Bestelling ${order.orderNumber}`,
          },
        });
      }

      // Send confirmation email
      if (order.customerEmail) {
        await sendOrderConfirmation({
          orderNumber: order.orderNumber,
          customerName: order.customerName || "Klant",
          customerEmail: order.customerEmail,
          pickupTime: order.pickupTime || new Date(),
          total: Number(order.total),
          pointsEarned: order.pointsEarned,
          items: order.items.map((item) => ({
            name: item.product.translations[0]?.name || item.product.slug,
            quantity: item.quantity,
            price: Number(item.unitPrice),
            customizations: item.customizations as Record<string, unknown> | null,
          })),
        });
      }
    }
    // Handle failed/cancelled/expired payment
    else if (payment.status === "failed" || payment.status === "canceled" || payment.status === "expired") {
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "FAILED",
          status: "CANCELLED",
          molliePaymentId: paymentId,
        },
      });

      // Restore redeemed points if any were used
      if (order.userId && order.pointsRedeemed > 0) {
        const currentPoints = order.user?.loyaltyPoints ?? 0;
        const newPoints = currentPoints + order.pointsRedeemed;
        const newTier = calculateLoyaltyTier(newPoints);

        // Restore user points
        await db.user.update({
          where: { id: order.userId },
          data: {
            loyaltyPoints: newPoints,
            loyaltyTier: newTier,
          },
        });

        // Create refund transaction
        await db.loyaltyTransaction.create({
          data: {
            id: crypto.randomUUID(),
            userId: order.userId,
            orderId: order.id,
            points: order.pointsRedeemed,
            type: "ADJUSTMENT",
            description: `Teruggestort: Bestelling ${order.orderNumber} geannuleerd`,
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Mollie webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
