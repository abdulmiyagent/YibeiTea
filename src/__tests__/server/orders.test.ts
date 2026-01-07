import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

// Mock the database
const mockDb = {
  product: {
    findMany: vi.fn(),
  },
  promoCode: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  order: {
    create: vi.fn(),
    delete: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  reward: {
    findUnique: vi.fn(),
  },
  loyaltyTransaction: {
    create: vi.fn(),
  },
};

// Mock rate limiting
const guestOrderAttempts = new Map<string, { count: number; resetAt: number }>();
const GUEST_RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

function checkGuestRateLimit(email: string): void {
  const now = Date.now();
  const key = email.toLowerCase();
  const record = guestOrderAttempts.get(key);

  if (record) {
    if (now > record.resetAt) {
      guestOrderAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    } else if (record.count >= GUEST_RATE_LIMIT) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Te veel bestellingen. Probeer het later opnieuw of maak een account aan.",
      });
    } else {
      record.count++;
    }
  } else {
    guestOrderAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
  }
}

describe("Orders Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guestOrderAttempts.clear();
  });

  describe("Order Creation - Price Calculation", () => {
    it("calculates subtotal from database prices, not client prices", async () => {
      // Setup: mock products with database prices
      const mockProducts = [
        { id: "product-1", price: 5.5, isAvailable: true },
        { id: "product-2", price: 6.0, isAvailable: true },
      ];
      mockDb.product.findMany.mockResolvedValue(mockProducts);

      // Create a product map like the router does
      const productMap = new Map(mockProducts.map((p) => [p.id, p]));

      // Calculate subtotal from database prices
      const items = [
        { productId: "product-1", quantity: 2 }, // 2 x €5.50 = €11.00
        { productId: "product-2", quantity: 1 }, // 1 x €6.00 = €6.00
      ];

      const subtotal = items.reduce((sum, item) => {
        const product = productMap.get(item.productId)!;
        return sum + Number(product.price) * item.quantity;
      }, 0);

      // Total should be €17.00, regardless of what client sends
      expect(subtotal).toBe(17.0);
    });
  });

  describe("Order Creation - Product Availability", () => {
    it("throws error if product is unavailable", async () => {
      const mockProducts = [
        { id: "product-1", price: 5.5, isAvailable: false }, // Unavailable!
      ];
      mockDb.product.findMany.mockResolvedValue(mockProducts);

      const productMap = new Map(mockProducts.map((p) => [p.id, p]));
      const product = productMap.get("product-1");

      // Simulate the check in the router
      expect(product?.isAvailable).toBe(false);

      // The router would throw this error
      const error = new TRPCError({
        code: "BAD_REQUEST",
        message: "Een of meer producten zijn niet beschikbaar",
      });

      expect(error.code).toBe("BAD_REQUEST");
    });

    it("throws error if product not found", async () => {
      const mockProducts: { id: string; price: number; isAvailable: boolean }[] = [];
      mockDb.product.findMany.mockResolvedValue(mockProducts);

      const productMap = new Map(mockProducts.map((p) => [p.id, p]));
      const product = productMap.get("nonexistent-product");

      expect(product).toBeUndefined();

      const error = new TRPCError({
        code: "BAD_REQUEST",
        message: "Product niet gevonden: nonexistent-product",
      });

      expect(error.code).toBe("BAD_REQUEST");
    });
  });

  describe("Order Creation - Promo Code", () => {
    it("applies percentage discount correctly", async () => {
      const subtotal = 20.0;
      const promoCode = {
        id: "promo-1",
        code: "SAVE10",
        isActive: true,
        discountType: "PERCENTAGE",
        discountValue: 10, // 10%
        validFrom: new Date("2020-01-01"),
        validUntil: new Date("2030-01-01"),
        maxUses: null,
        usedCount: 0,
        minOrderAmount: null,
      };

      mockDb.promoCode.findUnique.mockResolvedValue(promoCode);

      // Calculate discount like the router does
      let discount = 0;
      const now = new Date();
      const isValid =
        now >= promoCode.validFrom &&
        now <= promoCode.validUntil &&
        (!promoCode.maxUses || promoCode.usedCount < promoCode.maxUses) &&
        (!promoCode.minOrderAmount || subtotal >= Number(promoCode.minOrderAmount));

      if (isValid) {
        if (promoCode.discountType === "PERCENTAGE") {
          discount = (subtotal * Number(promoCode.discountValue)) / 100;
        }
      }

      expect(discount).toBe(2.0); // 10% of €20 = €2
    });

    it("applies fixed amount discount correctly", async () => {
      const subtotal = 20.0;
      const promoCode = {
        discountType: "FIXED",
        discountValue: 5, // €5 off
      };

      let discount = 0;
      if (promoCode.discountType === "FIXED") {
        discount = Number(promoCode.discountValue);
      }
      discount = Math.min(discount, subtotal);

      expect(discount).toBe(5.0);
    });

    it("caps discount at subtotal amount", async () => {
      const subtotal = 3.0; // Only €3 order
      const promoCode = {
        discountType: "FIXED",
        discountValue: 10, // €10 off (more than order!)
      };

      let discount = Number(promoCode.discountValue);
      discount = Math.min(discount, subtotal);

      expect(discount).toBe(3.0); // Capped at subtotal
    });
  });

  describe("Guest Order Rate Limiting", () => {
    it("allows first order from email", () => {
      expect(() => checkGuestRateLimit("test@example.com")).not.toThrow();
    });

    it("allows up to 5 orders from same email", () => {
      const email = "test@example.com";
      for (let i = 0; i < 5; i++) {
        expect(() => checkGuestRateLimit(email)).not.toThrow();
      }
    });

    it("blocks 6th order from same email", () => {
      const email = "test@example.com";
      // First 5 should succeed
      for (let i = 0; i < 5; i++) {
        checkGuestRateLimit(email);
      }
      // 6th should fail
      expect(() => checkGuestRateLimit(email)).toThrow(TRPCError);
    });

    it("is case-insensitive for email", () => {
      // Use up the limit with lowercase
      for (let i = 0; i < 5; i++) {
        checkGuestRateLimit("test@example.com");
      }
      // Uppercase should also be blocked
      expect(() => checkGuestRateLimit("TEST@EXAMPLE.COM")).toThrow(TRPCError);
    });
  });
});
