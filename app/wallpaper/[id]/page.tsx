"use client";

import "swiper/css";
import "swiper/css/navigation";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, MessageCircle, Send, Star } from "lucide-react";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { DeleteConfirmDialog } from "@/app/_components/delete-confirm-dialog";
import { ImageLightbox } from "@/app/_components/image-lightbox";
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
  const [commentText, setCommentText] = useState("");
  const [replyByParent, setReplyByParent] = useState<Record<string, string>>({});
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

  const rootComments = useMemo(() => comments.filter((item) => !item.parentId), [comments]);
  const repliesByParent = useMemo(() => {
    const map = new Map<string, WallpaperComment[]>();
    comments
      .filter((item) => Boolean(item.parentId))
      .forEach((item) => {
        const key = item.parentId as string;
        const existing = map.get(key) ?? [];
        existing.push(item);
        map.set(key, existing);
      });
    return map;
  }, [comments]);

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
                  aria-label="التعليقات"
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
          </section>
        </div>

        <section id="comments" className="mt-5 space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 [direction:rtl]">
          <h2 className="text-base font-bold text-zinc-900">التعليقات</h2>

          {isSignedIn ? (
            <form
              className="space-y-2"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!user || !id || !commentText.trim()) return;
                setIsCommentSaving(true);
                try {
                  await createWallpaperComment({
                    wallpaperId: id,
                    userId: user.uid,
                    userDisplayName: userProfile?.displayName?.trim() || "مستخدم",
                    content: commentText,
                  });
                  setCommentText("");
                  await loadComments();
                } finally {
                  setIsCommentSaving(false);
                }
              }}
            >
              <textarea
                rows={3}
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="اكتب تعليقك هنا..."
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
              />
              <button
                type="submit"
                disabled={isCommentSaving || !commentText.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                <Send size={14} />
                إرسال التعليق
              </button>
            </form>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
              <p>يرجى تسجيل الدخول لإضافة تعليق.</p>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="mt-2 rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white"
              >
                تسجيل الدخول
              </button>
            </div>
          )}

          {rootComments.length === 0 ? (
            <p className="text-sm text-zinc-500">لا توجد تعليقات حتى الآن.</p>
          ) : (
            <div className="space-y-3">
              {rootComments.map((comment) => (
                <article key={comment.id} className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-xs font-bold text-zinc-900">{comment.userDisplayName}</p>
                  <p className="text-sm text-zinc-700">{comment.content}</p>

                  {(repliesByParent.get(comment.id ?? "") ?? []).map((reply) => (
                    <div key={reply.id} className="mr-4 rounded-lg border border-zinc-200 bg-white p-2">
                      <p className="text-xs font-bold text-zinc-900">
                        {reply.userDisplayName} {reply.isAdminReply ? "• الإدارة" : ""}
                      </p>
                      <p className="text-sm text-zinc-700">{reply.content}</p>
                    </div>
                  ))}

                  {userProfile?.role === "admin" ? (
                    <form
                      className="mr-4 flex items-center gap-2"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        if (!user || !id || !comment.id) return;
                        const value = (replyByParent[comment.id] ?? "").trim();
                        if (!value) return;
                        await createWallpaperComment({
                          wallpaperId: id,
                          userId: user.uid,
                          userDisplayName: userProfile?.displayName?.trim() || "الإدارة",
                          content: value,
                          parentId: comment.id,
                          isAdminReply: true,
                        });
                        setReplyByParent((prev) => ({ ...prev, [comment.id as string]: "" }));
                        await loadComments();
                      }}
                    >
                      <input
                        value={replyByParent[comment.id ?? ""] ?? ""}
                        onChange={(event) =>
                          setReplyByParent((prev) => ({ ...prev, [comment.id as string]: event.target.value }))
                        }
                        placeholder="رد الإدارة"
                        className="flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-zinc-900 bg-zinc-900 px-2 py-1.5 text-xs font-semibold text-white"
                      >
                        رد
                      </button>
                    </form>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
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
