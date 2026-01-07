import { describe, it, expect } from "vitest";
import {
  generateOrderNumber,
  calculateLoyaltyTier,
  formatPrice,
  formatDate,
} from "@/lib/utils";

describe("generateOrderNumber", () => {
  it("returns a string starting with YBT-", () => {
    const orderNumber = generateOrderNumber();
    expect(orderNumber).toMatch(/^YBT-/);
  });

  it("returns a string with valid format (YBT-TIMESTAMP-RANDOM)", () => {
    const orderNumber = generateOrderNumber();
    // Format: YBT-{base36 timestamp}-{4 char random}
    expect(orderNumber).toMatch(/^YBT-[A-Z0-9]+-[A-Z0-9]{4}$/);
  });

  it("generates unique order numbers", () => {
    const orderNumbers = new Set();
    for (let i = 0; i < 100; i++) {
      orderNumbers.add(generateOrderNumber());
    }
    // Should have 100 unique order numbers
    expect(orderNumbers.size).toBe(100);
  });
});

describe("calculateLoyaltyTier", () => {
  it("returns BRONZE for points below 500", () => {
    expect(calculateLoyaltyTier(0)).toBe("BRONZE");
    expect(calculateLoyaltyTier(100)).toBe("BRONZE");
    expect(calculateLoyaltyTier(499)).toBe("BRONZE");
  });

  it("returns SILVER for points between 500 and 999", () => {
    expect(calculateLoyaltyTier(500)).toBe("SILVER");
    expect(calculateLoyaltyTier(750)).toBe("SILVER");
    expect(calculateLoyaltyTier(999)).toBe("SILVER");
  });

  it("returns GOLD for points 1000 and above", () => {
    expect(calculateLoyaltyTier(1000)).toBe("GOLD");
    expect(calculateLoyaltyTier(1500)).toBe("GOLD");
    expect(calculateLoyaltyTier(10000)).toBe("GOLD");
  });
});

describe("formatPrice", () => {
  it("formats price correctly in EUR for nl-BE locale", () => {
    const formatted = formatPrice(5.5, "nl-BE");
    // Belgian format: € 5,50 or variations
    expect(formatted).toContain("5,50");
    expect(formatted).toContain("€");
  });

  it("handles string input", () => {
    const formatted = formatPrice("10.00", "nl-BE");
    expect(formatted).toContain("10,00");
    expect(formatted).toContain("€");
  });

  it("handles zero", () => {
    const formatted = formatPrice(0, "nl-BE");
    expect(formatted).toContain("0,00");
  });

  it("handles decimal precision", () => {
    const formatted = formatPrice(5.999, "nl-BE");
    // Should round to 2 decimal places
    expect(formatted).toContain("6,00");
  });
});

describe("formatDate", () => {
  it("formats date correctly for nl-BE locale", () => {
    const date = new Date("2026-01-15T14:30:00");
    const formatted = formatDate(date, "nl-BE");
    // Should contain day, month, year and time
    expect(formatted).toContain("15");
    expect(formatted).toContain("2026");
  });
});
