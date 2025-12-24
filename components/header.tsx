"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, LogOut } from "lucide-react";
import { LanguageSelector } from "@/components/language-selector";
import { useTranslation } from "@/lib/translations";
import { createSupabaseClient } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface HeaderProps {
  selectedItemsCount?: number;
  onCartClick?: () => void;
}

export function Header({ selectedItemsCount = 0, onCartClick }: HeaderProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseClient();

  useEffect(() => {
    // 检查当前用户
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    checkUser();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

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
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-foreground relative"
                    title={user.email || ""}
                  >
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="User avatar"
                        className="h-6 w-6 rounded-full"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                        {user.email?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-foreground"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    <span className="text-sm">{t("auth.logout")}</span>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/login")}
                  className="text-foreground"
                >
                  <span className="text-sm">{t("auth.login")}</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

