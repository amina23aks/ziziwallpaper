"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MasonryGrid } from "@/app/_components/masonry-grid";
import { MobileBottomNav } from "@/app/_components/mobile-bottom-nav";
import { MobileHomeTopBar } from "@/app/_components/mobile-home-top-bar";
import { PublicWallpaperCard } from "@/app/_components/public-wallpaper-card";
import { listActiveCategories } from "@/lib/firestore/categories";
import { listQuestionPrompts } from "@/lib/firestore/question-prompts";
import { listPublishedWallpapers } from "@/lib/firestore/wallpapers";
import type { Category } from "@/types/category";
import type { QuestionPrompt } from "@/types/question-prompt";
import type { Wallpaper } from "@/types/wallpaper";

export default function HomePage() {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [questionPrompts, setQuestionPrompts] = useState<QuestionPrompt[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isQuestionsOpen, setIsQuestionsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [publishedWallpapers, activeCategories, prompts] = await Promise.all([
          listPublishedWallpapers(100),
          listActiveCategories(100),
          listQuestionPrompts(),
        ]);
        setWallpapers(publishedWallpapers);
        setCategories(activeCategories);
        setQuestionPrompts(prompts);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredWallpapers = useMemo(() => {
    return wallpapers.filter((wallpaper) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesCategory =
        selectedCategory === "all" || wallpaper.categorySlugs?.includes(selectedCategory);
      const matchesSearch =
        query.length === 0 ||
        wallpaper.title.toLowerCase().includes(query) ||
        wallpaper.searchKeywords?.some((item) => item.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [wallpapers, searchQuery, selectedCategory]);

  return (
    <main className="min-h-screen w-full bg-zinc-50 pb-24 pt-20 md:pr-24 md:pt-6">
      <MobileHomeTopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenQuestions={() => setIsQuestionsOpen(true)}
      />

      <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-5 sm:px-6 lg:px-8">
        <header className="hidden items-center justify-between md:flex">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-zinc-600">ZIZI</p>
            <h1 className="text-xl font-extrabold text-zinc-900">Wallpapers</h1>
          </div>
          <button
            type="button"
            onClick={() => setIsQuestionsOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 text-lg font-bold text-white shadow-sm"
            aria-label="اقتراحات الأسئلة"
          >
            ؟
          </button>
        </header>

        {isQuestionsOpen && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 px-4"
            onClick={() => setIsQuestionsOpen(false)}
          >
            <section
              className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-zinc-900">اختر سؤالك</p>
                <button
                  type="button"
                  onClick={() => setIsQuestionsOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-zinc-700"
                  aria-label="إغلاق"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {questionPrompts.map((prompt) => (
                  <Link
                    key={prompt.slug}
                    href={`/question/${prompt.slug}`}
                    onClick={() => setIsQuestionsOpen(false)}
                    className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"
                  >
                    <div className="relative aspect-[4/3] bg-zinc-100">
                      <Image
                        src={prompt.imageUrl}
                        alt={prompt.questionAr}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 45vw, 220px"
                      />
                    </div>
                    <p className="p-2 text-center text-xs font-semibold text-zinc-800">{prompt.questionAr}</p>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}

        <div className="hidden rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm md:block">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="ابحث بالعنوان أو كلمات البحث"
            className="w-full bg-transparent text-sm font-medium text-zinc-900 placeholder:text-zinc-500 outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
              selectedCategory === "all"
                ? "bg-zinc-900 text-white"
                : "border border-zinc-300 bg-white text-zinc-800"
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
                onClick={() => setSelectedCategory(category.slug)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-300 bg-white text-zinc-800"
                }`}
              >
                {category.nameAr}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <p className="text-sm text-zinc-600">جاري تحميل الخلفيات...</p>
        ) : filteredWallpapers.length === 0 ? (
          <p className="rounded-2xl border border-zinc-200 bg-white px-4 py-6 text-center text-sm text-zinc-600">
            لا توجد خلفيات مطابقة حالياً.
          </p>
        ) : (
          <MasonryGrid>
            {filteredWallpapers.map((wallpaper, index) => (
              <div key={wallpaper.id ?? index} className="mb-3 break-inside-avoid">
                <PublicWallpaperCard wallpaper={wallpaper} />
              </div>
            ))}
          </MasonryGrid>
        )}
      </div>

      <MobileBottomNav activeTab="home" />
    </main>
  );
}
