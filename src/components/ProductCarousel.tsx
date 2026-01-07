"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";

// Background colors for cards (inspired by the screenshot)
const cardColors = [
  "bg-gradient-to-b from-[#2C3E50] to-[#1a252f]", // Dark blue
  "bg-gradient-to-b from-[#9B59B6] to-[#8E44AD]", // Purple
  "bg-gradient-to-b from-[#F5DEB3] to-[#DEB887]", // Wheat/beige
  "bg-gradient-to-b from-[#D4A574] to-[#C8915A]", // Tan/brown
  "bg-gradient-to-b from-[#8B4513] to-[#654321]", // Brown
  "bg-gradient-to-b from-[#E8B4B8] to-[#D4919A]", // Pink
  "bg-gradient-to-b from-[#87CEEB] to-[#5FB3D4]", // Sky blue
  "bg-gradient-to-b from-[#98D8AA] to-[#7BC89F]", // Mint green
];

// Category to color mapping for consistent product colors
const categoryColors: Record<string, string> = {
  "brown-sugar": "bg-gradient-to-b from-[#8B4513] to-[#654321]",
  "milk-tea": "bg-gradient-to-b from-[#9B59B6] to-[#8E44AD]",
  "cream-cheese": "bg-gradient-to-b from-[#F5DEB3] to-[#DEB887]",
  "iced-coffee": "bg-gradient-to-b from-[#D4A574] to-[#C8915A]",
  "hot-coffee": "bg-gradient-to-b from-[#8B4513] to-[#654321]",
  "ice-tea": "bg-gradient-to-b from-[#87CEEB] to-[#5FB3D4]",
  "mojito": "bg-gradient-to-b from-[#98D8AA] to-[#7BC89F]",
  "kids-star": "bg-gradient-to-b from-[#E8B4B8] to-[#D4919A]",
  "latte-special": "bg-gradient-to-b from-[#9B59B6] to-[#8E44AD]",
  "frappucchino": "bg-gradient-to-b from-[#2C3E50] to-[#1a252f]",
};

interface Product {
  id: string;
  slug: string;
  price: number | string | { toString(): string };
  imageUrl: string | null;
  translations: Array<{ name: string; description?: string | null }>;
  category?: {
    slug: string;
    translations: Array<{ name: string }>;
  } | null;
}

interface ProductCarouselProps {
  products: Product[];
  className?: string;
}

export function ProductCarousel({
  products,
  className,
}: ProductCarouselProps) {
  const locale = useLocale() as "nl" | "en";
  const carouselRef = useRef<HTMLDivElement>(null);
  const [cardsPerView, setCardsPerView] = useState(5);
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  // Calculate cards per view based on screen width
  useEffect(() => {
    const updateCardsPerView = () => {
      const width = window.innerWidth;
      if (width < 640) setCardsPerView(1.2);
      else if (width < 768) setCardsPerView(2.2);
      else if (width < 1024) setCardsPerView(3.2);
      else if (width < 1280) setCardsPerView(4);
      else setCardsPerView(5);
    };

    updateCardsPerView();
    setMounted(true);
    window.addEventListener("resize", updateCardsPerView);
    return () => window.removeEventListener("resize", updateCardsPerView);
  }, []);

  // Infinite scroll: duplicate products for seamless looping
  const extendedProducts = [...products, ...products, ...products];
  const singleSetWidth = useRef(0);
  const isResetting = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Initialize scroll position to middle set
  useEffect(() => {
    if (carouselRef.current && products.length > 0) {
      const carousel = carouselRef.current;
      // Calculate width of one set of products
      const cardWidth = carousel.scrollWidth / 3;
      singleSetWidth.current = cardWidth;
      // Start at the middle set (no animation)
      carousel.scrollLeft = cardWidth;
    }
  }, [products.length, cardsPerView]);

  // Handle infinite scroll looping - only reset when scrolling stops
  const handleScrollEnd = useCallback(() => {
    if (!carouselRef.current || products.length === 0 || isResetting.current) return;

    const carousel = carouselRef.current;
    const scrollLeft = carousel.scrollLeft;
    const setWidth = singleSetWidth.current;

    if (setWidth === 0) return;

    // Check if we need to reset position
    let newScrollLeft = scrollLeft;

    if (scrollLeft >= setWidth * 2 - carousel.clientWidth) {
      // Near the end - jump back to equivalent position in middle set
      newScrollLeft = scrollLeft - setWidth;
    } else if (scrollLeft <= carousel.clientWidth) {
      // Near the beginning - jump forward to equivalent position in middle set
      newScrollLeft = scrollLeft + setWidth;
    }

    if (newScrollLeft !== scrollLeft) {
      isResetting.current = true;
      // Use scrollTo without smooth behavior for instant jump
      carousel.scrollTo({ left: newScrollLeft, behavior: "instant" });
      // Reset flag after a short delay
      requestAnimationFrame(() => {
        isResetting.current = false;
      });
    }
  }, [products.length]);

  // Debounced scroll handler - wait for scroll to stop before resetting
  const handleScroll = useCallback(() => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    scrollTimeout.current = setTimeout(handleScrollEnd, 100);
  }, [handleScrollEnd]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener("scroll", handleScroll);
      return () => {
        carousel.removeEventListener("scroll", handleScroll);
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }
      };
    }
  }, [handleScroll]);

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.offsetWidth / cardsPerView;
      const scrollAmount = direction === "left" ? -cardWidth : cardWidth;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Quick add to cart
  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    const translation = product.translations[0];
    addItem({
      productId: product.id,
      name: translation?.name || product.slug,
      price: Number(product.price),
      quantity: 1,
      imageUrl: product.imageUrl || undefined,
      customizations: {
        sugarLevel: 100,
        iceLevel: "normal",
      },
    });

    setAddedProducts((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedProducts((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  // Calculate pagination dots
  const totalPages = Math.ceil(products.length / Math.floor(cardsPerView));
  const [currentPage, setCurrentPage] = useState(0);

  // Update current page based on scroll position
  useEffect(() => {
    const updateCurrentPage = () => {
      if (carouselRef.current && singleSetWidth.current > 0) {
        const scrollLeft = carouselRef.current.scrollLeft;
        const setWidth = singleSetWidth.current;
        // Get position within the middle set
        const positionInSet = (scrollLeft % setWidth) / setWidth;
        const page = Math.round(positionInSet * (totalPages - 1));
        setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
      }
    };

    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener("scroll", updateCurrentPage);
      return () => carousel.removeEventListener("scroll", updateCurrentPage);
    }
  }, [totalPages]);

  const scrollToPage = (page: number) => {
    if (carouselRef.current && singleSetWidth.current > 0) {
      const setWidth = singleSetWidth.current;
      // Scroll to position within middle set
      const targetScroll = setWidth + (page / (totalPages - 1)) * (setWidth - carouselRef.current.clientWidth);
      carouselRef.current.scrollTo({ left: targetScroll, behavior: "smooth" });
    }
  };

  return (
    <div className={cn("relative min-h-[460px]", className)}>
      {/* Navigation Arrows - Always visible for infinite scroll */}
      <button
        onClick={() => scroll("left")}
        className={cn(
          "absolute -left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl",
          !mounted && "opacity-0"
        )}
        aria-label="Previous"
      >
        <ChevronLeft className="h-6 w-6 text-gray-700" />
      </button>

      <button
        onClick={() => scroll("right")}
        className={cn(
          "absolute -right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl",
          !mounted && "opacity-0"
        )}
        aria-label="Next"
      >
        <ChevronRight className="h-6 w-6 text-gray-700" />
      </button>

      {/* Carousel Container */}
      <div
        ref={carouselRef}
        className={cn(
          "flex gap-4 overflow-x-auto pb-4 scrollbar-hide transition-opacity duration-200",
          !mounted && "opacity-0"
        )}
        style={{ scrollBehavior: "auto" }}
      >
        {extendedProducts.map((product, index) => {
          const translation = product.translations[0];
          const categorySlug = product.category?.slug || "";
          const originalIndex = index % products.length;
          const bgColor =
            categoryColors[categorySlug] ||
            cardColors[originalIndex % cardColors.length];
          const isAdded = addedProducts.has(product.id);

          return (
            <Link
              key={`${product.id}-${index}`}
              href={`/menu/${product.slug}`}
              className="flex-shrink-0"
              style={{
                width: `calc((100% - ${(Math.floor(cardsPerView) - 1) * 16}px) / ${cardsPerView})`,
              }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "group relative flex h-[400px] flex-col overflow-hidden rounded-3xl p-6 text-white shadow-lg transition-shadow hover:shadow-xl",
                  bgColor
                )}
              >
                {/* Product Name & Price */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif text-xl font-bold uppercase leading-tight tracking-wide drop-shadow-md sm:text-2xl">
                    {translation?.name || product.slug}
                  </h3>
                  <span className="flex-shrink-0 rounded-full bg-white/20 px-3 py-1 text-sm font-bold backdrop-blur-sm">
                    €{Number(product.price).toFixed(2)}
                  </span>
                </div>

                {/* Product Image */}
                <div className="relative mt-auto flex flex-1 items-end justify-center pb-2">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={translation?.name || product.slug}
                      className="h-auto max-h-[220px] w-auto max-w-full object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-8xl drop-shadow-lg transition-transform duration-300 group-hover:scale-105">
                      🧋
                    </span>
                  )}
                </div>

                {/* Floating Add to Cart Button */}
                <button
                  onClick={(e) => handleAddToCart(e, product)}
                  className={cn(
                    "absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all",
                    isAdded
                      ? "bg-matcha-500 text-white scale-110"
                      : "bg-white text-tea-700 hover:bg-tea-600 hover:text-white hover:scale-110 hover:shadow-xl"
                  )}
                >
                  {isAdded ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <Plus className="h-6 w-6" />
                  )}
                </button>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Pagination Dots */}
      {totalPages > 1 && (
        <div className={cn(
          "mt-6 flex justify-center gap-2 transition-opacity duration-200",
          !mounted && "opacity-0"
        )}>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToPage(index)}
              className={cn(
                "h-2.5 rounded-full transition-all duration-300",
                currentPage === index
                  ? "w-8 bg-tea-600"
                  : "w-2.5 bg-gray-300 hover:bg-gray-400"
              )}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
