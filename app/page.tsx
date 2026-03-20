"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DesktopWallpaperFeed } from "@/app/_components/desktop-wallpaper-feed";
import { FixedFeedHeader } from "@/app/_components/fixed-feed-header";
import { MasonryGrid } from "@/app/_components/masonry-grid";
import { MobileBottomNav } from "@/app/_components/mobile-bottom-nav";
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
    const query = searchQuery.trim().toLowerCase();

    return wallpapers
      .filter((wallpaper) => {
        const matchesCategory =
          selectedCategory === "all" || wallpaper.categorySlugs?.includes(selectedCategory);
        const matchesSearch =
          query.length === 0 ||
          wallpaper.title.toLowerCase().includes(query) ||
          wallpaper.searchKeywords?.some((item) => item.toLowerCase().includes(query));

        return matchesCategory && matchesSearch;
      })
      .sort((left, right) => {
        const leftSeconds = (left.createdAt as { seconds?: number } | null | undefined)?.seconds ?? 0;
        const rightSeconds = (right.createdAt as { seconds?: number } | null | undefined)?.seconds ?? 0;

        if (rightSeconds !== leftSeconds) {
          return rightSeconds - leftSeconds;
        }

        return (right.id ?? "").localeCompare(left.id ?? "");
      });
  }, [wallpapers, searchQuery, selectedCategory]);

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-zinc-50 pb-24 pt-[124px] md:pr-20 md:pt-[126px]">
      <FixedFeedHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categories={categories}
        onOpenQuestions={() => setIsQuestionsOpen(true)}
      />

      <div className="mx-auto w-full max-w-[92rem] space-y-4 px-4 py-5 sm:px-6 lg:px-8">

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


        {isLoading ? (
          <p className="text-sm text-zinc-600">جاري تحميل الخلفيات...</p>
        ) : filteredWallpapers.length === 0 ? (
          <p className="rounded-2xl border border-zinc-200 bg-white px-4 py-6 text-center text-sm text-zinc-600">
            لا توجد خلفيات مطابقة حالياً.
          </p>
        ) : (
          <>
            <div className="xl:hidden">
              <MasonryGrid>
                {filteredWallpapers.map((wallpaper, index) => (
                  <div key={wallpaper.id ?? index} className="mb-2 inline-block w-full break-inside-avoid align-top sm:mb-3">
                    <PublicWallpaperCard wallpaper={wallpaper} />
                  </div>
                ))}
              </MasonryGrid>
            </div>
            <div className="hidden xl:block">
              <DesktopWallpaperFeed wallpapers={filteredWallpapers} />
            </div>
          </>
        )}
      </div>

      <MobileBottomNav activeTab="home" />
    </main>
  );
}
