"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { listActiveCategories } from "@/lib/firestore/categories";
import { listPublishedWallpapers } from "@/lib/firestore/wallpapers";
import type { Category } from "@/types/category";
import type { Wallpaper } from "@/types/wallpaper";

export default function HomePage() {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [publishedWallpapers, activeCategories] = await Promise.all([
          listPublishedWallpapers(40),
          listActiveCategories(30),
        ]);
        setWallpapers(publishedWallpapers);
        setCategories(activeCategories);
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
    <main className="mx-auto min-h-screen w-full max-w-md bg-zinc-50 pb-24 sm:max-w-2xl lg:max-w-5xl">
      <div className="space-y-4 px-4 py-5 sm:px-6">
        <header className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-zinc-600">ZIZI</p>
            <h1 className="text-xl font-extrabold text-zinc-900">Wallpapers</h1>
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
          <section className="columns-2 gap-3 sm:columns-3">
            {filteredWallpapers.map((wallpaper, index) => (
              <article
                key={wallpaper.id ?? index}
                className="mb-3 break-inside-avoid overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
              >
                <div className={`relative ${index % 3 === 0 ? "aspect-[3/5]" : "aspect-[3/4]"} bg-zinc-100`}>
                  {wallpaper.images?.[0]?.secureUrl && (
                    <Image
                      src={wallpaper.images[0].secureUrl}
                      alt={wallpaper.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 33vw"
                      unoptimized
                    />
                  )}
                </div>
                <div className="p-2.5">
                  <p className="line-clamp-1 text-sm font-semibold text-zinc-900">{wallpaper.title}</p>
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
