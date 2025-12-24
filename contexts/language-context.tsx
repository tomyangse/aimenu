"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// 支持的语言列表
export const SUPPORTED_LANGUAGES = [
  { code: "zh-CN", name: "简体中文", nativeName: "简体中文" },
  { code: "en", name: "English", nativeName: "English" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]["code"];

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  getLanguageName: (code: LanguageCode) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 从浏览器检测语言
const detectBrowserLanguage = (): LanguageCode => {
  if (typeof window === "undefined") return "zh-CN";
  
  const browserLang = navigator.language || (navigator as any).userLanguage;
  
  // 尝试精确匹配
  const exactMatch = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === browserLang
  );
  if (exactMatch) return exactMatch.code;
  
  // 尝试匹配语言代码（如 zh-CN 匹配 zh）
  const langCode = browserLang.split("-")[0];
  const partialMatch = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code.split("-")[0] === langCode
  );
  if (partialMatch) return partialMatch.code;
  
  // 默认返回中文
  return "zh-CN";
};

// 从LocalStorage读取语言
const getStoredLanguage = (): LanguageCode | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("userLanguage");
    if (stored && SUPPORTED_LANGUAGES.some((lang) => lang.code === stored)) {
      return stored as LanguageCode;
    }
  } catch (error) {
    console.warn("Failed to read language from localStorage:", error);
  }
  return null;
};

// 保存语言到LocalStorage
const saveLanguageToStorage = (lang: LanguageCode) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("userLanguage", lang);
  } catch (error) {
    console.warn("Failed to save language to localStorage:", error);
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  // 服务端和客户端使用相同的初始值，避免 hydration 错误
  const [language, setLanguageState] = useState<LanguageCode>("zh-CN");
  const [isMounted, setIsMounted] = useState(false);

  // 客户端挂载后，从 localStorage 读取语言
  useEffect(() => {
    setIsMounted(true);
    const stored = getStoredLanguage();
    if (stored) {
      setLanguageState(stored);
    } else {
      const detected = detectBrowserLanguage();
      setLanguageState(detected);
      saveLanguageToStorage(detected);
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    saveLanguageToStorage(lang);
  };

  const getLanguageName = (code: LanguageCode): string => {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    if (lang) {
      // Type assertion needed because of 'as const' narrowing
      const langItem = lang as { code: string; name: string; nativeName: string };
      return langItem.nativeName || langItem.name || code;
    }
    return code;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, getLanguageName }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

