"use client";

import "swiper/css";
import "swiper/css/navigation";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, Star } from "lucide-react";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { DeleteConfirmDialog } from "@/app/_components/delete-confirm-dialog";
import { ImageLightbox } from "@/app/_components/image-lightbox";
import { FeedbackSection } from "@/app/_components/feedback-section";
import { PublicWallpaperCard } from "@/app/_components/public-wallpaper-card";
import { MobileBottomNav } from "@/app/_components/mobile-bottom-nav";
import { useAuth } from "@/app/_providers/auth-provider";
import { useTheme } from "@/app/_providers/theme-provider";
import { isAdminRole } from "@/lib/auth/roles";
import {
  createWallpaperComment,
  deleteWallpaperComment,
  listWallpaperComments,
  toClientTimestamp,
  updateWallpaperComment,
} from "@/lib/firestore/comments";
import {
  getPublishedWallpaperById,
  listPublishedWallpapersByCategory,
} from "@/lib/firestore/wallpapers";
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
  const { isDark } = useTheme();
  const [wallpaper, setWallpaper] = useState<Wallpaper | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [comments, setComments] = useState<WallpaperComment[]>([]);
  const [suggestedWallpapers, setSuggestedWallpapers] = useState<Wallpaper[]>([]);
  const [isCommentSaving, setIsCommentSaving] = useState(false);
  const [isFavoriteLoginDialogOpen, setIsFavoriteLoginDialogOpen] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);
  const isAdmin = isAdminRole(userProfile);
  const { isFavorited, isLoading: isFavoriteLoading, isToggling, toggleFavorite } = useToggleFavorite(id, {
    onAuthRequired: () => setIsFavoriteLoginDialogOpen(true),
  });

  useEffect(() => {
    async function loadData() {
      try {
        const wallpaperData = await getPublishedWallpaperById(id);
        setWallpaper(wallpaperData);

        if (wallpaperData?.categorySlugs?.[0]) {
          const related = await listPublishedWallpapersByCategory(wallpaperData.categorySlugs[0], 8);
          setSuggestedWallpapers(related.filter((item) => item.id !== wallpaperData.id).slice(0, 4));
        } else {
          setSuggestedWallpapers([]);
        }

        if (wallpaperData?.id) {
          setComments(await listWallpaperComments(wallpaperData.id, 200));
        } else {
          setComments([]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

  const appendComment = useCallback((input: WallpaperComment) => {
    setComments((prev) =>
      [...prev, input].sort((left, right) => {
        const leftSeconds = (left.createdAt as { seconds?: number } | null | undefined)?.seconds ?? 0;
        const rightSeconds = (right.createdAt as { seconds?: number } | null | undefined)?.seconds ?? 0;

        if (leftSeconds !== rightSeconds) {
          return leftSeconds - rightSeconds;
        }

        return (left.id ?? "").localeCompare(right.id ?? "");
      })
    );
  }, []);

  const updateCommentInState = useCallback((commentId: string, updater: (item: WallpaperComment) => WallpaperComment) => {
    setComments((prev) => prev.map((item) => (item.id === commentId ? updater(item) : item)));
  }, []);

  const removeCommentTree = useCallback((commentId: string, replyIds: string[] = []) => {
    const idsToRemove = new Set([commentId, ...replyIds]);
    setComments((prev) => prev.filter((item) => !item.id || !idsToRemove.has(item.id)));
  }, []);


  if (isLoading) {
    return <main className="overflow-x-hidden px-4 py-8 text-sm text-zinc-600 dark:text-zinc-300">جاري تحميل الخلفية...</main>;
  }

  if (!wallpaper) {
    return <main className="overflow-x-hidden px-4 py-8 text-sm text-zinc-600 dark:text-zinc-300">لم يتم العثور على الخلفية المطلوبة.</main>;
  }

  const hasMultipleImages = (wallpaper.images?.length ?? 0) > 1;
  const imageCount = wallpaper.images?.length ?? 0;
  const displayTitle = wallpaper.title?.trim() || "خلفية بدون عنوان";
  const canGoPrev = hasMultipleImages && activeImageIndex > 0;
  const canGoNext = hasMultipleImages && activeImageIndex < imageCount - 1;
  const formattedDescription = wallpaper.description?.trim();
  const actionButtonClass = isDark
    ? "inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-200"
    : "inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700";

  return (
    <main className={`min-h-screen w-full overflow-x-hidden px-4 py-6 pb-24 pt-16 md:pr-20 md:pt-6 ${isDark ? "bg-[var(--app-bg)]" : "bg-[#f3f3f5]"}`}>
      <div className="h-14 md:hidden" />

      <header className={`fixed inset-x-0 top-0 z-40 border-b px-4 py-2 md:hidden ${isDark ? "border-[color:var(--app-border)] bg-[var(--app-bg)]" : "border-[#d4d4d8] bg-[#f3f3f5]"}`}>
        <div className="flex min-h-10 items-center justify-start [direction:ltr]">
          <Link
            href="/"
            className={`inline-flex items-center justify-center px-1 leading-none transition focus-visible:outline-none focus-visible:ring-2 ${
              isDark
                ? "text-xl text-zinc-300 hover:text-white focus-visible:ring-zinc-600"
                : "text-2xl text-black hover:text-zinc-900 focus-visible:ring-zinc-400/40"
            }`}
            aria-label="رجوع"
          >
            ←
          </Link>
        </div>
      </header>

      <header className={`mb-4 hidden items-center justify-start py-2 backdrop-blur [direction:ltr] md:sticky md:top-0 md:z-30 md:flex ${isDark ? "bg-[var(--app-bg)]/95" : "bg-[#f3f3f5]/95"}`}>
        <Link
          href="/"
          className={`inline-flex items-center justify-center px-1 leading-none transition focus-visible:outline-none focus-visible:ring-2 ${
            isDark
              ? "text-xl text-zinc-300 hover:text-white focus-visible:ring-zinc-600"
              : "text-2xl text-black hover:text-zinc-900 focus-visible:ring-zinc-400/40"
          }`}
          aria-label="رجوع"
        >
          ←
        </Link>
      </header>

      <article className={`mx-auto w-full max-w-6xl overflow-visible rounded-2xl border p-3 shadow-sm sm:p-4 lg:max-w-[88rem] lg:p-5 ${isDark ? "border-zinc-800 bg-zinc-900" : "border-[#d4d4d8] bg-[#f8f8fa]"}`}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-start lg:[direction:ltr]">
          <div className={`relative overflow-hidden rounded-2xl border ${isDark ? "border-zinc-800 bg-zinc-950" : "border-[#d4d4d8] bg-[#e7e7eb]"}`}>
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
                          alt={image.alt || displayTitle}
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
                    alt={wallpaper.images[0].alt || displayTitle}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 54vw"
                    unoptimized
                  />
                )}
              </button>
            )}
          </div>

          <section className={`space-y-4 rounded-2xl border p-4 sm:p-5 [direction:rtl] ${isDark ? "border-zinc-800 bg-zinc-950/60" : "border-[#d4d4d8] bg-[#f1f1f3]"}`}>
            <div className="flex min-w-0 items-center justify-between gap-3">
              <h1
                className="min-w-0 flex-1 break-words text-lg font-bold text-black dark:text-zinc-100"
                style={{ color: isDark ? undefined : "#000000" }}
              >
                {displayTitle}
              </h1>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={toggleFavorite}
                  disabled={isFavoriteLoading || isToggling}
                  className={`${actionButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}
                  aria-label={isFavorited ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                >
                  <Star size={16} className={isFavorited ? "fill-yellow-400 text-yellow-400" : "text-black [stroke-width:2.2] dark:text-zinc-300"} />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const imageUrl = wallpaper.images?.[activeImageIndex]?.secureUrl || wallpaper.images?.[0]?.secureUrl;
                    if (!imageUrl) return;
                    await downloadImageFromUrl({
                      imageUrl,
                      filename: `${displayTitle.replace(/\s+/g, "-")}.jpg`,
                    });
                  }}
                  className={actionButtonClass}
                  aria-label="تنزيل الصورة"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>

            {formattedDescription ? (
              <p
                className="whitespace-pre-line text-right text-sm leading-7 text-black dark:text-zinc-300"
                style={{ color: isDark ? undefined : "#000000" }}
              >
                {formattedDescription}
              </p>
            ) : null}

            <FeedbackSection
              comments={comments}
              isSignedIn={isSignedIn}
              currentUserId={user?.uid}
              currentUserName={userProfile?.displayName?.trim() || "مستخدم"}
              isAdmin={isAdmin}
              onLogin={() => router.push("/login")}
              isSaving={isCommentSaving}
              onSubmitFeedback={async (value, identityMode) => {
                if (!user || !id || !value.trim()) return;
                setIsCommentSaving(true);
                try {
                  const commentId = await createWallpaperComment({
                    wallpaperId: id,
                    userId: user.uid,
                    userDisplayName: userProfile?.displayName?.trim() || "مستخدم",
                    displayIdentityMode: identityMode,
                    content: value,
                    isAdminAuthor: isAdmin,
                  });

                  appendComment({
                    id: commentId,
                    wallpaperId: id,
                    userId: user.uid,
                    userDisplayName: userProfile?.displayName?.trim() || "مستخدم",
                    displayIdentityMode: identityMode,
                    isAnonymous: identityMode !== "real",
                    content: value.trim(),
                    isAdminAuthor: isAdmin,
                    isAdminReply: false,
                    parentId: null,
                    createdAt: toClientTimestamp(),
                    updatedAt: toClientTimestamp(),
                  });
                } finally {
                  setIsCommentSaving(false);
                }
              }}
              onSubmitReply={async (parentId, value, identityMode) => {
                if (!user || !id || !value.trim()) return;
                setIsCommentSaving(true);
                try {
                  const commentId = await createWallpaperComment({
                    wallpaperId: id,
                    userId: user.uid,
                    userDisplayName: userProfile?.displayName?.trim() || "مستخدم",
                    displayIdentityMode: identityMode,
                    content: value,
                    parentId,
                    isAdminReply: isAdmin,
                    isAdminAuthor: isAdmin,
                  });

                  appendComment({
                    id: commentId,
                    wallpaperId: id,
                    userId: user.uid,
                    userDisplayName: userProfile?.displayName?.trim() || "مستخدم",
                    displayIdentityMode: identityMode,
                    isAnonymous: identityMode !== "real",
                    content: value.trim(),
                    isAdminReply: isAdmin,
                    isAdminAuthor: isAdmin,
                    parentId,
                    createdAt: toClientTimestamp(),
                    updatedAt: toClientTimestamp(),
                  });
                } finally {
                  setIsCommentSaving(false);
                }
              }}
              onEditComment={async (comment, value) => {
                if (!user || !comment.id || !value.trim()) return;
                const isOwner = comment.userId === user.uid;
                if (!isOwner) return;
                setIsCommentSaving(true);
                try {
                  await updateWallpaperComment({
                    commentId: comment.id,
                    content: value,
                  });
                  updateCommentInState(comment.id, (item) => ({
                    ...item,
                    content: value.trim(),
                    updatedAt: toClientTimestamp(),
                  }));
                } finally {
                  setIsCommentSaving(false);
                }
              }}
              onDeleteComment={async (comment, replyIds) => {
                if (!user || !comment.id) return;
                const isOwner = comment.userId === user.uid;
                if (!isOwner && !isAdmin) return;
                setIsCommentSaving(true);
                try {
                  await deleteWallpaperComment({
                    commentId: comment.id,
                    replyIds,
                  });
                  removeCommentTree(comment.id, replyIds);
                } finally {
                  setIsCommentSaving(false);
                }
              }}
            />
          </section>
        </div>
      </article>


      {suggestedWallpapers.length > 0 ? (
        <section className="mx-auto mt-5 w-full max-w-6xl space-y-3 lg:max-w-[88rem]">
          <div className="[direction:rtl]">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">اقتراح خلفيات من نفس الصنف</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {suggestedWallpapers.map((suggested) => (
              <PublicWallpaperCard key={suggested.id} wallpaper={suggested} titleClassName="line-clamp-2 text-sm font-semibold text-zinc-900" />
            ))}
          </div>
        </section>
      ) : null}

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
          title={displayTitle}
        />
      )}
    </main>
  );
}
