"use client";

import "swiper/css";
import "swiper/css/navigation";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { getWallpaperById } from "@/lib/firestore/wallpapers";
import { listCategories } from "@/lib/firestore/categories";
import type { Category } from "@/types/category";
import type { Wallpaper } from "@/types/wallpaper";

export default function WallpaperDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [wallpaper, setWallpaper] = useState<Wallpaper | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [wallpaperData, categoriesData] = await Promise.all([
          getWallpaperById(id),
          listCategories(100),
        ]);
        setWallpaper(wallpaperData);
        setCategories(categoriesData);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

  const categoryNames = useMemo(() => {
    if (!wallpaper?.categorySlugs?.length) return [];

    return wallpaper.categorySlugs
      .map((slug) => categories.find((category) => category.slug === slug)?.nameAr ?? slug)
      .filter(Boolean);
  }, [categories, wallpaper]);

  if (isLoading) {
    return <main className="px-4 py-8 text-sm text-zinc-600">جاري تحميل الخلفية...</main>;
  }

  if (!wallpaper) {
    return <main className="px-4 py-8 text-sm text-zinc-600">لم يتم العثور على الخلفية المطلوبة.</main>;
  }

  const hasMultipleImages = (wallpaper.images?.length ?? 0) > 1;
  const formattedDescription = wallpaper.description?.trim();

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl bg-zinc-50 px-4 py-6 sm:px-6">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-zinc-900 sm:text-2xl">{wallpaper.title}</h1>
        <Link href="/" className="text-sm font-semibold text-zinc-800 hover:underline">
          العودة للرئيسية
        </Link>
      </header>

      <article className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="relative px-0 sm:px-10">
          {hasMultipleImages ? (
            <>
              <button
                type="button"
                className="wallpaper-prev absolute left-3 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-sm font-bold text-white backdrop-blur-sm"
                aria-label="السابق"
              >
                {"<"}
              </button>
              <button
                type="button"
                className="wallpaper-next absolute right-3 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-sm font-bold text-white backdrop-blur-sm"
                aria-label="التالي"
              >
                {">"}
              </button>
              <Swiper
                modules={[Navigation]}
                navigation={{
                  prevEl: ".wallpaper-prev",
                  nextEl: ".wallpaper-next",
                }}
                className="overflow-hidden rounded-2xl" dir="ltr"
              >
                {wallpaper.images.map((image, index) => (
                  <SwiperSlide key={`${image.secureUrl}-${index}`}>
                    <div className="relative aspect-[4/5] bg-zinc-100">
                      <Image
                        src={image.secureUrl}
                        alt={image.alt || wallpaper.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 680px"
                        unoptimized
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </>
          ) : (
            <div className="relative overflow-hidden rounded-2xl bg-zinc-100">
              <div className="relative aspect-[4/5]">
                {wallpaper.images?.[0]?.secureUrl && (
                  <Image
                    src={wallpaper.images[0].secureUrl}
                    alt={wallpaper.images[0].alt || wallpaper.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 680px"
                    unoptimized
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {formattedDescription && (
          <p className="whitespace-pre-line text-right text-sm leading-7 text-zinc-700">{formattedDescription}</p>
        )}

        {categoryNames.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categoryNames.map((name) => (
              <span
                key={name}
                className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-800"
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </article>
    </main>
  );
}
