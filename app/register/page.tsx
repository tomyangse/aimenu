"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseClient } from "@/lib/supabase";
import { useTranslation } from "@/lib/translations";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useTranslation();
  const supabase = createSupabaseClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // 验证密码匹配
    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      setIsLoading(false);
      return;
    }

    // 验证密码长度
    if (password.length < 6) {
      setError(t("auth.passwordTooShort"));
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // 如果 Supabase 配置了邮件确认，这里可以设置重定向 URL
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      // 如果用户已创建，即使有错误（如邮件发送失败），也算成功
      if (data?.user) {
        // 用户创建成功
        if (data.session) {
          // 不需要邮件确认，直接登录
          router.push("/");
          router.refresh();
        } else {
          // 需要邮件确认，跳转到登录页面
          // 即使邮件发送失败，用户也已创建，可以提示用户稍后登录
          if (signUpError && signUpError.message.includes('confirmation email')) {
            // 邮件发送失败，但用户已创建
            router.push("/login?registered=true&email_sent=false");
          } else {
            // 正常情况，需要检查邮箱
            router.push("/login?registered=true&check_email=true");
          }
        }
        return;
      }

      // 如果用户未创建，显示错误
      if (signUpError) {
        // 更友好的错误信息处理
        let errorMessage = signUpError.message;
        
        // 处理常见的错误
        if (signUpError.message.includes('User already registered') || signUpError.message.includes('already registered')) {
          errorMessage = t("auth.userAlreadyExists") || "该邮箱已被注册";
        } else if (signUpError.message.includes('Invalid email') || signUpError.message.includes('invalid')) {
          errorMessage = t("auth.invalidEmail") || "邮箱格式不正确";
        } else if (signUpError.message.includes('Password') || signUpError.message.includes('password')) {
          errorMessage = t("auth.passwordTooShort") || "密码不符合要求";
        } else if (signUpError.message.includes('confirmation email') || signUpError.message.includes('email')) {
          // 邮件相关错误，但用户可能已创建，提示用户尝试登录
          errorMessage = t("auth.registrationFailed") + " " + (t("auth.tryLogin") || "请尝试直接登录");
        }
        
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // 如果既没有用户也没有错误，说明注册失败
      setError(t("auth.registrationFailed"));
      setIsLoading(false);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : t("auth.registrationFailed"));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {t("auth.register")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("auth.registerDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
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
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                {t("auth.confirmPassword")}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder={t("auth.confirmPasswordPlaceholder")}
              />
            </div>
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
              {isLoading ? t("auth.registering") : t("auth.register")}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              {t("auth.alreadyHaveAccount")}{" "}
              <Link href="/login" className="text-primary hover:underline">
                {t("auth.login")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

