"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Settings,
  Heart,
  Package,
} from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { cn } from "@/lib/utils";

export function Header() {
  const t = useTranslations("nav");
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Subscribe to items directly for reactivity
  const cartItemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0)
  );

  // Prevent hydration mismatch: cart count from localStorage differs server vs client
  useEffect(() => {
    setMounted(true);
  }, []);

  const displayCartCount = mounted ? cartItemCount : 0;

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/menu", label: t("menu") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img
              src="/images/logo.png"
              alt="Yibei Tea"
              className="h-14 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center md:space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-tea-600",
                  isActive(link.href)
                    ? "text-tea-600"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setCartDrawerOpen(true)}
            >
              <ShoppingBag className="h-5 w-5" />
              {displayCartCount > 0 && (
                <Badge
                  variant="tea"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {displayCartCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            {session ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <User className="h-5 w-5" />
                  <span className="hidden md:inline">
                    {session.user?.name?.split(" ")[0]}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border bg-background py-1 shadow-lg">
                      <Link
                        href="/account"
                        className="flex items-center px-4 py-2 text-sm hover:bg-muted"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="mr-2 h-4 w-4" />
                        {t("account")}
                      </Link>
                      <Link
                        href="/account/orders"
                        className="flex items-center px-4 py-2 text-sm hover:bg-muted"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Package className="mr-2 h-4 w-4" />
                        {t("orders")}
                      </Link>
                      <Link
                        href="/account/favorites"
                        className="flex items-center px-4 py-2 text-sm hover:bg-muted"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Heart className="mr-2 h-4 w-4" />
                        {t("favorites")}
                      </Link>
                      {session.user?.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          className="flex items-center px-4 py-2 text-sm hover:bg-muted"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          {t("admin")}
                        </Link>
                      )}
                      <hr className="my-1" />
                      <button
                        className="flex w-full items-center px-4 py-2 text-sm text-destructive hover:bg-muted"
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut();
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {t("logout")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/login">
                <Button variant="tea" size="sm">
                  {t("login")}
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="border-t py-4 md:hidden">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-2 py-1 text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "text-tea-600"
                      : "text-muted-foreground"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
      />
    </header>
  );
}
