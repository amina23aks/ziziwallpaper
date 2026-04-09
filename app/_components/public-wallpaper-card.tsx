"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, MessageCircle, MoreHorizontal, Star } from "lucide-react";
import { type MouseEvent, useEffect, useMemo, useState } from "react";
import { DeleteConfirmDialog } from "@/app/_components/delete-confirm-dialog";
import { getCloudinaryImageUrl } from "@/lib/cloudinary/delivery";
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
  imageAspectClassName = "",
}: {
  wallpaper: Wallpaper;
  titleClassName?: string;
  imageAspectClassName?: string;
}) {
  const images = useMemo(() => wallpaper.images ?? [], [wallpaper.images]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stableRatio, setStableRatio] = useState<number | null>(null);
  const [isFavoriteLoginDialogOpen, setIsFavoriteLoginDialogOpen] = useState(false);
  const hasMultipleImages = images.length > 1;
  const wallpaperHref = wallpaper.id ? `/wallpaper/${wallpaper.id}` : "#";
  const { isFavorited, isLoading, isToggling, toggleFavorite } = useToggleFavorite(wallpaper.id, {
    onAuthRequired: () => setIsFavoriteLoginDialogOpen(true),
  });

  const currentImage = images[activeImageIndex] ?? images[0];
  const imageUrl = currentImage?.secureUrl || images[0]?.secureUrl;
  const canGoPrev = hasMultipleImages && activeImageIndex > 0;
  const canGoNext = hasMultipleImages && activeImageIndex < images.length - 1;

  useEffect(() => {
    let cancelled = false;

    async function resolveStableRatio() {
      if (images.length === 0 || imageAspectClassName) {
        setStableRatio(null);
        return;
      }

      const ratios = await Promise.all(
        images.map(
          (image) =>
            new Promise<number>((resolve) => {
              const img = new window.Image();
              img.onload = () => {
                if (!img.naturalWidth || !img.naturalHeight) {
                  resolve(4 / 3);
                  return;
                }
                resolve(img.naturalHeight / img.naturalWidth);
              };
              img.onerror = () => resolve(4 / 3);
              img.src = getCloudinaryImageUrl(image.secureUrl, "feedCard");
            })
        )
      );

      if (cancelled) return;

      const tallestRatio = Math.max(...ratios);
      const clamped = Math.min(1.9, Math.max(0.6, tallestRatio));
      setStableRatio(clamped);
    }

    resolveStableRatio();

    return () => {
      cancelled = true;
    };
  }, [images, imageAspectClassName]);

  const mediaStyle = useMemo(() => {
    if (imageAspectClassName) return undefined;
    const ratio = stableRatio ?? 1.2;
    return { aspectRatio: `${1 / ratio}` };
  }, [imageAspectClassName, stableRatio]);

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

  const onToggleFavorite = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsMenuOpen(false);
    await toggleFavorite();
  };

  const hasTitle = Boolean(wallpaper.title?.trim());

  return (
    <>
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
            aria-label={isFavorited ? "إلغاء المفضلة" : "إضافة للمفضلة"}
          >
            <Star size={15} className={isFavorited ? "fill-yellow-400 text-yellow-400" : "text-black dark:text-black"} />
          </button>

          <Link href={wallpaperHref} className="block">
            <div className={`relative w-full overflow-hidden bg-zinc-100/80 ${imageAspectClassName}`} style={mediaStyle}>
              {currentImage?.secureUrl && (
                <Image
                  src={getCloudinaryImageUrl(currentImage.secureUrl, "feedCard")}
                  alt={currentImage.alt || wallpaper.title || ""}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              )}
            </div>
          </Link>
        </div>

        <div className="relative flex min-h-10 items-center justify-between gap-2 px-2.5 py-1.5 [direction:ltr]">
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIsMenuOpen((prev) => !prev);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-800"
                aria-label="المزيد"
              >
                <MoreHorizontal size={18} />
              </button>

              {isMenuOpen && (
                <div className="absolute bottom-10 left-0 z-30 w-44 rounded-xl border border-zinc-200 bg-white p-1 text-xs shadow-lg [direction:rtl]">
                  <button
                    type="button"
                    onClick={onToggleFavorite}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-zinc-800 hover:bg-zinc-100"
                  >
                    <Star size={14} className={isFavorited ? "fill-yellow-400 text-yellow-400" : "text-zinc-700"} />
                    <span>مفضلة</span>
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-zinc-800 hover:bg-zinc-100"
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
                    <Download size={14} />
                    <span>تنزيل الصورة</span>
                  </button>
                </div>
              )}
            </div>

            <Link
              href={`${wallpaperHref}#comments`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-700"
              aria-label="الآراء"
            >
              <MessageCircle size={17} />
            </Link>
          </div>

          {hasTitle ? (
            <Link href={wallpaperHref} className="min-w-0 flex-1 text-right [direction:rtl]">
              <p className={titleClassName}>{wallpaper.title}</p>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </article>

      <DeleteConfirmDialog
        isOpen={isFavoriteLoginDialogOpen}
        title="تسجيل الدخول مطلوب"
        description="لحفظ الخلفيات في المفضلة، يرجى تسجيل الدخول أولاً."
        cancelText="إغلاق"
        confirmText="تسجيل الدخول"
        onCancel={() => setIsFavoriteLoginDialogOpen(false)}
        onConfirm={() => {
          window.location.href = "/login";
        }}
      />
    </>
  );
}
