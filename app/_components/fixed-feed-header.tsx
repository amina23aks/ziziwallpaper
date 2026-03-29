"use client";

import { CircleHelp, Search } from "lucide-react";
import type { Category } from "@/types/category";
import { BrandMark } from "@/app/_components/brand-mark";

export function FixedFeedHeader({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  categories,
  onOpenQuestions,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onSelectCategory: (value: string) => void;
  categories: Category[];
  onOpenQuestions: () => void;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 md:gap-3 [direction:ltr]">
          <button
            type="button"
            onClick={onOpenQuestions}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-black"
            aria-label="اقتراحات الأسئلة"
          >
            <CircleHelp size={16} />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2.5 shadow-sm">
            <Search size={16} className="shrink-0 text-zinc-500" />
            <input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="ابحث بالعنوان أو كلمات البحث"
              className="w-full bg-transparent text-right text-sm font-medium text-zinc-900 placeholder:text-zinc-500 outline-none"
            />
          </div>

          <BrandMark />
        </div>

        <div className="flex w-full gap-2 overflow-x-auto pb-1 pr-1 scrollbar-hide [direction:rtl]">
          <button
            type="button"
            onClick={() => onSelectCategory("all")}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              selectedCategory === "all"
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                : "border-zinc-200 bg-white text-zinc-800 dark:border-white dark:bg-white dark:text-black"
            }`}
          >
            الكل
          </button>
          {categories.map((category) => {
            const active = selectedCategory === category.slug;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelectCategory(category.slug)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-zinc-200 bg-white text-zinc-800 dark:border-white dark:bg-white dark:text-black"
                }`}
              >
                {category.nameAr}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
