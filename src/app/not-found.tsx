import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";
import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <html lang="nl">
      <body className="bg-cream-50">
        <div className="min-h-screen flex items-center justify-center px-4 py-16">
          <div className="text-center max-w-lg">
            {/* Animated tea cup illustration */}
            <div className="relative mx-auto mb-8 w-32 h-32">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <span className="text-8xl">🧋</span>
                  <span className="absolute -top-2 -right-2 text-2xl text-amber-400">?</span>
                  <span className="absolute -top-4 left-0 text-xl text-amber-300">?</span>
                </div>
              </div>
            </div>

            {/* 404 text with gradient */}
            <div className="mb-4">
              <span className="text-7xl font-black text-amber-600">
                404
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Page not found / Pagina niet gevonden
            </h1>

            <p className="text-gray-600 mb-8 leading-relaxed">
              This page doesn&apos;t exist. / Deze pagina bestaat niet.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/nl/menu">
                <Button className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white rounded-full">
                  <Search className="w-4 h-4 mr-2" />
                  Menu
                </Button>
              </Link>
              <Link href="/nl">
                <Button variant="outline" className="w-full sm:w-auto rounded-full">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
