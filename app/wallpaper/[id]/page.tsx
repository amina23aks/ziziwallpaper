"use client";

import "swiper/css";
import "swiper/css/navigation";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ImageLightbox } from "@/app/_components/image-lightbox";
import { getWallpaperById } from "@/lib/firestore/wallpapers";
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
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const wallpaperData = await getWallpaperById(id);
        setWallpaper(wallpaperData);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

  if (isLoading) {
    return <main className="px-4 py-8 text-sm text-zinc-600">جاري تحميل الخلفية...</main>;
  }

  if (!wallpaper) {
    return <main className="px-4 py-8 text-sm text-zinc-600">لم يتم العثور على الخلفية المطلوبة.</main>;
  }

  const hasMultipleImages = (wallpaper.images?.length ?? 0) > 1;
  const imageCount = wallpaper.images?.length ?? 0;
  const canGoPrev = hasMultipleImages && activeImageIndex > 0;
  const canGoNext = hasMultipleImages && activeImageIndex < imageCount - 1;
  const formattedDescription = wallpaper.description?.trim();

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl bg-zinc-50 px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-4 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-zinc-800 hover:underline">
          العودة للرئيسية
        </Link>
      </header>

      <article className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4 lg:p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-start lg:[direction:ltr]">
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
            {hasMultipleImages ? (
              <>
                {canGoPrev && (<button
                  type="button"
                  className="wallpaper-prev absolute left-3 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
                  aria-label="السابق"
                >
                  <ArrowLeftIcon />
                </button>)}
                {canGoNext && (<button
                  type="button"
                  className="wallpaper-next absolute right-3 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
                  aria-label="التالي"
                >
                  <ArrowRightIcon />
                </button>)}
                <Swiper
                  modules={[Navigation]}
                  navigation={{
                    prevEl: ".wallpaper-prev",
                    nextEl: ".wallpaper-next",
                  }}
                  className="overflow-hidden"
                  dir="ltr"
                  onSlideChange={(swiper) => setActiveImageIndex(swiper.activeIndex)}
                >
                  {wallpaper.images.map((image, index) => (
                    <SwiperSlide key={`${image.secureUrl}-${index}`}>
                      <button
                        type="button"
                        onClick={() => setIsLightboxOpen(true)}
                        className="relative block aspect-[4/5] max-h-[72vh] w-full"
                      >
                        <Image
                          src={image.secureUrl}
                          alt={image.alt || wallpaper.title}
                          fill
                          className="object-contain"
                          sizes="(max-width: 1024px) 100vw, 54vw"
                          unoptimized
                        />
                      </button>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="relative block aspect-[4/5] max-h-[72vh] w-full"
              >
                {wallpaper.images?.[0]?.secureUrl && (
                  <Image
                    src={wallpaper.images[0].secureUrl}
                    alt={wallpaper.images[0].alt || wallpaper.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 54vw"
                    unoptimized
                  />
                )}
              </button>
            )}
          </div>

          <section className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 sm:p-5 [direction:rtl]">
            <h1 className="text-lg font-bold text-zinc-900">{wallpaper.title}</h1>

            {formattedDescription ? (
              <p className="whitespace-pre-line text-right text-sm leading-7 text-zinc-700">
                {formattedDescription}
              </p>
            ) : (
              <p className="text-sm text-zinc-500">لا يوجد وصف لهذه الخلفية.</p>
            )}

            <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-3 py-4 text-xs text-zinc-500">
              مساحة مخصصة للتعليقات قريباً.
            </div>
          </section>
        </div>
      </article>

      {isLightboxOpen && wallpaper.images?.length > 0 && (
        <ImageLightbox
          images={wallpaper.images}
          initialIndex={activeImageIndex}
          onClose={() => setIsLightboxOpen(false)}
          title={wallpaper.title}
        />
      )}
    </main>
  );
}
