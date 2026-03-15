"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AdminTopBar } from "@/app/admin/_components/admin-top-bar";
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
    <main className="mx-auto w-full max-w-6xl space-y-5 bg-zinc-950 px-4 py-6 sm:px-6 lg:px-8">
      <AdminTopBar
        title="الخلفيات"
        subtitle="إدارة الخلفيات"
        leading={
          <div className="flex flex-col items-start gap-2">
            <Link
              href="/admin"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100"
              aria-label="رجوع"
            >
              ←
            </Link>
            <Link
              href="/admin/wallpapers/new"
              className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900"
            >
              <Plus size={13} />
              <span>إضافة خلفية</span>
            </Link>
          </div>
        }
      />

      {statusMessage && (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800">
          {statusMessage}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {isLoading ? (
          <p className="p-4 text-sm text-zinc-600">جاري تحميل الخلفيات...</p>
        ) : wallpapers.length === 0 ? (
          <p className="p-4 text-sm text-zinc-600">لا توجد خلفيات محفوظة حتى الآن.</p>
        ) : (
          <div className="divide-y divide-zinc-200">
            {wallpapers.map((wallpaper, index) => (
              <article
                key={wallpaper.id ?? index}
                className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 p-3 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
                  {wallpaper.images?.[0]?.secureUrl ? (
                    <Image
                      src={wallpaper.images[0].secureUrl}
                      alt={wallpaper.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized
                    />
                  ) : null}
                </div>

                <div className="min-w-0 space-y-1">
                  <p className="line-clamp-1 text-sm font-semibold text-zinc-900">{wallpaper.title}</p>
                  <p className="line-clamp-1 text-xs text-zinc-600">
                    {wallpaper.categorySlugs?.join("، ") || "بدون تصنيف"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    الحالة: {wallpaper.isPublished ? "منشورة" : "غير منشورة"}
                  </p>
                </div>

                <div className="col-span-2 flex gap-2 sm:col-auto sm:justify-end">
                  <Link
                    href={wallpaper.id ? `/admin/wallpapers/${wallpaper.id}/edit` : "#"}
                    className="inline-flex flex-1 items-center justify-center rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-800 sm:flex-none"
                  >
                    تعديل
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(wallpaper.id)}
                    className="inline-flex flex-1 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 sm:flex-none"
                  >
                    حذف
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
