"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { listRecentWallpapers } from "@/lib/firestore/wallpapers";
import { AdminTopBar } from "@/app/admin/_components/admin-top-bar";
import { useAuth } from "@/app/_providers/auth-provider";
import { isSuperAdminRole } from "@/lib/auth/roles";
import type { Wallpaper } from "@/types/wallpaper";

export default function AdminDashboardPage() {
  const { userProfile } = useAuth();
  const isSuperAdmin = isSuperAdminRole(userProfile);
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
    <main className="mx-auto w-full max-w-5xl space-y-5 bg-zinc-50 px-4 py-6 sm:px-6 lg:px-8 dark:bg-zinc-950">
      <AdminTopBar
        title="لوحة الإدارة"
        subtitle="إدارة المحتوى"
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/admin/wallpapers/new"
          className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        >
          إضافة خلفية
        </Link>
        <Link
          href="/admin/wallpapers"
          className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        >
          إدارة الخلفيات
        </Link>
        <Link
          href="/admin/categories"
          className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        >
          إدارة التصنيفات
        </Link>
        <Link
          href="/admin/questions"
          className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        >
          إدارة الأسئلة
        </Link>
        {isSuperAdmin ? (
          <Link
            href="/admin/users"
            className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          >
            إدارة المستخدمين
          </Link>
        ) : null}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-lg font-bold text-zinc-900 dark:text-zinc-100">أحدث الخلفيات</h2>
        {isLoading ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">جاري التحميل...</p>
        ) : recentWallpapers.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">لا توجد خلفيات حالياً.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {recentWallpapers.map((wallpaper, index) => (
              <article key={wallpaper.id ?? index} className="space-y-2">
                <div className="relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
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
                <p className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{wallpaper.title}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
