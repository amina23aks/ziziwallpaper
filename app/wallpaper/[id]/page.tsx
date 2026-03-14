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

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
    <main className="mx-auto min-h-screen w-full max-w-6xl bg-zinc-50 px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-zinc-900 sm:text-2xl">{wallpaper.title}</h1>
        <Link href="/" className="text-sm font-semibold text-zinc-800 hover:underline">
          العودة للرئيسية
        </Link>
      </header>

      <article className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4 lg:p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] lg:items-start">
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
            {hasMultipleImages ? (
              <>
                <button
                  type="button"
                  className="wallpaper-prev absolute left-3 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
                  aria-label="السابق"
                >
                  <ArrowLeftIcon />
                </button>
                <button
                  type="button"
                  className="wallpaper-next absolute right-3 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
                  aria-label="التالي"
                >
                  <ArrowRightIcon />
                </button>
                <Swiper
                  modules={[Navigation]}
                  navigation={{
                    prevEl: ".wallpaper-prev",
                    nextEl: ".wallpaper-next",
                  }}
                  className="overflow-hidden"
                  dir="ltr"
                >
                  {wallpaper.images.map((image, index) => (
                    <SwiperSlide key={`${image.secureUrl}-${index}`}>
                      <div className="relative aspect-[4/5] max-h-[70vh] w-full">
                        <Image
                          src={image.secureUrl}
                          alt={image.alt || wallpaper.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 54vw"
                          unoptimized
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </>
            ) : (
              <div className="relative aspect-[4/5] max-h-[70vh] w-full">
                {wallpaper.images?.[0]?.secureUrl && (
                  <Image
                    src={wallpaper.images[0].secureUrl}
                    alt={wallpaper.images[0].alt || wallpaper.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 54vw"
                    unoptimized
                  />
                )}
              </div>
            )}
          </div>

          <section className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 sm:p-5">
            <h2 className="text-lg font-bold text-zinc-900">{wallpaper.title}</h2>

            {formattedDescription ? (
              <p className="whitespace-pre-line text-right text-sm leading-7 text-zinc-700">
                {formattedDescription}
              </p>
            ) : (
              <p className="text-sm text-zinc-500">لا يوجد وصف لهذه الخلفية.</p>
            )}

            {categoryNames.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categoryNames.map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold text-zinc-800"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-3 py-4 text-xs text-zinc-500">
              مساحة مخصصة للتعليقات قريباً.
            </div>
          </section>
        </div>
      </article>
    </main>
  );
}
