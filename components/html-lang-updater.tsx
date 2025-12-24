"use client";

import { useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";

export function HtmlLangUpdater() {
  const { language } = useLanguage();

  useEffect(() => {
    // 更新 HTML lang 属性
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  return null;
}

