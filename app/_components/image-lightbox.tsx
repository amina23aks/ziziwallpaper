"use client";

import Image from "next/image";
import { type KeyboardEvent, useEffect, useState } from "react";
import { getCloudinaryImageUrl } from "@/lib/cloudinary/delivery";
import type { WallpaperImage } from "@/types/wallpaper";

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ImageLightbox({
  images,
  initialIndex = 0,
  onClose,
  title,
}: {
  images: WallpaperImage[];
  initialIndex?: number;
  onClose: () => void;
  title?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && activeIndex < images.length - 1) {
        setActiveIndex((prev) => prev + 1);
      }
      if (event.key === "ArrowLeft" && activeIndex > 0) {
        setActiveIndex((prev) => prev - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, images.length, onClose]);

  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < images.length - 1;

  const handleOverlayKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6"
      onClick={onClose}
      onKeyDown={handleOverlayKey}
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "عرض الصورة"}
    >
      <div className="relative w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
          aria-label="إغلاق"
        >
          ×
        </button>

        {canGoPrev && (
          <button
            type="button"
            onClick={() => setActiveIndex((prev) => prev - 1)}
            className="absolute left-2 top-1/2 z-20 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"
            aria-label="السابق"
          >
            <ChevronLeftIcon />
          </button>
        )}

        {canGoNext && (
          <button
            type="button"
            onClick={() => setActiveIndex((prev) => prev + 1)}
            className="absolute right-2 top-1/2 z-20 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"
            aria-label="التالي"
          >
            <ChevronRightIcon />
          </button>
        )}

        <div className="relative mx-auto aspect-[4/5] max-h-[90vh] w-full overflow-hidden rounded-2xl bg-zinc-900">
          {images[activeIndex]?.secureUrl && (
            <Image
              src={getCloudinaryImageUrl(images[activeIndex].secureUrl, "detailMain")}
              alt={images[activeIndex].alt || title || "Wallpaper"}
              fill
              className="object-contain"
              sizes="100vw"
            />
          )}
        </div>
      </div>
    </div>
  );
}
