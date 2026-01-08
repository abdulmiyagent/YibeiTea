"use client";

import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc";
import { Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  productId: string;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "ghost" | "outline" | "secondary";
}

export function FavoriteButton({
  productId,
  className,
  size = "icon",
  variant = "ghost",
}: FavoriteButtonProps) {
  const { status } = useSession();
  const locale = useLocale() as "nl" | "en";
  const router = useRouter();
  const utils = api.useUtils();

  const { data: favorites } = api.users.getFavorites.useQuery(
    { locale },
    { enabled: status === "authenticated" }
  );

  const isFavorite = favorites?.some((fav) => fav.id === productId) ?? false;

  const addFavorite = api.users.addFavorite.useMutation({
    onSuccess: () => {
      utils.users.getFavorites.invalidate();
    },
  });

  const removeFavorite = api.users.removeFavorite.useMutation({
    onSuccess: () => {
      utils.users.getFavorites.invalidate();
    },
  });

  const isLoading = addFavorite.isPending || removeFavorite.isPending;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status !== "authenticated") {
      router.push("/login");
      return;
    }

    if (isFavorite) {
      removeFavorite.mutate({ productId });
    } else {
      addFavorite.mutate({ productId });
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      className={cn(
        "rounded-full transition-all duration-200",
        isFavorite && "text-red-500 hover:text-red-600 hover:scale-110",
        !isFavorite && "text-muted-foreground hover:text-red-500 hover:scale-110",
        className
      )}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isFavorite && "fill-current scale-110"
          )}
        />
      )}
    </Button>
  );
}
