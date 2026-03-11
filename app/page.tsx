"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { listPublishedWallpapers } from "@/lib/firestore/wallpapers";
import type { Wallpaper } from "@/types/wallpaper";

const DEFAULT_CHIPS = ["الكل", "طبيعة", "هادئة", "داكنة", "مكتب", "مينيمل"];

export default function HomePage() {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChip, setSelectedChip] = useState("الكل");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadWallpapers() {
      try {
        const data = await listPublishedWallpapers(18);
        setWallpapers(data);
      } finally {
        setIsLoading(false);
      }
    }

    loadWallpapers();
  }, []);

  const visibleWallpapers = useMemo(() => {
    return wallpapers.filter((wallpaper) => {
      const query = searchQuery.trim().toLowerCase();

      const matchesSearch =
        query.length === 0 ||
        wallpaper.title.toLowerCase().includes(query) ||
        wallpaper.searchKeywords?.some((item) => item.toLowerCase().includes(query));

      const matchesChip =
        selectedChip === "الكل" ||
        wallpaper.categorySlugs?.some((item) => item.toLowerCase().includes(selectedChip.toLowerCase()));

      return matchesSearch && matchesChip;
    });
  }, [wallpapers, searchQuery, selectedChip]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-zinc-50 pb-24 sm:max-w-2xl lg:max-w-5xl lg:px-6">
      <div className="space-y-4 px-4 py-5 sm:px-6">
        <header className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-zinc-600">ZIZI WALLPAPER</p>
            <h1 className="text-xl font-extrabold text-zinc-900">خلفياتك اليومية</h1>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-lg font-bold text-zinc-800 shadow-sm"
          >
            ؟
          </button>
        </header>

        <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="ابحث عن خلفية مناسبة لمزاجك"
            className="w-full bg-transparent text-sm font-medium text-zinc-900 placeholder:text-zinc-500 outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {DEFAULT_CHIPS.map((chip) => {
            const isActive = selectedChip === chip;

            return (
              <button
                key={chip}
                type="button"
                onClick={() => setSelectedChip(chip)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-300 bg-white text-zinc-800"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <p className="text-sm text-zinc-600">جاري تحميل الخلفيات...</p>
        ) : visibleWallpapers.length === 0 ? (
          <p className="rounded-2xl border border-zinc-200 bg-white px-4 py-6 text-center text-sm text-zinc-600">
            لم نجد نتائج مطابقة حالياً.
          </p>
        ) : (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visibleWallpapers.map((wallpaper, index) => (
              <article
                key={wallpaper.id ?? index}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
              >
                <div className="relative aspect-[3/4] bg-zinc-100">
                  {wallpaper.images?.[0]?.secureUrl ? (
                    <Image
                      src={wallpaper.images[0].secureUrl}
                      alt={wallpaper.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="space-y-1 p-2.5">
                  <p className="line-clamp-1 text-sm font-semibold text-zinc-900">{wallpaper.title}</p>
                  <p className="line-clamp-1 text-xs text-zinc-600">
                    {wallpaper.categorySlugs?.[0] || "تصنيف عام"}
                  </p>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      <nav className="fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-md items-center justify-around border-t border-zinc-200 bg-white px-4 py-3 sm:max-w-2xl lg:max-w-5xl">
        <button type="button" className="text-sm font-bold text-zinc-900">
          الرئيسية
        </button>
        <button type="button" className="text-sm font-semibold text-zinc-600">
          المفضلة
        </button>
        <button type="button" className="text-sm font-semibold text-zinc-600">
          الحساب
        </button>
      </nav>
    </main>
  );
}
