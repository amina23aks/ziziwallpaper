"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getWallpaperStats, listRecentWallpapers } from "@/lib/firestore/wallpapers";
import type { Wallpaper } from "@/types/wallpaper";

type Stats = {
  total: number;
  published: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, published: 0 });
  const [recentWallpapers, setRecentWallpapers] = useState<Wallpaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsResult, recentResult] = await Promise.all([
          getWallpaperStats(),
          listRecentWallpapers(6),
        ]);

        setStats(statsResult);
        setRecentWallpapers(recentResult);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white p-5 shadow-sm sm:p-7">
        <h1 className="text-2xl font-extrabold text-zinc-900 sm:text-3xl">لوحة الإدارة</h1>
        <p className="mt-2 text-sm text-zinc-700 sm:text-base">
          إدارة الخلفيات والتصنيفات عبر تجربة منظمة وسريعة تشبه لوحات التجارة الحديثة.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-zinc-600">إجمالي الخلفيات</p>
          <p className="mt-2 text-3xl font-extrabold text-zinc-900">{stats.total}</p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-zinc-600">الخلفيات الظاهرة للمستخدم</p>
          <p className="mt-2 text-3xl font-extrabold text-zinc-900">{stats.published}</p>
        </article>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-zinc-900">إجراءات سريعة</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link href="/admin/wallpapers/new" className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300">
            <p className="text-sm font-bold text-zinc-900">إضافة خلفية</p>
            <p className="mt-1 text-sm text-zinc-700">إنشاء خلفية جديدة ورفع الصور.</p>
          </Link>
          <Link href="/admin/wallpapers" className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300">
            <p className="text-sm font-bold text-zinc-900">إدارة الخلفيات</p>
            <p className="mt-1 text-sm text-zinc-700">استعراض وتعديل وحذف الخلفيات.</p>
          </Link>
          <Link href="/admin/categories" className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300">
            <p className="text-sm font-bold text-zinc-900">إدارة التصنيفات</p>
            <p className="mt-1 text-sm text-zinc-700">إضافة وتنظيم التصنيفات.</p>
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900">أحدث 6 خلفيات</h2>
          <Link href="/admin/wallpapers" className="text-sm font-semibold text-zinc-700 hover:text-zinc-900">
            عرض الكل
          </Link>
        </div>

        {isLoading ? (
          <p className="text-sm text-zinc-600">جاري تحميل البيانات...</p>
        ) : recentWallpapers.length === 0 ? (
          <p className="text-sm text-zinc-600">لا توجد خلفيات بعد.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {recentWallpapers.map((wallpaper, index) => (
              <article key={wallpaper.id ?? index} className="space-y-2">
                <div className="relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                  {wallpaper.images?.[0]?.secureUrl ? (
                    <Image src={wallpaper.images[0].secureUrl} alt={wallpaper.title} fill className="object-cover" sizes="(max-width: 640px) 45vw, 180px" unoptimized />
                  ) : null}
                </div>
                <p className="line-clamp-1 text-sm font-medium text-zinc-900">{wallpaper.title}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
