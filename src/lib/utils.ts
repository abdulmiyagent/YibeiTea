import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string, locale: string = "nl-BE") {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(numPrice);
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `YBT-${timestamp}-${random}`;
}

export function calculateLoyaltyTier(points: number): "BRONZE" | "SILVER" | "GOLD" {
  if (points >= 1000) return "GOLD";
  if (points >= 500) return "SILVER";
  return "BRONZE";
}

export function formatDate(date: Date, locale: string = "nl-BE"): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
