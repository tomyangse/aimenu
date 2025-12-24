"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseClient } from "@/lib/supabase";
import { useTranslation } from "@/lib/translations";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useTranslation();
  const supabase = createSupabaseClient();

  // 检查 URL 参数，显示注册成功消息
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "true") {
      if (params.get("check_email") === "true") {
        setSuccessMessage(t("auth.checkEmail") || "请检查您的邮箱以确认账户");
      } else {
        setSuccessMessage(t("auth.registrationSuccess") || "注册成功！请登录");
      }
    }
  }, [t]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // 登录成功，重定向到首页
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败，请稍后重试");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {t("auth.login")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("auth.loginDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                {t("auth.email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder={t("auth.emailPlaceholder")}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                {t("auth.password")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder={t("auth.passwordPlaceholder")}
              />
            </div>
            {successMessage && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm border border-green-200 dark:border-green-800">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? t("auth.loggingIn") : t("auth.login")}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <Link href="/register" className="text-primary hover:underline">
                {t("auth.register")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

