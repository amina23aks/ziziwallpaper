"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/_providers/theme-provider";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="fixed bottom-24 left-3 z-[60] inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white/95 text-zinc-700 shadow-sm backdrop-blur transition hover:bg-zinc-100 md:bottom-4 md:left-4"
      aria-label={isDark ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}
      title={isDark ? "الوضع النهاري" : "الوضع الليلي"}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
