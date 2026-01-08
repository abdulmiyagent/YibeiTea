"use client";

import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function NotFound() {
  const params = useParams();
  const locale = (params?.locale as string) || "nl";
  const isNl = locale === "nl";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-lg">
        {/* Animated tea cup illustration */}
        <div className="relative mx-auto mb-8 w-32 h-32">
          {/* Cup body */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <span className="text-8xl animate-bounce" style={{ animationDuration: "2s" }}>
                🧋
              </span>
              {/* Question marks floating */}
              <span className="absolute -top-2 -right-2 text-2xl animate-pulse text-tea-400">?</span>
              <span className="absolute -top-4 left-0 text-xl animate-pulse text-tea-300" style={{ animationDelay: "0.5s" }}>?</span>
            </div>
          </div>
        </div>

        {/* 404 text with gradient */}
        <div className="mb-4">
          <span className="text-7xl font-black bg-gradient-to-r from-tea-400 via-tea-500 to-taro-500 bg-clip-text text-transparent">
            404
          </span>
        </div>

        <h1 className="text-2xl font-bold text-bordeaux-800 mb-3">
          {isNl ? "Oeps! Pagina niet gevonden" : "Oops! Page not found"}
        </h1>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          {isNl
            ? "Deze pagina bestaat niet of is verhuisd naar een nieuwe locatie. Geen zorgen, onze heerlijke bubble tea wacht nog steeds op je!"
            : "This page doesn't exist or has moved to a new location. Don't worry, our delicious bubble tea is still waiting for you!"}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={`/${locale}/menu`}>
            <Button
              variant="tea"
              size="lg"
              className="w-full sm:w-auto rounded-full shadow-lg shadow-tea-500/25 hover:shadow-xl hover:shadow-tea-500/30 transition-all"
            >
              <Search className="w-4 h-4 mr-2" />
              {isNl ? "Bekijk menu" : "View menu"}
            </Button>
          </Link>
          <Link href={`/${locale}`}>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto rounded-full border-tea-200 hover:bg-tea-50"
            >
              <Home className="w-4 h-4 mr-2" />
              {isNl ? "Naar home" : "Go home"}
            </Button>
          </Link>
        </div>

        {/* Decorative elements */}
        <div className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-tea-200" />
          <span>{isNl ? "Of neem contact op" : "Or contact us"}</span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-tea-200" />
        </div>

        <Link
          href={`/${locale}/contact`}
          className="mt-3 inline-block text-sm text-tea-600 hover:text-tea-700 hover:underline transition-colors"
        >
          {isNl ? "Hulp nodig? Stuur ons een bericht" : "Need help? Send us a message"}
        </Link>
      </div>
    </div>
  );
}
