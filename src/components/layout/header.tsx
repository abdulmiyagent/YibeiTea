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
  LogOut,
  Settings,
  Heart,
  Package,
  Instagram,
} from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { StoreStatusBadge, MobileStoreStatusBadge, CompactStoreStatusBadge } from "./store-status-badge";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc";

// Social icon component (matches footer icons)
const SocialIcon = ({ platform }: { platform: string }) => {
  const iconClass = "h-4 w-4";
  switch (platform) {
    case "instagram":
      return <Instagram className={iconClass} />;
    case "tiktok":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
        </svg>
      );
    case "facebook":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "x":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "youtube":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      );
    case "email":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
          <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
        </svg>
      );
  }
};

export function Header() {
  const t = useTranslations("nav");
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [socialMenuOpen, setSocialMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fetch social links (ordered by admin priority)
  const { data: settings } = api.storeSettings.get.useQuery();
  const socialLinks = (settings?.socialLinks as Array<{
    platform: string;
    href: string;
    isActive: boolean;
  }>) || [];
  const activeLinks = socialLinks.filter((link) => link.isActive && link.href);
  const primarySocial = activeLinks[0]; // First = highest priority
  const desktopLinks = activeLinks.slice(0, 4); // Show first 4 on desktop

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
        <div className="flex h-14 md:h-16 items-center justify-between">
          {/* Logo + Mobile Store Status */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center">
              <img
                src="/images/logo.png"
                alt="Yibei Tea"
                className="h-10 md:h-14 w-auto"
              />
            </Link>
            <CompactStoreStatusBadge />
          </div>

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
          <div className="flex items-center space-x-0 md:space-x-2">
            <StoreStatusBadge />

            {/* User Menu - Always show icon (SECOND on mobile) */}
            <div className="relative">
              {session ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8 md:h-10 md:w-10"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="h-6 w-6 md:h-8 md:w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full bg-tea-600 text-[10px] md:text-xs font-medium text-white">
                        {session.user?.name
                          ? session.user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                          : <User className="h-3 w-3 md:h-4 md:w-4" />
                        }
                      </div>
                    )}
                  </Button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border bg-background py-1 shadow-lg">
                        <div className="px-4 py-2 border-b">
                          <p className="text-sm font-medium truncate">{session.user?.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                        </div>
                        {session.user?.role === "ADMIN" || session.user?.role === "SUPER_ADMIN" ? (
                          <Link
                            href="/admin"
                            className="flex items-center px-4 py-2 text-sm hover:bg-muted"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Dashboard
                          </Link>
                        ) : (
                          <>
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
                          </>
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
                </>
              ) : (
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground hover:text-foreground"
                  >
                    <User className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </Link>
              )}
            </div>

            {/* Quick Menu link - mobile only (FIRST) */}
            <Link href="/menu" className="order-first md:order-none md:hidden">
              <Button
                variant="ghost"
                size="sm"
                className="text-tea-600 font-medium px-1.5 h-8 text-xs"
              >
                {t("menu")}
              </Button>
            </Link>

            {/* Cart (THIRD on mobile) */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 md:h-10 md:w-10"
              onClick={() => setCartDrawerOpen(true)}
            >
              <ShoppingBag className="h-4 w-4 md:h-5 md:w-5" />
              {displayCartCount > 0 && (
                <Badge
                  variant="tea"
                  className="absolute -right-0.5 -top-0.5 md:-right-1 md:-top-1 h-4 w-4 md:h-5 md:w-5 rounded-full p-0 text-[10px] md:text-xs"
                >
                  {displayCartCount}
                </Badge>
              )}
            </Button>

            {/* Language Switcher (FOURTH on mobile) */}
            <LanguageSwitcher />

            {/* Social Links - Desktop: first 4 inline, Mobile: dropdown */}
            {activeLinks.length > 0 && (
              <>
                {/* Desktop: Show first 4 icons inline */}
                <div className="hidden md:flex items-center space-x-1">
                  {desktopLinks.map((link, index) => (
                    <a
                      key={`${link.platform}-${index}`}
                      href={link.href}
                      target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                      rel={link.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-tea-600 hover:bg-muted/50"
                      aria-label={link.platform}
                    >
                      <SocialIcon platform={link.platform} />
                    </a>
                  ))}
                </div>

                {/* Mobile: Primary social with dropdown */}
                {primarySocial && (
                  <div className="relative md:hidden">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-tea-600"
                      onClick={() => setSocialMenuOpen(!socialMenuOpen)}
                    >
                      <SocialIcon platform={primarySocial.platform} />
                    </Button>

                    {socialMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setSocialMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-md border bg-background py-1 shadow-lg">
                          {activeLinks.map((link, index) => (
                            <a
                              key={`mobile-${link.platform}-${index}`}
                              href={link.href}
                              target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                              rel={link.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-tea-600"
                              onClick={() => setSocialMenuOpen(false)}
                            >
                              <SocialIcon platform={link.platform} />
                              <span className="capitalize">{link.platform}</span>
                            </a>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Mobile menu button (LAST) */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="border-t py-4 md:hidden">
            <div className="flex flex-col space-y-3">
              {/* Mobile Store Status */}
              <MobileStoreStatusBadge />
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
