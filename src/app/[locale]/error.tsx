"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (in production, send to error tracking service)
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-tea-900 mb-2">
          Er is iets misgegaan
        </h1>
        <p className="text-muted-foreground mb-8">
          Onze excuses voor het ongemak. Probeer de pagina te vernieuwen of ga
          terug naar de homepagina.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Opnieuw proberen
          </Button>
          <Link href="/">
            <Button variant="tea">
              <Home className="w-4 h-4 mr-2" />
              Naar homepagina
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
