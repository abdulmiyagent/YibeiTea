"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight, Plus, Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc";
import Image from "next/image";
import dynamic from "next/dynamic";

// Lazy load the customize dialog - only loaded when needed
const ProductCustomizeDialog = dynamic(
  () => import("@/components/products/product-customize-dialog").then(mod => mod.ProductCustomizeDialog),
  { ssr: false }
);

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

// Get category placeholder image URL based on category slug
function getCategoryPlaceholder(categorySlug: string | undefined): string {
  const validCategories = [
    "brown-sugar",
    "milk-tea",
    "cream-cheese",
    "iced-coffee",
    "hot-coffee",
    "ice-tea",
    "mojito",
    "kids-star",
    "latte-special",
    "frappucchino",
  ];

  if (categorySlug && validCategories.includes(categorySlug)) {
    return `/images/categories/${categorySlug}.svg`;
  }
  return "/images/categories/placeholder.svg";
}

interface Product {
  id: string;
  slug: string;
  price: number | string | { toString(): string };
  imageUrl: string | null;
  vegan: boolean;
  caffeine: boolean;
  calories: number | null;
  allowSugarCustomization: boolean;
  allowIceCustomization: boolean;
  allowToppings: boolean;
  translations: Array<{ name: string; description?: string | null }>;
  category?: {
    slug: string;
    translations: Array<{ name: string }>;
  } | null;
}

interface ProductCarouselProps {
  products: Product[];
  className?: string;
  showFavoriteButton?: boolean;
}

// Memoized Product Card for performance
interface ProductCardProps {
  product: Product;
  index: number;
  originalIndex: number;
  cardsPerView: number;
  showFavoriteButton: boolean;
  isFavorite: boolean;
  isLoadingFavorite: boolean;
  onFavoriteClick: (e: React.MouseEvent, productId: string) => void;
  onProductClick: (e: React.MouseEvent, product: Product) => void;
}

const ProductCard = memo(function ProductCard({
  product,
  index,
  originalIndex,
  cardsPerView,
  showFavoriteButton,
  isFavorite: productIsFavorite,
  isLoadingFavorite,
  onFavoriteClick,
  onProductClick,
}: ProductCardProps) {
  const translation = product.translations[0];
  const categorySlug = product.category?.slug || "";
  const bgColor =
    categoryColors[categorySlug] ||
    cardColors[originalIndex % cardColors.length];

  return (
    <div
      key={`${product.id}-${index}`}
      className="flex-shrink-0 cursor-pointer"
      style={{
        width: `calc((100% - ${(Math.floor(cardsPerView) - 1) * 16}px) / ${cardsPerView})`,
      }}
      onClick={(e) => onProductClick(e, product)}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "group relative flex h-[400px] flex-col overflow-hidden rounded-3xl p-6 text-white shadow-lg transition-shadow hover:shadow-xl",
          bgColor
        )}
      >
        {/* Favorite Button - Top Right */}
        {showFavoriteButton && (
          <button
            onClick={(e) => onFavoriteClick(e, product.id)}
            disabled={isLoadingFavorite}
            className={cn(
              "absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full transition-all",
              productIsFavorite
                ? "bg-white/30 text-red-400 hover:bg-white/40"
                : "bg-white/20 text-white/80 hover:bg-white/30 hover:text-white"
            )}
            aria-label={productIsFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isLoadingFavorite ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Heart
                className={cn(
                  "h-5 w-5 transition-transform",
                  productIsFavorite && "fill-current scale-110"
                )}
              />
            )}
          </button>
        )}

        {/* Product Name */}
        <div className="flex items-start justify-between gap-2 pr-12">
          <h3 className="font-serif text-xl font-bold uppercase leading-tight tracking-wide drop-shadow-md sm:text-2xl line-clamp-2">
            {translation?.name || product.slug}
          </h3>
        </div>

        {/* Product Image */}
        <div className="relative mt-auto flex flex-1 items-end justify-center pb-2">
          <div className="relative h-[220px] w-full">
            <Image
              src={product.imageUrl || getCategoryPlaceholder(categorySlug)}
              alt={translation?.name || product.slug}
              fill
              sizes="(max-width: 640px) 80vw, (max-width: 768px) 45vw, (max-width: 1024px) 30vw, 20vw"
              className="object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        </div>

        {/* Price Badge - Bottom Left */}
        <div className="absolute bottom-4 left-4">
          <span className="rounded-full bg-white/30 px-4 py-2 text-base font-bold backdrop-blur-sm shadow-sm">
            €{Number(product.price).toFixed(2)}
          </span>
        </div>

        {/* Floating Add to Cart Button - Opens customization modal */}
        <button
          onClick={(e) => onProductClick(e, product)}
          className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-tea-700 shadow-lg transition-all hover:bg-tea-600 hover:text-white hover:scale-110 hover:shadow-xl"
          aria-label="Customize and add to cart"
        >
          <Plus className="h-6 w-6" />
        </button>
      </motion.div>
    </div>
  );
});

export function ProductCarousel({
  products,
  className,
  showFavoriteButton = false,
}: ProductCarouselProps) {
  const locale = useLocale() as "nl" | "en";
  const router = useRouter();
  const { status } = useSession();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [cardsPerView, setCardsPerView] = useState(5);
  const [mounted, setMounted] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const utils = api.useUtils();

  // Favorites API
  const { data: favorites } = api.users.getFavorites.useQuery(
    { locale },
    { enabled: status === "authenticated" && showFavoriteButton }
  );

  // Pre-fetch shared data for popup (customizations and toppings) - makes popup instant
  api.customizations.getAll.useQuery(
    { locale },
    { staleTime: 10 * 60 * 1000 } // 10 minutes - rarely changes
  );
  api.toppings.getAll.useQuery(
    { locale, onlyAvailable: true },
    { staleTime: 10 * 60 * 1000 } // 10 minutes - rarely changes
  );

  const addFavorite = api.users.addFavorite.useMutation({
    onMutate: ({ productId }) => {
      setLoadingFavorites((prev) => new Set(prev).add(productId));
    },
    onSuccess: () => {
      utils.users.getFavorites.invalidate();
    },
    onSettled: (_, __, { productId }) => {
      setLoadingFavorites((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    },
  });

  const removeFavorite = api.users.removeFavorite.useMutation({
    onMutate: ({ productId }) => {
      setLoadingFavorites((prev) => new Set(prev).add(productId));
    },
    onSuccess: () => {
      utils.users.getFavorites.invalidate();
    },
    onSettled: (_, __, { productId }) => {
      setLoadingFavorites((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    },
  });

  const isFavorite = useCallback(
    (productId: string) => favorites?.some((fav) => fav.id === productId) ?? false,
    [favorites]
  );

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent, productId: string) => {
      e.preventDefault();
      e.stopPropagation();

      if (status !== "authenticated") {
        router.push("/login");
        return;
      }

      if (favorites?.some((fav) => fav.id === productId)) {
        removeFavorite.mutate({ productId });
      } else {
        addFavorite.mutate({ productId });
      }
    },
    [status, router, favorites, removeFavorite, addFavorite]
  );

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

  // Only use infinite scroll if there are more products than visible cards
  const shouldInfiniteScroll = products.length > Math.ceil(cardsPerView);
  const extendedProducts = shouldInfiniteScroll
    ? [...products, ...products, ...products]
    : products;
  const singleSetWidth = useRef(0);
  const isResetting = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Initialize scroll position to middle set (only for infinite scroll)
  useEffect(() => {
    if (carouselRef.current && products.length > 0 && shouldInfiniteScroll) {
      const carousel = carouselRef.current;
      // Calculate width of one set of products
      const cardWidth = carousel.scrollWidth / 3;
      singleSetWidth.current = cardWidth;
      // Start at the middle set (no animation)
      carousel.scrollLeft = cardWidth;
    }
  }, [products.length, cardsPerView, shouldInfiniteScroll]);

  // Handle infinite scroll looping - only reset when scrolling stops
  const handleScrollEnd = useCallback(() => {
    if (!carouselRef.current || products.length === 0 || isResetting.current || !shouldInfiniteScroll) return;

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
  }, [products.length, shouldInfiniteScroll]);

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

  // Open customize dialog
  const handleProductClick = useCallback((e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProduct(product);
  }, []);

  // Calculate pagination dots
  const totalPages = Math.ceil(products.length / Math.floor(cardsPerView));
  const [currentPage, setCurrentPage] = useState(0);

  // Update current page based on scroll position
  useEffect(() => {
    const updateCurrentPage = () => {
      if (carouselRef.current) {
        const carousel = carouselRef.current;
        const scrollLeft = carousel.scrollLeft;

        if (shouldInfiniteScroll && singleSetWidth.current > 0) {
          const setWidth = singleSetWidth.current;
          // Get position within the middle set
          const positionInSet = (scrollLeft % setWidth) / setWidth;
          const page = Math.round(positionInSet * (totalPages - 1));
          setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
        } else {
          // Simple pagination for non-infinite scroll
          const maxScroll = carousel.scrollWidth - carousel.clientWidth;
          const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;
          const page = Math.round(progress * (totalPages - 1));
          setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
        }
      }
    };

    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener("scroll", updateCurrentPage);
      return () => carousel.removeEventListener("scroll", updateCurrentPage);
    }
  }, [totalPages, shouldInfiniteScroll]);

  const scrollToPage = (page: number) => {
    if (carouselRef.current) {
      const carousel = carouselRef.current;

      if (shouldInfiniteScroll && singleSetWidth.current > 0) {
        const setWidth = singleSetWidth.current;
        // Scroll to position within middle set
        const targetScroll = setWidth + (page / (totalPages - 1)) * (setWidth - carousel.clientWidth);
        carousel.scrollTo({ left: targetScroll, behavior: "smooth" });
      } else {
        // Simple scroll for non-infinite
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        const targetScroll = (page / (totalPages - 1)) * maxScroll;
        carousel.scrollTo({ left: targetScroll, behavior: "smooth" });
      }
    }
  };

  // Determine if navigation arrows should be shown
  const showNavigation = shouldInfiniteScroll || products.length > Math.floor(cardsPerView);

  return (
    <div className={cn("relative min-h-[460px]", className)}>
      {/* Navigation Arrows - Only visible when there's content to scroll */}
      {showNavigation && (
        <>
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
        </>
      )}

      {/* Carousel Container */}
      <div
        ref={carouselRef}
        className={cn(
          "flex gap-4 overflow-x-auto pb-4 scrollbar-hide transition-opacity duration-200",
          !mounted && "opacity-0"
        )}
        style={{ scrollBehavior: "auto" }}
      >
        {extendedProducts.map((product, index) => (
          <ProductCard
            key={`${product.id}-${index}`}
            product={product}
            index={index}
            originalIndex={index % products.length}
            cardsPerView={cardsPerView}
            showFavoriteButton={showFavoriteButton}
            isFavorite={isFavorite(product.id)}
            isLoadingFavorite={loadingFavorites.has(product.id)}
            onFavoriteClick={handleFavoriteClick}
            onProductClick={handleProductClick}
          />
        ))}
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

      {/* Product Customize Dialog */}
      {selectedProduct && (
        <ProductCustomizeDialog
          product={selectedProduct}
          open={!!selectedProduct}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
