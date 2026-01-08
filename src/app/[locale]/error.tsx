"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Home, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const locale = (params?.locale as string) || "nl";
  const isNl = locale === "nl";

  useEffect(() => {
    // Log error to console (in production, send to error tracking service)
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-lg">
        {/* Animated spilled tea illustration */}
        <div className="relative mx-auto mb-8 w-32 h-32">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Tilted tea cup */}
              <span
                className="text-7xl inline-block transform -rotate-45"
                style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }}
              >
                🧋
              </span>
              {/* "Spilled" drops */}
              <span className="absolute bottom-0 right-0 text-2xl animate-bounce" style={{ animationDelay: "0.1s" }}>
                💧
              </span>
              <span className="absolute bottom-2 right-4 text-xl animate-bounce" style={{ animationDelay: "0.3s" }}>
                💧
              </span>
              <span className="absolute bottom-4 right-8 text-lg animate-bounce" style={{ animationDelay: "0.5s" }}>
                💧
              </span>
            </div>
          </div>
        </div>

        {/* Error indicator */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-600">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
          </span>
          {isNl ? "Er is iets misgegaan" : "Something went wrong"}
        </div>

        <h1 className="text-2xl font-bold text-tea-900 mb-3">
          {isNl ? "Oeps! We hebben een probleem" : "Oops! We hit a snag"}
        </h1>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          {isNl
            ? "Onze excuses voor het ongemak. Dit had niet mogen gebeuren, maar we werken eraan. Probeer de pagina te vernieuwen of kom later terug."
            : "We apologize for the inconvenience. This shouldn't have happened, but we're working on it. Try refreshing the page or come back later."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            variant="tea"
            size="lg"
            className="w-full sm:w-auto rounded-full shadow-lg shadow-tea-500/25 hover:shadow-xl hover:shadow-tea-500/30 transition-all"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {isNl ? "Probeer opnieuw" : "Try again"}
          </Button>
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

        {/* Error details (only in development) */}
        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mt-8 rounded-xl bg-gray-100 p-4 text-left">
            <p className="text-xs font-mono text-gray-600 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs font-mono text-gray-400">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Contact support link */}
        <div className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-tea-200" />
          <span>{isNl ? "Blijft het probleem?" : "Problem persists?"}</span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-tea-200" />
        </div>

        <Link
          href={`/${locale}/contact`}
          className="mt-3 inline-flex items-center gap-2 text-sm text-tea-600 hover:text-tea-700 hover:underline transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          {isNl ? "Neem contact met ons op" : "Contact us for help"}
        </Link>
      </div>
    </div>
  );
}
