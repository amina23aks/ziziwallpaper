"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { listRecentWallpapers } from "@/lib/firestore/wallpapers";
import type { Wallpaper } from "@/types/wallpaper";

export default function AdminDashboardPage() {
  const [recentWallpapers, setRecentWallpapers] = useState<Wallpaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRecentWallpapers() {
      try {
        const data = await listRecentWallpapers(6);
        setRecentWallpapers(data);
      } finally {
        setIsLoading(false);
      }
    }

    loadRecentWallpapers();
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-extrabold text-zinc-900">لوحة الإدارة</h1>
        <p className="mt-1 text-sm text-zinc-700">اختر الإجراء المطلوب لإدارة المحتوى.</p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/admin/wallpapers/new"
          className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-900 shadow-sm"
        >
          إضافة خلفية
        </Link>
        <Link
          href="/admin/wallpapers"
          className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-900 shadow-sm"
        >
          إدارة الخلفيات
        </Link>
        <Link
          href="/admin/categories"
          className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-900 shadow-sm"
        >
          إدارة التصنيفات
        </Link>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-zinc-900">أحدث الخلفيات</h2>
        {isLoading ? (
          <p className="text-sm text-zinc-600">جاري التحميل...</p>
        ) : recentWallpapers.length === 0 ? (
          <p className="text-sm text-zinc-600">لا توجد خلفيات حالياً.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {recentWallpapers.map((wallpaper, index) => (
              <article key={wallpaper.id ?? index} className="space-y-2">
                <div className="relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                  {wallpaper.images?.[0]?.secureUrl && (
                    <Image
                      src={wallpaper.images[0].secureUrl}
                      alt={wallpaper.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 45vw, 180px"
                      unoptimized
                    />
                  )}
                </div>
                <p className="line-clamp-1 text-sm font-semibold text-zinc-900">{wallpaper.title}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
