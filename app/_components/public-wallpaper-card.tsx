"use client";

import Image from "next/image";
import Link from "next/link";
import { type MouseEvent, useState } from "react";
import type { Wallpaper } from "@/types/wallpaper";

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PublicWallpaperCard({
  wallpaper,
  titleClassName = "line-clamp-1 text-sm font-semibold text-zinc-900",
  imageAspectClassName = "aspect-[3/4]",
}: {
  wallpaper: Wallpaper;
  titleClassName?: string;
  imageAspectClassName?: string;
}) {
  const images = wallpaper.images ?? [];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const hasMultipleImages = images.length > 1;

  const currentImage = images[activeImageIndex] ?? images[0];
  const canGoPrev = hasMultipleImages && activeImageIndex > 0;
  const canGoNext = hasMultipleImages && activeImageIndex < images.length - 1;

  const goNext = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!canGoNext) return;
    setActiveImageIndex((prev) => prev + 1);
  };

  const goPrev = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!canGoPrev) return;
    setActiveImageIndex((prev) => prev - 1);
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="relative">
        {canGoPrev && (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
            aria-label="الصورة السابقة"
          >
            <ChevronLeftIcon />
          </button>
        )}

        {canGoNext && (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
            aria-label="الصورة التالية"
          >
            <ChevronRightIcon />
          </button>
        )}

        <Link href={wallpaper.id ? `/wallpaper/${wallpaper.id}` : "#"} className="block">
          <div className={`relative w-full ${imageAspectClassName} bg-zinc-100`}>
            {currentImage?.secureUrl && (
              <Image
                src={currentImage.secureUrl}
                alt={currentImage.alt || wallpaper.title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 50vw, 25vw"
                unoptimized
              />
            )}
          </div>
          <div className="px-2.5 py-2">
            <p className={titleClassName}>{wallpaper.title}</p>
          </div>
        </Link>
      </div>
    </article>
  );
}
