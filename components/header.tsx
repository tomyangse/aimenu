"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart, User } from "lucide-react";
import { LanguageSelector } from "@/components/language-selector";
import { useTranslation } from "@/lib/translations";

interface HeaderProps {
  selectedItemsCount?: number;
  onCartClick?: () => void;
}

export function Header({ selectedItemsCount = 0, onCartClick }: HeaderProps) {
  const { t } = useTranslation();
  
  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/60">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-bold text-foreground">
          {t("app.title")}
        </h1>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          {selectedItemsCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCartClick}
              className="relative text-foreground"
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              <span className="text-sm">{t("cart.title")}</span>
              <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs font-semibold">
                {selectedItemsCount}
              </span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground"
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

