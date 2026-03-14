"use client";

import Image from "next/image";
import Link from "next/link";
import { type MouseEvent, useState } from "react";
import type { Wallpaper } from "@/types/wallpaper";

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

  const goNext = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!hasMultipleImages) return;
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const goPrev = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!hasMultipleImages) return;
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <article className="overflow-visible rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="relative px-0 sm:px-6">
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-0 top-1/2 z-10 hidden h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white inline-flex"
              aria-label="الصورة السابقة"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-0 top-1/2 z-10 hidden h-8 w-8 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white inline-flex"
              aria-label="الصورة التالية"
            >
              ›
            </button>
          </>
        )}

        <Link href={wallpaper.id ? `/wallpaper/${wallpaper.id}` : "#"} className="block overflow-hidden rounded-t-2xl sm:rounded-2xl">
          <div className={`relative ${imageAspectClassName} bg-zinc-100`}>
            {currentImage?.secureUrl && (
              <Image
                src={currentImage.secureUrl}
                alt={currentImage.alt || wallpaper.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
                unoptimized
              />
            )}
          </div>
        </Link>
      </div>

      <div className="p-2.5">
        <Link href={wallpaper.id ? `/wallpaper/${wallpaper.id}` : "#"}>
          <p className={titleClassName}>{wallpaper.title}</p>
        </Link>
      </div>
    </article>
  );
}
