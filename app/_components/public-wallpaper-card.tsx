"use client";

import Image from "next/image";
import Link from "next/link";
import { MoreHorizontal, Star } from "lucide-react";
import { type MouseEvent, useState } from "react";
import { useToggleFavorite } from "@/lib/hooks/use-favorites";
import { downloadImageFromUrl } from "@/lib/utils/download";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hasMultipleImages = images.length > 1;
  const wallpaperHref = wallpaper.id ? `/wallpaper/${wallpaper.id}` : "#";
  const { isFavorited, isLoading, isToggling, toggleFavorite } = useToggleFavorite(wallpaper.id);

  const currentImage = images[activeImageIndex] ?? images[0];
  const imageUrl = currentImage?.secureUrl || images[0]?.secureUrl;
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

  const onToggleFavorite = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsMenuOpen(false);
    toggleFavorite();
  };

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
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

        <button
          type="button"
          onClick={onToggleFavorite}
          disabled={isLoading || isToggling}
          className="pointer-events-none absolute right-2 top-2 z-20 hidden h-8 w-8 items-center justify-center rounded-full bg-white/85 text-zinc-700 opacity-0 shadow transition md:flex md:group-hover:pointer-events-auto md:group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={isFavorited ? "إلغاء الحفظ" : "حفظ"}
        >
          <Star size={15} className={isFavorited ? "fill-yellow-400 text-yellow-400" : "text-zinc-700"} />
        </button>

        <Link href={wallpaperHref} className="block">
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
          <div className="px-2.5 py-1.5">
            <p className={titleClassName}>{wallpaper.title}</p>
          </div>
        </Link>
      </div>

      <div className="absolute bottom-2 left-2 z-30">
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsMenuOpen((prev) => !prev);
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white"
          aria-label="المزيد"
        >
          <MoreHorizontal size={15} />
        </button>

        {isMenuOpen && (
          <div className="absolute bottom-10 left-0 w-36 rounded-xl border border-zinc-200 bg-white p-1 text-xs shadow-lg">
            <button
              type="button"
              onClick={onToggleFavorite}
              className="flex w-full items-center rounded-lg px-2 py-1.5 text-right text-zinc-800 hover:bg-zinc-100"
            >
              {isFavorited ? "إلغاء الحفظ" : "حفظ"}
            </button>
            <Link
              href={wallpaperHref}
              className="flex w-full items-center rounded-lg px-2 py-1.5 text-zinc-800 hover:bg-zinc-100"
              onClick={() => setIsMenuOpen(false)}
            >
              فتح الخلفية
            </Link>
            <button
              type="button"
              className="flex w-full items-center rounded-lg px-2 py-1.5 text-zinc-800 hover:bg-zinc-100"
              onClick={async (event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsMenuOpen(false);
                if (!imageUrl) return;
                await downloadImageFromUrl({
                  imageUrl,
                  filename: `${(wallpaper.title || "wallpaper").replace(/\s+/g, "-")}.jpg`,
                });
              }}
            >
              تنزيل الصورة
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
