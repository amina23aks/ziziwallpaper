"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteWallpaper, listWallpapers } from "@/lib/firestore/wallpapers";
import type { Wallpaper } from "@/types/wallpaper";

export default function AdminWallpapersPage() {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string>("");

  async function loadWallpapers() {
    setIsLoading(true);
    try {
      const data = await listWallpapers(30);
      setWallpapers(data);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadWallpapers();
  }, []);

  const handleDelete = async (id?: string) => {
    if (!id) return;

    try {
      await deleteWallpaper(id);
      setWallpapers((prev) => prev.filter((item) => item.id !== id));
      setStatusMessage("تم حذف الخلفية بنجاح.");
    } catch {
      setStatusMessage("تعذر حذف الخلفية حالياً.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 sm:text-3xl">إدارة الخلفيات</h1>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">عرض الخلفيات وتحريرها بسرعة.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
          >
            ⌂ الرئيسية
          </Link>
          <Link
            href="/admin/wallpapers/new"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            + إضافة خلفية
          </Link>
        </div>
      </header>

      {statusMessage && (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          {statusMessage}
        </div>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
        {isLoading ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">جاري تحميل الخلفيات...</p>
        ) : wallpapers.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">لا توجد خلفيات محفوظة حتى الآن.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {wallpapers.map((wallpaper, index) => (
              <article
                key={wallpaper.id ?? index}
                className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-950">
                  {wallpaper.images?.[0]?.secureUrl ? (
                    <Image
                      src={wallpaper.images[0].secureUrl}
                      alt={wallpaper.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 50vw, 33vw"
                      unoptimized
                    />
                  ) : null}
                </div>

                <div className="space-y-2 p-3">
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{wallpaper.title}</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    التصنيفات: {wallpaper.categorySlugs?.join("، ") || "—"}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    الحالة: {wallpaper.isPublished ? "منشورة" : "غير منشورة"}
                  </p>

                  <div className="flex gap-2 pt-1">
                    <Link
                      href={wallpaper.id ? `/admin/wallpapers/${wallpaper.id}/edit` : "#"}
                      className="inline-flex min-h-9 flex-1 items-center justify-center rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
                    >
                      ✏️ تعديل
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(wallpaper.id)}
                      className="inline-flex min-h-9 flex-1 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
