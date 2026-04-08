"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { DesktopWallpaperFeed } from "@/app/_components/desktop-wallpaper-feed";
import { FixedFeedHeader } from "@/app/_components/fixed-feed-header";
import { MobileBottomNav } from "@/app/_components/mobile-bottom-nav";
import { listActiveCategories } from "@/lib/firestore/categories";
import { listQuestionPrompts } from "@/lib/firestore/question-prompts";
import { listPublishedWallpapersPage } from "@/lib/firestore/wallpapers";
import type { Category } from "@/types/category";
import type { QuestionPrompt } from "@/types/question-prompt";
import type { Wallpaper } from "@/types/wallpaper";

const HOME_WALLPAPER_PAGE_SIZE = 18;

export default function HomePage() {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [questionPrompts, setQuestionPrompts] = useState<QuestionPrompt[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isQuestionsOpen, setIsQuestionsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreWallpapers, setHasMoreWallpapers] = useState(true);
  const nextCursorRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const hasLoadedInitialWallpapersRef = useRef(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const isLoadingMoreRef = useRef(false);
  const hasMoreWallpapersRef = useRef(true);

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  useEffect(() => {
    hasMoreWallpapersRef.current = hasMoreWallpapers;
  }, [hasMoreWallpapers]);

  const loadMoreWallpapers = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMoreWallpapersRef.current) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const page = await listPublishedWallpapersPage(
        HOME_WALLPAPER_PAGE_SIZE,
        nextCursorRef.current
      );

      setWallpapers((previousItems) => {
        if (previousItems.length === 0) {
          return page.items;
        }

        const existingIds = new Set(previousItems.map((item) => item.id).filter(Boolean));
        const uniqueNewItems = page.items.filter((item) => !item.id || !existingIds.has(item.id));

        if (uniqueNewItems.length === 0) {
          return previousItems;
        }

        return [...previousItems, ...uniqueNewItems];
      });

      nextCursorRef.current = page.cursor;
      setHasMoreWallpapers(page.hasMore && page.cursor !== null);
      hasLoadedInitialWallpapersRef.current = true;
    } catch {
      setHasMoreWallpapers(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    async function loadMetaData() {
      const [activeCategories, prompts] = await Promise.all([
        listActiveCategories(100),
        listQuestionPrompts(),
      ]);
      setCategories(activeCategories);
      setQuestionPrompts(prompts);
    }

    loadMetaData();
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialWallpapers() {
      try {
        if (!hasLoadedInitialWallpapersRef.current) {
          await loadMoreWallpapers();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialWallpapers();

    return () => {
      isMounted = false;
    };
  }, [loadMoreWallpapers]);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;

    if (!sentinel || !hasMoreWallpapers) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry?.isIntersecting) {
          void loadMoreWallpapers();
        }
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMoreWallpapers, loadMoreWallpapers]);


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
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 px-4 pb-24 pt-20 sm:px-6 md:items-start md:pb-8 md:pt-[10rem] lg:pt-[9rem]"
            onClick={() => setIsQuestionsOpen(false)}
          >
            <section
              className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl sm:p-4 lg:max-w-3xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
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
              <div className="max-h-[min(28rem,calc(100dvh-11rem))] overflow-y-auto overscroll-contain pr-1 sm:max-h-[min(29rem,calc(100dvh-12rem))] lg:max-h-[min(24rem,calc(100dvh-7rem))]">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                  {questionPrompts.map((prompt) => (
                    <Link
                      key={prompt.id ?? prompt.slug}
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
                          sizes="(max-width: 768px) 42vw, (max-width: 1280px) 28vw, 220px"
                          unoptimized
                        />
                      </div>
                      <p className="p-2 text-center text-xs font-semibold text-zinc-800">{prompt.questionAr}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}


        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 [direction:rtl] xl:grid-cols-5">
            {Array.from({ length: 10 }, (_, index) => (
              <div
                key={`feed-skeleton-${index}`}
                className="h-40 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100"
              />
            ))}
          </div>
        ) : filteredWallpapers.length === 0 ? (
          <p className="rounded-2xl border border-zinc-200 bg-white px-4 py-6 text-center text-sm text-zinc-600">
            لا توجد خلفيات مطابقة حالياً.
          </p>
        ) : (
          <>
            <DesktopWallpaperFeed wallpapers={filteredWallpapers} />
            <div ref={loadMoreSentinelRef} className="h-1 w-full" aria-hidden="true" />
            {isLoadingMore && (
              <p className="mt-4 text-center text-xs font-medium text-zinc-500">جاري تحميل المزيد...</p>
            )}
          </>
        )}
      </div>

      <MobileBottomNav activeTab="home" />
    </main>
  );
}
