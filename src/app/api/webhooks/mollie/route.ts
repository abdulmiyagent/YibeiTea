import { NextRequest, NextResponse } from "next/server";
import { getPayment } from "@/lib/mollie";
import { db } from "@/lib/db";

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

    // Update order based on payment status
    if (payment.status === "paid") {
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          status: "PAID",
          molliePaymentId: paymentId,
        },
      });

      // Award loyalty points
      const order = await db.order.findUnique({
        where: { id: orderId },
        select: { userId: true, pointsEarned: true },
      });

      if (order?.userId && order.pointsEarned > 0) {
        await db.user.update({
          where: { id: order.userId },
          data: {
            loyaltyPoints: { increment: order.pointsEarned },
          },
        });

        await db.loyaltyTransaction.create({
          data: {
            userId: order.userId,
            orderId,
            points: order.pointsEarned,
            type: "EARN",
            description: `Bestelling ${orderId}`,
          },
        });
      }
    } else if (payment.status === "failed" || payment.status === "canceled") {
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "FAILED",
          status: "CANCELLED",
          molliePaymentId: paymentId,
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Mollie webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
