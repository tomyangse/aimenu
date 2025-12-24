"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from "@/contexts/language-context";
import { Languages } from "lucide-react";
import { useTranslation } from "@/lib/translations";

export function LanguageSelector() {
  const { language, setLanguage, getLanguageName } = useLanguage();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = (langCode: LanguageCode) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 h-8 px-2 text-foreground hover:bg-muted/50 transition-colors rounded-lg"
        aria-label={t("language.selector")}
        suppressHydrationWarning
      >
        <Languages className="h-3.5 w-3.5 stroke-[1.5]" />
        <span className="text-[10px] font-light tracking-wide uppercase" suppressHydrationWarning>
          {language.split("-")[0]}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 bg-background/95 backdrop-blur-sm border border-border/40 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] z-50 min-w-[140px] max-h-[240px] overflow-y-auto">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-muted/50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                language === lang.code
                  ? "bg-muted/30 font-medium text-foreground"
                  : "text-foreground font-normal"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{lang.nativeName}</span>
                {language === lang.code && (
                  <span className="text-primary text-[10px]">●</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

