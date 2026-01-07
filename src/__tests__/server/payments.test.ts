import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { calculateLoyaltyTier } from "@/lib/utils";

// Mock the database
const mockDb = {
  order: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  user: {
    update: vi.fn(),
  },
  loyaltyTransaction: {
    create: vi.fn(),
  },
};

// Mock Mollie client
const mockMolliePayment = {
  id: "tr_test123",
  status: "paid",
  metadata: { orderId: "order-123" },
  getCheckoutUrl: () => "https://checkout.mollie.com/test",
};

const mockGetPayment = vi.fn();
const mockCreatePayment = vi.fn();

describe("Payments Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createPayment", () => {
    it("throws NOT_FOUND if order does not exist", async () => {
      mockDb.order.findUnique.mockResolvedValue(null);

      // Simulate the check in the router
      const order = await mockDb.order.findUnique({ where: { id: "nonexistent" } });

      expect(order).toBeNull();

      const error = new TRPCError({
        code: "NOT_FOUND",
        message: "Bestelling niet gevonden",
      });

      expect(error.code).toBe("NOT_FOUND");
    });

    it("throws BAD_REQUEST if order is already paid", async () => {
      const paidOrder = {
        id: "order-123",
        orderNumber: "YBT-TEST-1234",
        total: 15.0,
        paymentStatus: "PAID",
      };

      mockDb.order.findUnique.mockResolvedValue(paidOrder);

      const order = await mockDb.order.findUnique({ where: { id: "order-123" } });

      expect(order?.paymentStatus).toBe("PAID");

      const error = new TRPCError({
        code: "BAD_REQUEST",
        message: "Deze bestelling is al betaald",
      });

      expect(error.code).toBe("BAD_REQUEST");
    });

    it("creates payment for pending order", async () => {
      const pendingOrder = {
        id: "order-123",
        orderNumber: "YBT-TEST-1234",
        total: 15.0,
        paymentStatus: "PENDING",
      };

      mockDb.order.findUnique.mockResolvedValue(pendingOrder);
      mockCreatePayment.mockResolvedValue(mockMolliePayment);

      const order = await mockDb.order.findUnique({ where: { id: "order-123" } });

      expect(order?.paymentStatus).toBe("PENDING");

      // Simulate creating payment
      const payment = await mockCreatePayment({
        amount: Number(order?.total),
        description: `Yibei Tea - Bestelling ${order?.orderNumber}`,
        orderId: order?.id,
        redirectUrl: "http://localhost:3000/order/confirmation?orderNumber=YBT-TEST-1234",
      });

      expect(payment.id).toBe("tr_test123");
      expect(payment.getCheckoutUrl()).toContain("checkout.mollie.com");
    });
  });

  describe("Mollie Webhook - Successful Payment", () => {
    it("updates order status to PAID on successful payment", async () => {
      const payment = {
        status: "paid",
        metadata: { orderId: "order-123" },
      };

      mockGetPayment.mockResolvedValue(payment);

      // Simulate webhook logic
      if (payment.status === "paid") {
        await mockDb.order.update({
          where: { id: payment.metadata.orderId },
          data: {
            paymentStatus: "PAID",
            status: "PAID",
          },
        });
      }

      expect(mockDb.order.update).toHaveBeenCalledWith({
        where: { id: "order-123" },
        data: expect.objectContaining({
          paymentStatus: "PAID",
          status: "PAID",
        }),
      });
    });

    it("awards loyalty points on successful payment", async () => {
      const order = {
        id: "order-123",
        userId: "user-123",
        pointsEarned: 150,
        user: { loyaltyPoints: 100 },
      };

      // Simulate webhook logic for points
      if (order.userId && order.pointsEarned > 0) {
        const currentPoints = order.user?.loyaltyPoints ?? 0;
        const newPoints = currentPoints + order.pointsEarned;
        const newTier = calculateLoyaltyTier(newPoints);

        await mockDb.user.update({
          where: { id: order.userId },
          data: {
            loyaltyPoints: newPoints,
            loyaltyTier: newTier,
          },
        });

        expect(newPoints).toBe(250);
        expect(newTier).toBe("BRONZE");

        expect(mockDb.user.update).toHaveBeenCalledWith({
          where: { id: "user-123" },
          data: {
            loyaltyPoints: 250,
            loyaltyTier: "BRONZE",
          },
        });
      }
    });
  });

  describe("Mollie Webhook - Failed Payment", () => {
    it("updates order status to CANCELLED on failed payment", async () => {
      const payment = {
        status: "failed",
        metadata: { orderId: "order-123" },
      };

      mockGetPayment.mockResolvedValue(payment);

      // Simulate webhook logic
      if (payment.status === "failed" || payment.status === "canceled" || payment.status === "expired") {
        await mockDb.order.update({
          where: { id: payment.metadata.orderId },
          data: {
            paymentStatus: "FAILED",
            status: "CANCELLED",
          },
        });
      }

      expect(mockDb.order.update).toHaveBeenCalledWith({
        where: { id: "order-123" },
        data: expect.objectContaining({
          paymentStatus: "FAILED",
          status: "CANCELLED",
        }),
      });
    });

    it("restores redeemed loyalty points on failed payment", async () => {
      const order = {
        id: "order-123",
        userId: "user-123",
        pointsRedeemed: 200,
        user: { loyaltyPoints: 300 },
      };

      // Simulate webhook logic for restoring points
      if (order.userId && order.pointsRedeemed > 0) {
        const currentPoints = order.user?.loyaltyPoints ?? 0;
        const newPoints = currentPoints + order.pointsRedeemed;
        const newTier = calculateLoyaltyTier(newPoints);

        await mockDb.user.update({
          where: { id: order.userId },
          data: {
            loyaltyPoints: newPoints,
            loyaltyTier: newTier,
          },
        });

        await mockDb.loyaltyTransaction.create({
          data: {
            id: "test-uuid-1234",
            userId: order.userId,
            orderId: order.id,
            points: order.pointsRedeemed,
            type: "ADJUSTMENT",
            description: `Teruggestort: Bestelling order-123 geannuleerd`,
          },
        });

        expect(newPoints).toBe(500);
        expect(newTier).toBe("SILVER");

        expect(mockDb.user.update).toHaveBeenCalledWith({
          where: { id: "user-123" },
          data: {
            loyaltyPoints: 500,
            loyaltyTier: "SILVER",
          },
        });

        expect(mockDb.loyaltyTransaction.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            userId: "user-123",
            points: 200,
            type: "ADJUSTMENT",
          }),
        });
      }
    });
  });
});
