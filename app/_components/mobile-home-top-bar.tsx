"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function MobileHomeTopBar({
  searchQuery,
  onSearchChange,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      if (currentY <= 10) {
        setIsVisible(true);
      } else if (delta > 8) {
        setIsVisible(false);
      } else if (delta < -6) {
        setIsVisible(true);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur transition-transform duration-200 md:hidden ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto flex w-full max-w-md items-center gap-2 [direction:ltr]">
        <div className="h-10 w-10 shrink-0" />

        <div className="min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="ابحث بالعنوان أو كلمات البحث"
            className="w-full bg-transparent text-right text-sm font-medium text-zinc-900 placeholder:text-zinc-500 outline-none"
          />
        </div>

        <Link
          href="/"
          className="inline-flex h-10 min-w-14 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white px-3 text-xs font-extrabold text-zinc-800"
        >
          ZIZI
        </Link>
      </div>
    </header>
  );
}
