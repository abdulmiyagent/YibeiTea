import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🧋</div>
        <h1 className="text-2xl font-bold text-tea-900 mb-2">
          Pagina niet gevonden
        </h1>
        <p className="text-muted-foreground mb-8">
          Deze pagina bestaat niet of is verplaatst. Misschien vind je wat je
          zoekt in ons menu?
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/menu">
            <Button variant="outline">
              <Search className="w-4 h-4 mr-2" />
              Bekijk menu
            </Button>
          </Link>
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
