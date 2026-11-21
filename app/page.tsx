"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { DesktopWallpaperFeed } from "@/app/_components/desktop-wallpaper-feed";
import { FixedFeedHeader } from "@/app/_components/fixed-feed-header";
import { MobileBottomNav } from "@/app/_components/mobile-bottom-nav";
import { getCloudinaryImageUrl } from "@/lib/cloudinary/delivery";
import { listActiveCategories } from "@/lib/firestore/categories";
import { listQuestionPrompts } from "@/lib/firestore/question-prompts";
import { useWallpaperFeed } from "@/lib/hooks/use-wallpaper-feed";
import type { Category } from "@/types/category";
import type { QuestionPrompt } from "@/types/question-prompt";

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [questionPrompts, setQuestionPrompts] = useState<QuestionPrompt[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isQuestionsOpen, setIsQuestionsOpen] = useState(false);
  const {
    items: wallpapers,
    isLoading,
    isLoadingMore,
    hasMore: hasMoreWallpapers,
    loadError,
    loadMore: loadMoreWallpapers,
  } = useWallpaperFeed(selectedCategory);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollPositionAtLastLoadRef = useRef(0);

  useEffect(() => {
    async function loadMetaData() {
      const [activeCategories, prompts] = await Promise.all([
        listActiveCategories(100),
        listQuestionPrompts(),
      ]);
      setCategories(activeCategories);
      setQuestionPrompts(prompts);
    }

    void loadMetaData().catch(() => {
      // A metadata failure must not stop the wallpaper feed.
    });
  }, []);

  useEffect(() => {
    // A visible sentinel on a tall screen must not fetch extra pages on opening.
    scrollPositionAtLastLoadRef.current = window.scrollY;
  }, [selectedCategory, searchQuery, wallpapers.length]);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;

    if (!sentinel || isQuestionsOpen || isLoading || isLoadingMore || loadError || !hasMoreWallpapers ||
        typeof IntersectionObserver === "undefined") {
      return;
    }

    let isNearEnd = false;
    let isActive = true;
    let hasScrollIntent = false;
    const loadAfterScroll = () => {
      const scrollPosition = window.scrollY;
      if (isActive && isNearEnd && (hasScrollIntent || scrollPosition > scrollPositionAtLastLoadRef.current)) {
        hasScrollIntent = false;
        scrollPositionAtLastLoadRef.current = scrollPosition;
        void loadMoreWallpapers();
      }
    };
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY > 0) {
        hasScrollIntent = true;
        loadAfterScroll();
      }
    };
    let touchY: number | null = null;
    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event: TouchEvent) => {
      const nextTouchY = event.touches[0]?.clientY;
      if (touchY !== null && nextTouchY !== undefined && nextTouchY < touchY) {
        hasScrollIntent = true;
        loadAfterScroll();
      }
      touchY = nextTouchY ?? null;
    };
    const observer = new IntersectionObserver(
      (entries) => {
        isNearEnd = Boolean(entries[0]?.isIntersecting);
        loadAfterScroll();
      },
      { rootMargin: "100px 0px" }
    );

    observer.observe(sentinel);
    window.addEventListener("scroll", loadAfterScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      isActive = false;
      observer.disconnect();
      window.removeEventListener("scroll", loadAfterScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [isQuestionsOpen, isLoading, isLoadingMore, loadError, hasMoreWallpapers, loadMoreWallpapers, searchQuery]);

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
                          src={getCloudinaryImageUrl(prompt.imageUrl, "thumbnail")}
                          alt={prompt.questionAr}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 42vw, (max-width: 1280px) 28vw, 220px"
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
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={`feed-skeleton-${index}`}
                className="h-40 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100"
              />
            ))}
          </div>
        ) : filteredWallpapers.length === 0 ? (
          <p className="rounded-2xl border border-zinc-200 bg-white px-4 py-6 text-center text-sm text-zinc-600">
            {loadError ? "تعذر تحميل الخلفيات. حاول مرة أخرى." :
              hasMoreWallpapers ? "مرّر أو اضغط تحميل المزيد للبحث في الخلفيات الأقدم." : "لا توجد خلفيات مطابقة حالياً."}
          </p>
        ) : (
          <DesktopWallpaperFeed wallpapers={filteredWallpapers} />
        )}
        <div ref={loadMoreSentinelRef} className="h-1 w-full" aria-hidden="true" />
        {isLoadingMore && (
          <p role="status" className="mt-4 text-center text-xs font-medium text-zinc-500">جاري تحميل المزيد...</p>
        )}
        {!isLoading && searchQuery.trim() && hasMoreWallpapers && filteredWallpapers.length > 0 && (
          <p className="mt-4 text-center text-xs text-zinc-500">
            للبحث في خلفيات أقدم، مرّر للأسفل أو اضغط تحميل المزيد.
          </p>
        )}
        {!isLoading && hasMoreWallpapers && (
          <div className="mt-4 text-center">
            {loadError && <p role="alert" className="mb-2 text-sm text-red-700">تعذر تحميل المزيد من الخلفيات.</p>}
            <button
              type="button"
              onClick={() => void loadMoreWallpapers()}
              disabled={isLoadingMore}
              className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 disabled:opacity-50"
            >
              {loadError ? "إعادة المحاولة" : "تحميل المزيد"}
            </button>
          </div>
        )}
      </div>

      <MobileBottomNav activeTab="home" />
    </main>
  );
}
