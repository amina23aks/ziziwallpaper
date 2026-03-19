"use client";

import "swiper/css";
import "swiper/css/navigation";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, MessageCircle, Star } from "lucide-react";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { DeleteConfirmDialog } from "@/app/_components/delete-confirm-dialog";
import { ImageLightbox } from "@/app/_components/image-lightbox";
import { FeedbackSection } from "@/app/_components/feedback-section";
import { MobileBottomNav } from "@/app/_components/mobile-bottom-nav";
import { useAuth } from "@/app/_providers/auth-provider";
import { createWallpaperComment, listWallpaperComments } from "@/lib/firestore/comments";
import { getWallpaperById } from "@/lib/firestore/wallpapers";
import { useToggleFavorite } from "@/lib/hooks/use-favorites";
import { downloadImageFromUrl } from "@/lib/utils/download";
import type { WallpaperComment } from "@/types/comment";
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
  const router = useRouter();
  const { user, userProfile, isSignedIn } = useAuth();
  const [wallpaper, setWallpaper] = useState<Wallpaper | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [comments, setComments] = useState<WallpaperComment[]>([]);
  const [isCommentSaving, setIsCommentSaving] = useState(false);
  const [isFavoriteLoginDialogOpen, setIsFavoriteLoginDialogOpen] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);
  const { isFavorited, isLoading: isFavoriteLoading, isToggling, toggleFavorite } = useToggleFavorite(id, {
    onAuthRequired: () => setIsFavoriteLoginDialogOpen(true),
  });

  const loadComments = useCallback(async () => {
    if (!id) return;
    const data = await listWallpaperComments(id, 200);
    setComments(data);
  }, [id]);

  useEffect(() => {
    async function loadData() {
      try {
        const wallpaperData = await getWallpaperById(id);
        setWallpaper(wallpaperData);
        await loadComments();
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id, loadComments]);


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
    <main className="min-h-screen w-full bg-zinc-50 px-4 py-6 pb-24 pt-16 md:pr-24 md:pt-6">
      <header className="mb-4 flex items-center justify-start [direction:ltr]">
        <Link
          href="/"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-800"
          aria-label="رجوع"
        >
          ←
        </Link>
      </header>

      <article className="mx-auto w-full max-w-6xl rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4 lg:p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-start lg:[direction:ltr]">
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
            {hasMultipleImages ? (
              <>
                <button
                  type="button"
                  onClick={() => swiperRef.current?.slidePrev()}
                  disabled={!canGoPrev}
                  className="absolute left-3 top-1/2 z-20 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="السابق"
                >
                  <ArrowLeftIcon />
                </button>
                <button
                  type="button"
                  onClick={() => swiperRef.current?.slideNext()}
                  disabled={!canGoNext}
                  className="absolute right-3 top-1/2 z-20 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="التالي"
                >
                  <ArrowRightIcon />
                </button>
                <Swiper
                  modules={[Navigation]}
                  className="overflow-hidden"
                  dir="ltr"
                  onSwiper={(swiper) => {
                    swiperRef.current = swiper;
                  }}
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
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-lg font-bold text-zinc-900">{wallpaper.title}</h1>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleFavorite}
                  disabled={isFavoriteLoading || isToggling}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={isFavorited ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                >
                  <Star
                    size={16}
                    className={isFavorited ? "fill-yellow-400 text-yellow-400" : "text-zinc-600"}
                  />
                </button>
                <a
                  href="#comments"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700"
                  aria-label="الآراء"
                >
                  <MessageCircle size={16} />
                </a>
                <button
                  type="button"
                  onClick={async () => {
                    const imageUrl = wallpaper.images?.[activeImageIndex]?.secureUrl || wallpaper.images?.[0]?.secureUrl;
                    if (!imageUrl) return;
                    await downloadImageFromUrl({
                      imageUrl,
                      filename: `${(wallpaper.title || "wallpaper").replace(/\s+/g, "-")}.jpg`,
                    });
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700"
                  aria-label="تنزيل الصورة"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>

            {formattedDescription ? (
              <p className="whitespace-pre-line text-right text-sm leading-7 text-zinc-700">
                {formattedDescription}
              </p>
            ) : (
              <p className="text-sm text-zinc-500">لا يوجد وصف لهذه الخلفية.</p>
            )}

            <FeedbackSection
              comments={comments}
              isSignedIn={isSignedIn}
              currentUserName={userProfile?.displayName?.trim() || "مستخدم"}
              onLogin={() => router.push("/login")}
              isSaving={isCommentSaving}
              onSubmitFeedback={async (value, isAnonymous) => {
                if (!user || !id || !value.trim()) return;
                setIsCommentSaving(true);
                try {
                  await createWallpaperComment({
                    wallpaperId: id,
                    userId: user.uid,
                    userDisplayName: userProfile?.displayName?.trim() || "مستخدم",
                    isAnonymous,
                    content: value,
                  });
                  await loadComments();
                } finally {
                  setIsCommentSaving(false);
                }
              }}
              onSubmitReply={async (parentId, value, isAnonymous) => {
                if (!user || !id || !value.trim()) return;
                setIsCommentSaving(true);
                try {
                  await createWallpaperComment({
                    wallpaperId: id,
                    userId: user.uid,
                    userDisplayName: userProfile?.displayName?.trim() || "مستخدم",
                    isAnonymous,
                    content: value,
                    parentId,
                    isAdminReply: userProfile?.role === "admin",
                  });
                  await loadComments();
                } finally {
                  setIsCommentSaving(false);
                }
              }}
            />
          </section>
        </div>
      </article>

      <MobileBottomNav activeTab="home" />

      <DeleteConfirmDialog
        isOpen={isFavoriteLoginDialogOpen}
        title="تسجيل الدخول مطلوب"
        description="لحفظ الخلفيات في المفضلة، يرجى تسجيل الدخول أولاً."
        cancelText="إغلاق"
        confirmText="تسجيل الدخول"
        onCancel={() => setIsFavoriteLoginDialogOpen(false)}
        onConfirm={() => router.push("/login")}
      />

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
