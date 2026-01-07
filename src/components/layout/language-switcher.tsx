"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const languages = [
  { code: "nl" as const, label: "NL" },
  { code: "en" as const, label: "EN" },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (langCode: "nl" | "en") => {
    if (langCode !== locale) {
      router.replace(pathname, { locale: langCode });
    }
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-0.5 px-1.5 py-1 h-8 md:h-9 md:px-2 md:gap-1"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-xs md:text-sm font-medium uppercase">{locale}</span>
        <ChevronDown
          className={`h-2.5 w-2.5 md:h-3 md:w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-cream-200 bg-white shadow-md"
            role="listbox"
          >
            {languages.map((lang) => {
              const isSelected = lang.code === locale;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`block w-full px-4 py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-tea-50 text-tea-700"
                      : "text-tea-900 hover:bg-cream-50"
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  {lang.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
